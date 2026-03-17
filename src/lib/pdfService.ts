import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bike, BikePart } from '../types';

type ReportType = 'repair' | 'replace';

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
  const accentColor = isRepair ? COLORS.warning : COLORS.danger;

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
  const title = isRepair ? 'Rapport : Vélos à Réparer' : 'Rapport : Pièces à Remplacer';
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
  
  const descriptionText = isRepair
    ? "Ce document recense l'ensemble de la flotte nécessitant des interventions de maintenance (réparations modérées). Il détaille les vélos concernés ainsi que la liste exhaustive des pièces à réviser pour faciliter la prise en charge par l'équipe technique."
    : "Ce document recense l'ensemble de la flotte nécessitant le remplacement critique de pièces. Il liste les éléments défectueux devant être obligatoirement changés par l'équipe technique pour assurer la sécurité et le maintien du service.";
  
  // splitTextToSize permet de gérer le retour à la ligne automatique (largeur max = 182)
  const splittedDescription = doc.splitTextToSize(descriptionText, 182);
  doc.text(splittedDescription, 14, 46);

  // --- 3. Préparation des données du Tableau ---
  const tableData: string[][] = [];
  
  bikes.forEach(bike => {
    // Filtrer les pièces selon le type du rapport
    const concernedParts = bike.parts.filter(p => p.status === type);
    
    if (concernedParts.length > 0) {
      const partsText = concernedParts.map(p => 
        `• ${p.name} ${p.isSpecific ? '(Ajout spécifique)' : ''}`
      ).join('\n');
      
      const lastUpdate = format(new Date(bike.updatedAt), 'dd/MM/yyyy HH:mm');
      
      tableData.push([
        bike.id,
        partsText,
        lastUpdate
      ]);
    }
  });

  const startYForTable = 46 + (splittedDescription.length * 5) + 8; // Calc auto de la position Y

  // --- 4. Tableau (AutoTable) Moderne & Aéré ---
  if (tableData.length > 0) {
    autoTable(doc, {
      startY: startYForTable,
      head: [['Identifiant du Vélo', 'Détail des pièces concernées', 'Dernière MAJ']],
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
  const fileName = `CycleCheck_${type === 'repair' ? 'Reparation' : 'Remplacement'}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(fileName);
};
