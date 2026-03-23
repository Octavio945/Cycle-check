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

// Prix fixes (en FCFA) pour le calcul des devis — catalogue complet de pièces de vélo
export const PART_PRICES: Record<string, number> = {
  // ── Transmission ─────────────────────────────────────────────────
  'Chaîne': 1300,
  'Chaîne + pignons': 2500,
  'Pignons': 1200,
  'Plateau': 2000,
  'Dérailleur avant': 2500,
  'Dérailleur arrière': 2500,
  'Câble dérailleur': 500,
  'Gaine dérailleur': 400,
  'Manivelle': 1500,
  'Pédalier complet': 3500,
  'Axe de pédalier': 1500,

  // ── Pédalage ─────────────────────────────────────────────────────
  'Pédales': 1200,
  'Axe central': 2500,
  'Bille centrale': 1000,
  'Maillot': 1500,
  'Maillot complet': 3000,

  // ── Freinage ────────────────────────────────────────────────────
  'Frein complet': 2600,
  'Bras frein': 1000,
  'Patin de frein': 1000,
  'Patin complet': 1000,
  'Câble frein': 300,
  'Câble frein complet': 300,
  'Gaine frein': 300,
  'Levier de frein avant': 1200,
  'Levier de frein arrière': 1200,

  // ── Roues & pneumatiques ─────────────────────────────────────────
  'Pneu avant': 2700,
  'Pneu arrière': 2700,
  'Chambre à air avant': 1200,
  'Chambre à air arrière': 1200,
  'Rayon': 2500,
  'Rayon complet': 2500,
  'Jante avant': 5000,
  'Jante arrière': 5000,
  'Axe moyeu': 1000,
  'Moyeu avant': 2000,
  'Moyeu arrière': 2500,
  'Valve': 200,
  'Fond de jante': 300,

  // ── Direction & guidon ──────────────────────────────────────────
  'Guidon': 2000,
  'Potence': 1500,
  'Caoutchouc guidon': 1000,
  'Fourche': 8000,
  'Roue directrice': 3000,

  // ── Cadre & structure ───────────────────────────────────────────
  'Cadre': 15000,
  'Cadre vélo': 15000,
  'Cadre panneau': 12000,

  // ── Selle & tige de selle ───────────────────────────────────────
  'Selle': 2500,
  'Tuyau selle': 1500,
  'Tige de selle': 1500,

  // ── Accessoires & autres ────────────────────────────────────────
  'Klaxon': 500,
  'Éclairage avant': 1500,
  'Éclairage arrière': 1500,
  'Garde-boue avant': 1000,
  'Garde-boue arrière': 1000,
  'Porte-bagages': 3000,
  'Béquille': 1200,
  'Antivol': 2000,
  'Réflecteurs': 300,
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
