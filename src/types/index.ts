export type PartStatus = 'good' | 'repair' | 'replace';

export interface Part {
  id: string;
  name: string;
}

export interface BikePart extends Part {
  status: PartStatus;
  isSpecific?: boolean; // True si c'est une pièce ajoutée spécifiquement pour ce vélo
}

export interface Bike {
  id: string;             // Numéro séquentiel paddé ex: "001" (utilisé dans les URLs)
  sequentialNumber: number; // Numéro auto-incrémenté (1, 2, 3…)
  stickerNumber: string;  // Numéro collé sur le tricycle, ou "--" si absent
  photoUrl?: string;      // Optionnel
  parts: BikePart[];
  createdAt: number;
  updatedAt: number;
}

/** Retourne le numéro d'identification complet affiché : VELO-001-B42 */
export const formatBikeId = (bike: Bike): string =>
  `VELO-${bike.id}-${bike.stickerNumber}`;

// État global pour les pièces de base (le "Dictionnaire")
export interface AppState {
  baseParts: Part[];
  bikes: Bike[];
  
  // Actions sur les pièces de base
  addBasePart: (name: string) => void;
  removeBasePart: (id: string) => void;
  updateBasePart: (id: string, name: string) => void;
  
  // Actions sur les vélos
  addBike: (stickerNumber: string, photoUrl?: string) => void;
  updateBike: (bike: Bike) => void;
  removeBike: (id: string) => void;
  // Sauvegarde / Restauration
  importData: (data: Partial<AppState>) => void;
  
  // Réinitialisation (utilitaire)
  resetStore: () => void;
}
