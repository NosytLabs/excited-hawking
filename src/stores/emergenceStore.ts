import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

interface EmergenceState {
  emergenceGrid: string[];
  emergenceGeneration: number;
  emergencePatterns: string[];
  setEmergence: (grid: string[], generation: number, patterns: string[]) => void;
}

export const useEmergenceStore = create<EmergenceState>((set) => ({
  emergenceGrid: [],
  emergenceGeneration: 0,
  emergencePatterns: [],
  setEmergence: (grid, generation, patterns) => set({ emergenceGrid: grid, emergenceGeneration: generation, emergencePatterns: patterns }),
}));

export const useEmergence = () => useEmergenceStore(useShallow(state => ({
  emergenceGrid: state.emergenceGrid,
  emergenceGeneration: state.emergenceGeneration,
  emergencePatterns: state.emergencePatterns,
})));
