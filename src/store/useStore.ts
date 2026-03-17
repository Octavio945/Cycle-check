import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Bike, Part } from '../types';

// Liste des pièces de base par défaut
const DEFAULT_BASE_PARTS: Part[] = [
  { id: uuidv4(), name: 'Cadre' },
  { id: uuidv4(), name: 'Roues' },
  { id: uuidv4(), name: 'Freins' },
  { id: uuidv4(), name: 'Chaîne' },
  { id: uuidv4(), name: 'Dérailleur' },
  { id: uuidv4(), name: 'Selle' },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      baseParts: DEFAULT_BASE_PARTS,
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
          // (ne touche pas au statut, ne casse pas les objets, rétrocompatible)
          bikes: state.bikes.map((bike) => ({
            ...bike,
            parts: bike.parts.map((p) => 
              // Si la pièce correspond à l'ID de la pièce modifiée
              (!p.isSpecific && p.id === id) ? { ...p, name } : p
            )
          }))
        })),

      addBike: (bikeId, photoUrl) =>
        set((state) => {
          // Initialize a new bike with all current base parts set to 'good'
          const newParts = state.baseParts.map((part) => ({
            ...part,
            status: 'good' as const,
            isSpecific: false,
          }));

          const newBike: Bike = {
            id: bikeId,
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
          ...(data.bikes ? { bikes: data.bikes } : {}),
        })),

      resetStore: () => set({ baseParts: DEFAULT_BASE_PARTS, bikes: [] }),
    }),
    {
      name: 'cyclecheck-storage', // localStorage key
    }
  )
);
