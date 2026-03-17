import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bike, BikePart } from '../types';

type ReportType = 'repair' | 'replace';

export const generatePDFReport = (bikes: Bike[], type: ReportType) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
  
  // Titre du document
  const title = type === 'repair' 
    ? 'Rapport : Vélos avec pièces à réparer' 
    : 'Rapport : Vélos avec pièces à changer';
  
  doc.setFontSize(20);
  doc.setTextColor(type === 'repair' ? '#eab308' : '#ef4444');
  doc.text(title, 14, 22);

  // Sous-titre
  doc.setFontSize(11);
  doc.setTextColor('#6b7280');
  doc.text(`Généré le ${dateStr}`, 14, 30);
  
  // Préparation des données pour le tableau
  const tableData: string[][] = [];
  
  bikes.forEach(bike => {
    // Filtrer les pièces selon le type du rapport
    const concernedParts = bike.parts.filter(p => p.status === type);
    
    if (concernedParts.length > 0) {
      const partsText = concernedParts.map(p => 
        `- ${p.name} ${p.isSpecific ? '(Spécifique)' : ''}`
      ).join('\n');
      
      const lastUpdate = format(new Date(bike.updatedAt), 'dd/MM/yyyy HH:mm');
      
      tableData.push([
        bike.id,
        partsText,
        lastUpdate
      ]);
    }
  });

  // Si on a des données, on dessine le tableau
  if (tableData.length > 0) {
    autoTable(doc, {
      startY: 40,
      head: [['ID du Vélo', 'Pièces concernées', 'Dernière MAJ']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: type === 'repair' ? [234, 179, 8] : [239, 68, 68],
        textColor: 255
      },
      styles: {
        cellPadding: 4,
        fontSize: 10,
        valign: 'middle'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 40 }
      }
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor('#374151');
    doc.text('Aucun vélo ne correspond à ce critère.', 14, 50);
  }

  // Sauvegarde du fichier
  const fileName = `CycleCheck_${type === 'repair' ? 'Reparation' : 'Remplacement'}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(fileName);
};
