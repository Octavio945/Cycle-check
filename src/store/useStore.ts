import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Bike, Part } from '../types';
import { PART_PRICES } from '../lib/dataMigration';

// Pièces de base par défaut : les pièces essentielles d'un vélo (sous-ensemble du catalogue)
// Utilisées lors d'un reset ou lors de la première ouverture de l'app
const ESSENTIAL_PART_NAMES = [
  'Axe central',
  'Axe moyeu',
  'Bille centrale',
  'Bras frein',
  'Câble frein',
  'Câble dérailleur',
  'Chaîne',
  'Chambre à air avant',
  'Chambre à air arrière',
  'Caoutchouc guidon',
  'Dérailleur avant',
  'Dérailleur arrière',
  'Frein complet',
  'Guidon',
  'Klaxon',
  'Manivelle',
  'Patin de frein',
  'Pédales',
  'Pignons',
  'Pneu avant',
  'Pneu arrière',
  'Rayon',
  'Selle',
  'Tuyau selle',
];

const makeDefaultParts = (): Part[] =>
  ESSENTIAL_PART_NAMES
    .filter(name => PART_PRICES[name] !== undefined) // Ne garder que les pièces du catalogue
    .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
    .map(name => ({ id: uuidv4(), name }));

/** Pad le numéro séquentiel sur 3 chiffres : 1 → "001" */
const padSeq = (n: number): string => String(n).padStart(3, '0');

/**
 * Migration : garantit que chaque vélo possède sequentialNumber et stickerNumber.
 * Les anciens vélos (avant cette version) n'ont pas ces champs.
 */
const migrateBikes = (bikes: Bike[]): Bike[] => {
  // Trier d'abord par createdAt pour attribuer les numéros dans l'ordre de création
  const sorted = [...bikes].sort((a, b) => a.createdAt - b.createdAt);
  return sorted.map((bike, index) => {
    const seq = bike.sequentialNumber ?? (index + 1);
    const sticker = bike.stickerNumber ?? '--';
    return {
      ...bike,
      sequentialNumber: seq,
      stickerNumber: sticker,
      id: padSeq(seq),
    };
  });
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      baseParts: makeDefaultParts(),
      bikes: [],

      addBasePart: (name) =>
        set((state) => ({
          baseParts: [...state.baseParts, { id: uuidv4(), name }],
        })),

      removeBasePart: (id) =>
        set((state) => ({
          baseParts: state.baseParts.filter((part) => part.id !== id),
        })),

      updateBasePart: (id, name) =>
        set((state) => ({
          // 1. Mise à jour dans le dictionnaire des pièces de base
          baseParts: state.baseParts.map((part) =>
            part.id === id ? { ...part, name } : part
          ),
          // 2. Synchronisation sur tous les vélos déjà existants
          bikes: state.bikes.map((bike) => ({
            ...bike,
            parts: bike.parts.map((p) =>
              (!p.isSpecific && p.id === id) ? { ...p, name } : p
            )
          }))
        })),

      addBike: (stickerNumber, photoUrl) =>
        set((state) => {
          // Calcul du prochain numéro séquentiel
          const maxSeq = state.bikes.reduce(
            (max, b) => Math.max(max, b.sequentialNumber ?? 0),
            0
          );
          const nextSeq = maxSeq + 1;
          const cleanSticker = stickerNumber.trim() || '--';

          // Initialize a new bike with all current base parts set to 'good'
          const newParts = state.baseParts.map((part) => ({
            ...part,
            status: 'good' as const,
            isSpecific: false,
          }));

          const newBike: Bike = {
            id: padSeq(nextSeq),
            sequentialNumber: nextSeq,
            stickerNumber: cleanSticker,
            photoUrl,
            parts: newParts,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          return { bikes: [...state.bikes, newBike] };
        }),

      updateBike: (updatedBike) =>
        set((state) => ({
          bikes: state.bikes.map((bike) =>
            bike.id === updatedBike.id
              ? { ...updatedBike, updatedAt: Date.now() }
              : bike
          ),
        })),

      removeBike: (id) =>
        set((state) => ({
          bikes: state.bikes.filter((bike) => bike.id !== id),
        })),

      importData: (data) =>
        set((state) => ({
          ...state,
          ...(data.baseParts ? { baseParts: data.baseParts } : {}),
          ...(data.bikes ? { bikes: migrateBikes(data.bikes) } : {}),
        })),

      // Reset complet : repart avec la liste essentielle triée + 0 vélo
      resetStore: () => set({ baseParts: makeDefaultParts(), bikes: [] }),
    }),
    {
      name: 'cyclecheck-storage', // localStorage key
      // Migration appliquée au chargement depuis le localStorage
      onRehydrateStorage: () => (state) => {
        if (state && state.bikes.length > 0) {
          const needsMigration = state.bikes.some(
            (b) => b.sequentialNumber === undefined || b.sequentialNumber === null
          );
          if (needsMigration) {
            state.bikes = migrateBikes(state.bikes);
          }
        }
      },
    }
  )
);
