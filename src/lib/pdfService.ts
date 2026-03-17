import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bike, BikePart } from '../types';
import { PART_PRICES } from './dataMigration';

type ReportType = 'repair' | 'replace' | 'global' | 'shopping';

// --- Couleurs de la charte ---
const COLORS = {
  primary: [79, 70, 229] as [number, number, number],   // Indigo 600
  slate800: [30, 41, 59] as [number, number, number],   // Slate 800 (très foncé)
  slate500: [100, 116, 139] as [number, number, number], // Slate 500 (texte gris)
  slate300: [203, 213, 225] as [number, number, number], // Slate 300 (bordures/lignes)
  danger: [220, 38, 38] as [number, number, number],    // Red 600
  warning: [217, 119, 6] as [number, number, number],   // Amber 600
};

export const generatePDFReport = (bikes: Bike[], type: ReportType) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
  
  const isRepair = type === 'repair';
  const isGlobal = type === 'global';
  const isShopping = type === 'shopping';
  const accentColor = (isGlobal || isShopping) ? COLORS.primary : (isRepair ? COLORS.warning : COLORS.danger);

  // --- 1. En-tête (Header) Logo & Branding ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text('CycleCheck', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.slate500);
  doc.text('Document Technique', 196, 20, { align: 'right' });

  // Ligne de séparation élégante (Slate 300)
  doc.setDrawColor(...COLORS.slate300);
  doc.setLineWidth(0.5);
  doc.line(14, 25, 196, 25);

  // --- 2. Titre du Rapport & Description ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.slate800);
  let title = '';
  if (isShopping) title = 'Liste de Courses (Besoins Matériels)';
  else if (isGlobal) title = 'Inventaire Global de la Flotte';
  else title = isRepair ? 'Rapport : Vélos à Réparer' : 'Rapport : Pièces à Remplacer';
  doc.text(title, 14, 38);

  // Date alignée à droite
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.slate500);
  doc.text(`Édité le ${dateStr}`, 196, 38, { align: 'right' });

  // Paragraphe descriptif généré pour donner un contexte pro au document
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.slate500);
  
  let descriptionText = "";
  if (isShopping) {
    descriptionText = "Ce rapport consolide les besoins en pièces de rechange et les réparations à effectuer sur l'ensemble du parc. Il sert de liste de préparation (Shopping List) pour les achats ou le destockage atelier.";
  } else if (isGlobal) {
    descriptionText = "Ce document constitue l'inventaire complet de la flotte de vélos. Il recense l'ensemble des équipements enregistrés ainsi qu'un aperçu technique de leur état de fonctionnement actuel.";
  } else if (isRepair) {
    descriptionText = "Ce document recense l'ensemble de la flotte nécessitant des interventions de maintenance (réparations modérées). Il détaille les vélos concernés ainsi que la liste exhaustive des pièces à réviser pour faciliter la prise en charge par l'équipe technique.";
  } else {
    descriptionText = "Ce document recense l'ensemble de la flotte nécessitant le remplacement critique de pièces. Il liste les éléments défectueux devant être obligatoirement changés par l'équipe technique pour assurer la sécurité et le maintien du service.";
  }
  
  // splitTextToSize permet de gérer le retour à la ligne automatique (largeur max = 182)
  const splittedDescription = doc.splitTextToSize(descriptionText, 182);
  doc.text(splittedDescription, 14, 46);

  // --- 3. Préparation des données du Tableau ---
  const tableData: string[][] = [];
  
  if (isShopping) {
    // Rapport Shopping : Regroupement statistique par pièce et statut
    const pieceCount: Record<string, { repair: number, replace: number }> = {};
    
    bikes.forEach(bike => {
      bike.parts.forEach(p => {
        if (p.status === 'repair' || p.status === 'replace') {
          if (!pieceCount[p.name]) pieceCount[p.name] = { repair: 0, replace: 0 };
          pieceCount[p.name][p.status] += 1;
        }
      });
    });

    // Conversion en tableau
    Object.entries(pieceCount).forEach(([name, counts]) => {
      if (counts.replace > 0) {
         tableData.push([name, 'Remplacer (Urgent)', counts.replace.toString()]);
      }
      if (counts.repair > 0) {
         tableData.push([name, 'Réparer (Atelier)', counts.repair.toString()]);
      }
    });
    
    // Tri pour mettre les remplacements en premier
    tableData.sort((a, b) => b[1].localeCompare(a[1]));

  } else {
    bikes.forEach(bike => {
      if (isGlobal) {
        // Rapport global : on prend tous les vélos et on fait un résumé de l'état
        const replaceCount = bike.parts.filter(p => p.status === 'replace').length;
        const repairCount = bike.parts.filter(p => p.status === 'repair').length;
        
        let statusSummary = "Bon état général";
        if (replaceCount > 0 && repairCount > 0) statusSummary = `${replaceCount} pièce(s) à remplacer, ${repairCount} à réparer`;
        else if (replaceCount > 0) statusSummary = `${replaceCount} pièce(s) à remplacer`;
        else if (repairCount > 0) statusSummary = `${repairCount} pièce(s) à réparer`;

        const lastUpdate = format(new Date(bike.updatedAt), 'dd/MM/yyyy HH:mm');
        tableData.push([bike.id, statusSummary, lastUpdate]);

      } else {
        // Rapport spécifique (Repair ou Replace)
        const concernedParts = bike.parts.filter(p => p.status === type);
        
        if (concernedParts.length > 0) {
          const partsText = concernedParts.map(p => 
            `• ${p.name} ${p.isSpecific ? '(Ajout spécifique)' : ''}`
          ).join('\n');
          
          const lastUpdate = format(new Date(bike.updatedAt), 'dd/MM/yyyy HH:mm');
          tableData.push([bike.id, partsText, lastUpdate]);
        }
      }
    });
  }

  const startYForTable = 46 + (splittedDescription.length * 5) + 8; // Calc auto de la position Y

  // --- 4. Tableau (AutoTable) Moderne & Aéré ---
  if (tableData.length > 0) {
    autoTable(doc, {
      startY: startYForTable,
      head: [isShopping 
        ? ['Nom de la Pièce', 'Action requise', 'Quantité totale'] 
        : ['Identifiant du Vélo', isGlobal ? 'État Général' : 'Détail des pièces concernées', 'Dernière MAJ']
      ],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.slate800, // En-tête gris très foncé (Premium)
        textColor: 255,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        cellPadding: 6, // Plus d'espace (aéré)
        fontSize: 10,
        valign: 'middle',
        lineColor: COLORS.slate300,
        lineWidth: 0.1,
        font: 'helvetica',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Slate 50 (gris extrêmement clair pour zebra striping)
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45, textColor: accentColor }, // ID vélo coloré
        1: { cellWidth: 'auto' }, // Liste des pièces
        2: { cellWidth: 40, halign: 'center', textColor: COLORS.slate500 } // Date
      },
      // Draw le footer (Numéro de page)
      didDrawPage: function (data) {
        // --- 5. Pied de page (Footer) ---
        const pageCount = doc.getNumberOfPages();
        const currentPage = data.pageNumber;
        
        doc.setDrawColor(...COLORS.slate300);
        doc.setLineWidth(0.5);
        doc.line(14, 285, 196, 285);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.slate500);
        doc.text('Généré de manière automatique par l\'application CycleCheck', 14, 290);
        doc.text(`Page ${currentPage} sur ${pageCount}`, 196, 290, { align: 'right' });
      }
    });
  } else {
    // Cas où aucun vélo n'est à traiter
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.slate500);
    // On dessine un faux tableau esthétique 
    doc.rect(14, startYForTable, 182, 20, 'S'); // 'S' for stroke
    doc.text("Aucun vélo de la flotte ne nécessite d'intervention pour le moment.", 105, startYForTable + 12, { align: 'center' });
  }

  // --- 6. Sauvegarde du fichier ---
  let typeName = isGlobal ? 'Global' : (isRepair ? 'Reparation' : 'Remplacement');
  if (isShopping) typeName = 'ListeCourses';
  const fileName = `CycleCheck_${typeName}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(fileName);
};

// ---------------------------------------------------------------------------
// Rapport Tableau de Devis (matrice croisée vélos × pièces)
// ---------------------------------------------------------------------------
export const generateDevisReport = (bikes: Bike[]) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const dateStr = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });

  // ── 1. Collecte de toutes les pièces uniques (base + spécifiques) ──────────
  const partMap = new Map<string, string>();
  bikes.forEach(bike => {
    bike.parts.forEach(p => {
      if (!partMap.has(p.name)) partMap.set(p.name, p.name);
    });
  });
  const allPartNames = Array.from(partMap.values());

  // ── 2. Helpers réutilisables ───────────────────────────────────────────────
  const drawHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...COLORS.primary);
    doc.text('CycleCheck', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.slate500);
    doc.text('Document Technique', 283, 18, { align: 'right' });

    doc.setDrawColor(...COLORS.slate300);
    doc.setLineWidth(0.5);
    doc.line(14, 22, 283, 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.slate800);
    doc.text('Tableau de Devis — Pièces & Interventions', 14, 32);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.slate500);
    doc.text(`Édité le ${dateStr}`, 283, 32, { align: 'right' });
  };

  const drawFooter = (data: { pageNumber: number }) => {
    doc.setDrawColor(...COLORS.slate300);
    doc.setLineWidth(0.5);
    doc.line(14, 200, 283, 200);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slate500);
    doc.text("Généré automatiquement par l'application CycleCheck", 14, 204);
    doc.text(`Page ${data.pageNumber} sur ${doc.getNumberOfPages()}`, 283, 204, { align: 'right' });
  };

  drawHeader();

  // ── 3. TABLEAU 1 : Matrice d'état (vélos × pièces) — en tranches si besoin ─
  //
  // Calcul du nombre max de pièces par tranche pour rester dans la largeur utile
  // Page paysage A4 : zone utile ≈ 269 mm ; colonne "Vélo" = 28 mm
  // Chaque pièce = 1 colonne (Action 25 mm)
  const USABLE_W   = 269;
  const BIKE_COL_W = 28;
  const ACTION_W   = 25;
  const PART_GROUP_W = ACTION_W; // 25 mm
  const MAX_PARTS_PER_CHUNK = Math.max(1, Math.floor((USABLE_W - BIKE_COL_W) / PART_GROUP_W)); // ≈ 9

  // Découpage des pièces en tranches
  const partChunks: string[][] = [];
  for (let i = 0; i < allPartNames.length; i += MAX_PARTS_PER_CHUNK) {
    partChunks.push(allPartNames.slice(i, i + MAX_PARTS_PER_CHUNK));
  }
  if (partChunks.length === 0) partChunks.push([]);

  partChunks.forEach((chunk, chunkIndex) => {
    // Titre de section (header de page pour chaque tranche)
    if (chunkIndex === 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.slate800);
      doc.text('Tableau 1 — État des interventions par vélo', 14, 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.slate500);
      const suffix = partChunks.length > 1 ? ` (partie 1/${partChunks.length})` : '';
      doc.text(
        `Pour chaque vélo, les actions sélectionnées (Réparer / Remplacer) sont indiquées par pièce.${suffix}`,
        14, 47
      );
    }

    // En-tête à 2 niveaux pour cette tranche
    const h1: string[] = ['Vélo'];
    const h2: string[] = [''];
    chunk.forEach(name => {
      const short = name.length > 18 ? name.substring(0, 17) + '…' : name;
      h1.push(short);
      h2.push('Action');
    });

    // Lignes vélos pour cette tranche
    const bodyChunk: (string | { content: string; styles?: object })[][] = bikes.map(bike => {
      const row: (string | { content: string; styles?: object })[] = [
        { content: bike.id, styles: { fontStyle: 'bold', textColor: COLORS.primary } }
      ];
      chunk.forEach(partName => {
        const part = bike.parts.find((p: BikePart) => p.name === partName);
        let actionLabel = '';
        let actionColor = COLORS.slate300;

        if (part?.status === 'repair') {
          actionLabel = 'Réparer';
          actionColor = COLORS.warning;
        } else if (part?.status === 'replace') {
          actionLabel = 'Remplacer';
          actionColor = COLORS.danger;
        }

        row.push(
          { content: actionLabel, styles: { textColor: actionColor, fontStyle: actionLabel ? 'bold' : 'normal' } }
        );
      });
      return row;
    });

    // Ligne récap pour cette tranche
    const recapRow: (string | { content: string; styles?: object })[] = [
      { content: 'TOTAL', styles: { fontStyle: 'bold', textColor: COLORS.slate800 } }
    ];
    chunk.forEach(partName => {
      const total = bikes.filter(b =>
        b.parts.find((p: BikePart) => p.name === partName && (p.status === 'repair' || p.status === 'replace'))
      ).length;
      recapRow.push(
        { content: total > 0 ? `${total} vélo(s)` : '—', styles: { fontStyle: 'bold', textColor: total > 0 ? COLORS.slate800 : COLORS.slate300, halign: 'center' as const } }
      );
    });

    // Styles de colonnes pour cette tranche
    const chunkColStyles: Record<number, object> = { 0: { cellWidth: BIKE_COL_W } };
    chunk.forEach((_, i) => {
      chunkColStyles[1 + i] = { cellWidth: ACTION_W, halign: 'center' };
    });

    const bikesLen = bikes.length;
    autoTable(doc, {
      startY: chunkIndex === 0 ? 52 : 55, // 1er chunk = après titre, suivants = après saut de page
      head: [h1, h2],
      body: [...bodyChunk, recapRow],
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.slate800,
        textColor: 255 as unknown as [number, number, number],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
        valign: 'middle',
      },
      styles: {
        cellPadding: 3,
        fontSize: 7.5,
        valign: 'middle',
        lineColor: COLORS.slate300,
        lineWidth: 0.1,
        font: 'helvetica',
        overflow: 'ellipsize',
      },
      alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
      columnStyles: chunkColStyles,
      didParseCell: function(data) {
        if (data.row.index === bikesLen && data.section === 'body') {
          data.cell.styles.fillColor = [241, 245, 249] as [number, number, number];
        }
      },
      didDrawPage: (data) => {
        drawFooter(data);
        // Si ce n'est pas la dernière page de la dernière tranche et qu'il y a
        // plusieurs tranches, on réaffiche un mini-titre en haut de chaque page
        if (partChunks.length > 1 && chunkIndex < partChunks.length - 1) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(...COLORS.slate500);
          doc.text(`Tableau 1 — partie ${chunkIndex + 1}/${partChunks.length} (suite)`, 14, 8);
        }
      },
    });

    // Nouvelle page pour la prochaine tranche (sauf la dernière)
    if (chunkIndex < partChunks.length - 1) {
      doc.addPage();
      drawHeader();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.slate800);
      doc.text('Tableau 1 — État des interventions par vélo', 14, 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.slate500);
      doc.text(`Suite — partie ${chunkIndex + 2}/${partChunks.length}`, 14, 47);
    }
  });

  // ── 4. TABLEAU 2 : Devis financier (nouvelle page) ─────────────────────────
  doc.addPage();
  drawHeader();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.slate800);
  doc.text('Tableau 2 — Devis Financier par Pièce', 14, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slate500);
  doc.text(
    "Résumé des quantités d'interventions par pièce. Les colonnes Prix Unitaire et Montant Total sont à compléter manuellement.",
    14, 47
  );

  // Construction du tableau 2
  let globalTotalFinancial = 0;

  const body2: (string | { content: string; styles?: object })[][] = allPartNames.map(partName => {
    const repairCount  = bikes.filter(b => b.parts.find((p: BikePart) => p.name === partName && p.status === 'repair')).length;
    const replaceCount = bikes.filter(b => b.parts.find((p: BikePart) => p.name === partName && p.status === 'replace')).length;
    const total = repairCount + replaceCount;

    const unitPrice = PART_PRICES[partName];
    const amountTotal = unitPrice ? total * unitPrice : null;

    if (amountTotal) {
      globalTotalFinancial += amountTotal;
    }

    return [
      { content: partName, styles: { fontStyle: 'bold', textColor: COLORS.slate800 } },
      {
        content: repairCount > 0 ? repairCount.toString() : '—',
        styles: { textColor: repairCount > 0 ? COLORS.warning : COLORS.slate300, halign: 'center' as const, fontStyle: repairCount > 0 ? 'bold' : 'normal' }
      },
      {
        content: replaceCount > 0 ? replaceCount.toString() : '—',
        styles: { textColor: replaceCount > 0 ? COLORS.danger : COLORS.slate300, halign: 'center' as const, fontStyle: replaceCount > 0 ? 'bold' : 'normal' }
      },
      {
        content: total > 0 ? total.toString() : '—',
        styles: { fontStyle: 'bold', textColor: total > 0 ? COLORS.slate800 : COLORS.slate300, halign: 'center' as const }
      },
      unitPrice ? { content: `${unitPrice} FCFA`, styles: { halign: 'center' as const } } : '',
      amountTotal ? { content: `${amountTotal} FCFA`, styles: { fontStyle: 'bold', halign: 'center' as const } } : '',
    ];
  });

  // Ligne totaux globaux
  const totalRepairs  = bikes.reduce((acc, b) => acc + b.parts.filter((p: BikePart) => p.status === 'repair').length,  0);
  const totalReplaces = bikes.reduce((acc, b) => acc + b.parts.filter((p: BikePart) => p.status === 'replace').length, 0);

  body2.push([
    { content: 'TOTAL GÉNÉRAL', styles: { fontStyle: 'bold', textColor: COLORS.slate800 } },
    { content: totalRepairs  > 0 ? totalRepairs.toString()  : '—', styles: { fontStyle: 'bold', textColor: COLORS.warning, halign: 'center' as const } },
    { content: totalReplaces > 0 ? totalReplaces.toString() : '—', styles: { fontStyle: 'bold', textColor: COLORS.danger,  halign: 'center' as const } },
    { content: (totalRepairs + totalReplaces).toString(), styles: { fontStyle: 'bold', textColor: COLORS.slate800, halign: 'center' as const } },
    '',
    { content: globalTotalFinancial > 0 ? `${globalTotalFinancial} FCFA` : '', styles: { fontStyle: 'bold', textColor: COLORS.primary, halign: 'center' as const } },
  ]);

  autoTable(doc, {
    startY: 52,
    head: [['Pièce', 'Qté à Réparer', 'Qté à Remplacer', 'Total Interventions', 'Prix Unitaire (FCFA)', 'Montant Total (FCFA)']],
    body: body2,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.slate800,
      textColor: 255 as unknown as [number, number, number],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
    },
    styles: {
      cellPadding: 5,
      fontSize: 9,
      valign: 'middle',
      lineColor: COLORS.slate300,
      lineWidth: 0.2,
      font: 'helvetica',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 38, halign: 'center' },
      3: { cellWidth: 40, halign: 'center' },
      4: { cellWidth: 48, halign: 'center', textColor: COLORS.slate300 },
      5: { cellWidth: 48, halign: 'center', textColor: COLORS.slate300 },
    },
    didParseCell: function(data) {
      if (data.row.index === allPartNames.length && data.section === 'body') {
        data.cell.styles.fillColor = [241, 245, 249] as [number, number, number];
      }
    },
    didDrawPage: drawFooter,
  });

  // ── 5. TABLEAU 3 : Coût par Vélo (nouvelle page) ───────────────────────────
  doc.addPage();
  drawHeader();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.slate800);
  doc.text('Tableau 3 — Coût des interventions par Vélo', 14, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slate500);
  doc.text(
    "Coût estimé (FCFA) par vélo selon les interventions demandées et le dictionnaire de prix défini.",
    14, 47
  );

  const body3: (string | { content: string; styles?: object; colSpan?: number })[][] = [];
  let totalBikesReplaceCost = 0;
  let totalBikesRepairCost  = 0;

  bikes.forEach(bike => {
    let replaceCount = 0;
    let repairCount = 0;
    let costReplace = 0;
    let costRepair = 0;

    bike.parts.forEach((p: BikePart) => {
      if (p.status === 'replace') {
        replaceCount++;
        costReplace += (PART_PRICES[p.name] || 0);
      } else if (p.status === 'repair') {
        repairCount++;
        costRepair += (PART_PRICES[p.name] || 0);
      }
    });

    if (replaceCount > 0 || repairCount > 0) {
      totalBikesReplaceCost += costReplace;
      totalBikesRepairCost  += costRepair;

      let costStr = '';
      if (costReplace > 0) {
        costStr = `${costReplace} FCFA`;
      } else if (costReplace === 0 && costRepair === 0) {
        costStr = '—';
      }
      
      // User requested format: "lors il y a des vélo sui on des trucs a reparer on aura le prix ... entre parenthese (plus le pris des piece a reparer )"
      if (costRepair > 0) {
        costStr += costStr ? ` (plus ${costRepair} FCFA pour les pièces à réparer)` : `(plus ${costRepair} FCFA pour les pièces à réparer)`;
      }

      body3.push([
        { content: bike.id, styles: { fontStyle: 'bold', textColor: COLORS.primary } },
        { content: replaceCount > 0 ? replaceCount.toString() : '—', styles: { textColor: replaceCount > 0 ? COLORS.danger : COLORS.slate300, halign: 'center' as const, fontStyle: replaceCount > 0 ? 'bold' : 'normal' } },
        { content: repairCount > 0 ? repairCount.toString() : '—', styles: { textColor: repairCount > 0 ? COLORS.warning : COLORS.slate300, halign: 'center' as const, fontStyle: repairCount > 0 ? 'bold' : 'normal' } },
        { content: costStr, styles: { fontStyle: 'bold', textColor: COLORS.slate800, halign: 'center' as const } }
      ]);
    }
  });

  if (body3.length === 0) {
    body3.push([
      { content: "Aucune intervention estimable sur les vélos", colSpan: 4, styles: { halign: 'center' as const, textColor: COLORS.slate500 } }
    ]);
    // Remplir une ligne factice pour que le tableau ne plante pas
  } else {
    let totalCostStr = `${totalBikesReplaceCost} FCFA`;
    if (totalBikesRepairCost > 0) {
       totalCostStr += ` (plus ${totalBikesRepairCost} FCFA pour les pièces à réparer)`;
    }

    body3.push([
      { content: 'TOTAL GÉNÉRAL', styles: { fontStyle: 'bold', textColor: COLORS.slate800 } },
      { content: totalReplaces.toString(), styles: { fontStyle: 'bold', textColor: COLORS.danger, halign: 'center' as const } },
      { content: totalRepairs.toString(), styles: { fontStyle: 'bold', textColor: COLORS.warning, halign: 'center' as const } },
      { content: totalCostStr, styles: { fontStyle: 'bold', textColor: COLORS.primary, halign: 'center' as const } }
    ]);
  }

  autoTable(doc, {
    startY: 52,
    head: [['Vélo', 'Nb Pièces à Remplacer', 'Nb Pièces à Réparer', "Coût estimé"]],
    body: body3 as any,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.slate800,
      textColor: 255 as unknown as [number, number, number],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
    },
    styles: { cellPadding: 5, fontSize: 9, valign: 'middle', lineColor: COLORS.slate300, lineWidth: 0.2, font: 'helvetica' },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 45, halign: 'center' },
      2: { cellWidth: 45, halign: 'center' },
      3: { cellWidth: 125, halign: 'center' },
    },
    didParseCell: function(data) {
      if (body3.length > 1 && data.row.index === body3.length - 1 && data.section === 'body') {
        data.cell.styles.fillColor = [241, 245, 249] as [number, number, number];
      }
    },
    didDrawPage: drawFooter,
  });

  // ── 6. Sauvegarde ─────────────────────────────────────────────────────────
  const fileName = `CycleCheck_Devis_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(fileName);
};
