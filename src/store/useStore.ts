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
          baseParts: state.baseParts.map((part) =>
            part.id === id ? { ...part, name } : part
          ),
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

      resetStore: () => set({ baseParts: DEFAULT_BASE_PARTS, bikes: [] }),
    }),
    {
      name: 'cyclecheck-storage', // localStorage key
    }
  )
);
