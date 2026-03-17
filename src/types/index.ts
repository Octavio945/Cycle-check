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
  id: string; // Numéro unique (identifiant saisi par l'utilisateur)
  photoUrl?: string; // Optionnel
  parts: BikePart[];
  createdAt: number;
  updatedAt: number;
}

// État global pour les pièces de base (le "Dictionnaire")
export interface AppState {
  baseParts: Part[];
  bikes: Bike[];
  
  // Actions sur les pièces de base
  addBasePart: (name: string) => void;
  removeBasePart: (id: string) => void;
  updateBasePart: (id: string, name: string) => void;
  
  // Actions sur les vélos
  addBike: (id: string, photoUrl?: string) => void;
  updateBike: (bike: Bike) => void;
  removeBike: (id: string) => void;
  
  // Réinitialisation (utilitaire)
  resetStore: () => void;
}
