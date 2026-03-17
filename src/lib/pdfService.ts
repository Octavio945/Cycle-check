import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bike, BikePart } from '../types';

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
  const partMap = new Map<string, string>(); // id → name
  bikes.forEach(bike => {
    bike.parts.forEach(p => {
      if (!partMap.has(p.name)) partMap.set(p.name, p.name);
    });
  });
  const allPartNames = Array.from(partMap.values()); // ordre d'apparition

  // ── 2. Header ──────────────────────────────────────────────────────────────
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

  const descriptionText =
    "Ce tableau croise la liste complète des vélos avec l'ensemble des pièces enregistrées. " +
    "Pour chaque vélo et chaque pièce, l'action sélectionnée (Réparer / Remplacer) est indiquée. " +
    "Les colonnes Prix Unitaire et Total sont laissées vides pour être complétées manuellement.";
  const splittedDesc = doc.splitTextToSize(descriptionText, 269);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.slate500);
  doc.text(splittedDesc, 14, 40);

  const startY = 40 + splittedDesc.length * 5 + 6;

  // ── 3. Construction de la table ───────────────────────────────────────────
  // En-tête : 1ère colonne = Vélo, puis pour chaque pièce 3 colonnes
  const head1: string[] = ['Vélo'];
  const head2: string[] = [''];
  allPartNames.forEach(name => {
    // Nom tronqué pour l'en-tête (max 14 car.)
    const shortName = name.length > 14 ? name.substring(0, 13) + '…' : name;
    head1.push(shortName, '', '');
    head2.push('Action', 'P.U. (€)', 'Total (€)');
  });
  head1.push('TOTAL');
  head2.push('Général');

  // Lignes vélos
  const body: (string | { content: string; styles?: object })[][] = bikes.map(bike => {
    const row: (string | { content: string; styles?: object })[] = [
      { content: bike.id, styles: { fontStyle: 'bold', textColor: COLORS.primary } }
    ];
    allPartNames.forEach(partName => {
      const part = bike.parts.find((p: BikePart) => p.name === partName);
      let actionLabel = '';
      let actionColor = COLORS.slate500;
      if (part?.status === 'repair') { actionLabel = 'Réparer'; actionColor = COLORS.warning; }
      else if (part?.status === 'replace') { actionLabel = 'Remplacer'; actionColor = COLORS.danger; }
      row.push(
        { content: actionLabel, styles: { textColor: actionColor, fontStyle: actionLabel ? 'bold' : 'normal' } },
        '',  // Prix Unitaire — vide
        ''   // Total — vide
      );
    });
    row.push(''); // Colonne Total Général — vide
    return row;
  });

  // Ligne récapitulative (totaux)
  const totalRow: (string | { content: string; styles?: object })[] = [
    { content: 'TOTAL INTERVENTIONS', styles: { fontStyle: 'bold', textColor: COLORS.slate800 } }
  ];
  allPartNames.forEach(partName => {
    const count = bikes.reduce((acc, bike) => {
      const p = bike.parts.find((pt: BikePart) => pt.name === partName);
      return acc + (p && (p.status === 'repair' || p.status === 'replace') ? 1 : 0);
    }, 0);
    totalRow.push(
      { content: count > 0 ? `${count} vélo(s)` : '—', styles: { fontStyle: 'bold', textColor: count > 0 ? COLORS.slate800 : COLORS.slate300 } },
      '',  // Prix Unitaire Total vide
      ''   // Montant Total vide
    );
  });
  totalRow.push(''); // Total Général vide

  // ── 4. Calcul dynamique des largeurs de colonnes ───────────────────────────
  // Page paysage A4 : 297mm → zone utile ≈ 269mm (marges 14mm de chaque côté)
  const usableWidth = 269;
  const bikeColWidth = 28;
  const totalColWidth = 22;
  const remainingWidth = usableWidth - bikeColWidth - totalColWidth;
  // Chaque pièce = 3 colonnes. On répartit équitablement selon le nombre de pièces.
  const partGroupWidth = allPartNames.length > 0 ? remainingWidth / allPartNames.length : remainingWidth;
  const actionColWidth = Math.max(18, partGroupWidth * 0.45);
  const priceColWidth  = Math.max(14, partGroupWidth * 0.28);
  const partTotalColWidth = Math.max(14, partGroupWidth * 0.27);

  const columnStyles: Record<number, object> = {
    0: { cellWidth: bikeColWidth },
  };
  allPartNames.forEach((_, i) => {
    columnStyles[1 + i * 3 + 0] = { cellWidth: actionColWidth, halign: 'center' };
    columnStyles[1 + i * 3 + 1] = { cellWidth: priceColWidth,  halign: 'center', textColor: COLORS.slate300 };
    columnStyles[1 + i * 3 + 2] = { cellWidth: partTotalColWidth, halign: 'center', textColor: COLORS.slate300 };
  });
  columnStyles[1 + allPartNames.length * 3] = { cellWidth: totalColWidth, halign: 'center', textColor: COLORS.slate300 };

  // ── 5. AutoTable ──────────────────────────────────────────────────────────
  autoTable(doc, {
    startY,
    head: [head1, head2],
    body: [...body, totalRow],
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.slate800,
      textColor: 255 as unknown as [number, number, number],
      fontStyle: 'bold',
      fontSize: 7,
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
    columnStyles,
    // Couleur de fond pour la ligne récapitulative
    didParseCell: function(data) {
      if (data.row.index === bikes.length && data.section === 'body') {
        data.cell.styles.fillColor = [241, 245, 249] as [number, number, number]; // slate-100
      }
    },
    didDrawPage: function(data) {
      // Footer
      doc.setDrawColor(...COLORS.slate300);
      doc.setLineWidth(0.5);
      doc.line(14, 200, 283, 200);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.slate500);
      doc.text('Généré automatiquement par l\'application CycleCheck', 14, 204);
      doc.text(`Page ${data.pageNumber} sur ${doc.getNumberOfPages()}`, 283, 204, { align: 'right' });
    },
  });

  // ── 6. Sauvegarde ─────────────────────────────────────────────────────────
  const fileName = `CycleCheck_Devis_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(fileName);
};
