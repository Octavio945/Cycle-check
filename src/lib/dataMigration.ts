import { AppState, Bike, BikePart } from '@/types';

// Dictionnaire des fusions et corrections
export const RENAME_MAP: Record<string, string> = {
  'Bille central': 'Bille centrale',
  'Pillons': 'Pignons',
  'Tuyau scelle': 'Tuyau selle',
  'Cabre frein complet': 'Câble frein complet',
  'Pillons chaine': 'Chaîne + pignons',
  'Chaine pillons': 'Chaîne + pignons',
};

// Prix fixes (en FCFA) pour le calcul des devis
export const PART_PRICES: Record<string, number> = {
  'Axe central': 2500,
  'Pédales': 1200,
  'Câble frein': 300,
  'Caoutchouc guidon': 1000,
  // 'Cadre panneau': undefined,
  'Rayon': 2500,
  'Chaîne': 1300,
  'Pneu avant': 2700,
  'Selle': 2500,
  'Klaxon': 500,
  'Axe moyeu': 1000,
  'Pneu arrière': 2700,
  'Chambre à air avant': 1200,
  'Chambre à air arrière': 1200,
  'Patin de frein': 100,
  'Bille centrale': 1000,
  'Bras frein': 1000,
  'Frein complet': 2600,
  'Pignons': 1200,
  // 'Cadre vélo': undefined,
  'Patin complet': 1000,
  'Maillot': 1500,
  'Rayon complet': 2500,
  'Maillot complet': 3000,
  'Tuyau selle': 1500,
  'Câble frein complet': 300,
  'Chaîne + pignons': 2500,
};

/**
 * Fonction pour nettoyer les données actuelles de l'application (Zustand/LocalStorage).
 * Elle remplace les noms contenant des fautes par les noms corrigés,
 * et supprime les éventuels doublons de pièces de base.
 */
export const cleanDuplicateData = (state: AppState) => {
  let modified = false;

  // 1. Nettoyer les pièces de base (baseParts)
  const newBaseParts = [...state.baseParts];
  let basePartsChanged = false;

  newBaseParts.forEach((part, index) => {
    if (RENAME_MAP[part.name]) {
      newBaseParts[index] = { ...part, name: RENAME_MAP[part.name] };
      basePartsChanged = true;
    }
  });

  // Dédupliquer les pièces de base (si deux "Bille centrale" existent après merge)
  const uniqueBaseParts = [];
  const seenNames = new Set<string>();
  
  for (const part of newBaseParts) {
    if (!seenNames.has(part.name)) {
      uniqueBaseParts.push(part);
      seenNames.add(part.name);
    } else {
      basePartsChanged = true; // Un doublon a été retiré
    }
  }

  // 2. Nettoyer les pièces dans chaque vélo
  const newBikes = state.bikes.map((bike: Bike) => {
    let bikeChanged = false;
    const newParts = bike.parts.map((part: BikePart) => {
      if (RENAME_MAP[part.name]) {
        bikeChanged = true;
        return { ...part, name: RENAME_MAP[part.name] };
      }
      return part;
    });

    // S'il y a des doublons dans le même vélo après renommage (ex: il avait "Pillons" et "Pignons")
    // On garde le pire statut (replace > repair > good)
    const STATUS_WEIGHT = { replace: 2, repair: 1, good: 0 };
    const uniquePartsMap = new Map();
    
    newParts.forEach((part: BikePart) => {
      if (uniquePartsMap.has(part.name)) {
        bikeChanged = true;
        const existing = uniquePartsMap.get(part.name);
        const wNew = STATUS_WEIGHT[part.status as 'replace'|'repair'|'good'] || 0;
        const wOld = STATUS_WEIGHT[existing.status as 'replace'|'repair'|'good'] || 0;
        if (wNew > wOld) {
          uniquePartsMap.set(part.name, part);
        }
      } else {
        uniquePartsMap.set(part.name, part);
      }
    });

    return bikeChanged ? { ...bike, parts: Array.from(uniquePartsMap.values()) } : bike;
  });

  if (basePartsChanged || JSON.stringify(state.bikes) !== JSON.stringify(newBikes)) {
    modified = true;
  }

  return {
    modified,
    newBaseParts: uniqueBaseParts,
    newBikes
  };
};
