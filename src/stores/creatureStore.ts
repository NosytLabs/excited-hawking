import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

interface CreatureState {
  creatureStats: { vitality: number; momentum: number; coherence: number };
  creatureMood: 'anxious' | 'neutral' | 'happy' | 'ecstatic';
  totalPromptsProcessed: number;
  setCreature: (stats: CreatureState['creatureStats'], mood: CreatureState['creatureMood'], totalPromptsProcessed: number) => void;
}

export const useCreatureStore = create<CreatureState>((set) => ({
  creatureStats: { vitality: 60, momentum: 50, coherence: 50 },
  creatureMood: 'neutral',
  totalPromptsProcessed: 0,
  setCreature: (stats, mood, totalPromptsProcessed) => set({ creatureStats: stats, creatureMood: mood, totalPromptsProcessed }),
}));

export const useCreature = () => useCreatureStore(useShallow(state => ({
  creatureStats: state.creatureStats,
  creatureMood: state.creatureMood,
  totalPromptsProcessed: state.totalPromptsProcessed,
})));
