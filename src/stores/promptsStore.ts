import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { PromptItem } from '../context/agent-types';

interface PromptsState {
  prompts: PromptItem[];
  addPrompt: (prompt: PromptItem) => void;
  updatePrompt: (id: string, update: Partial<PromptItem>) => void;
  mapPrompts: (fn: (prompts: PromptItem[]) => PromptItem[]) => void;
}

export const usePromptsStore = create<PromptsState>((set) => ({
  prompts: [],
  addPrompt: (prompt) => set((state) => ({ prompts: [...state.prompts, prompt] })),
  updatePrompt: (id, update) => set((state) => ({
    prompts: state.prompts.map(p => p.id === id ? { ...p, ...update } : p),
  })),
  mapPrompts: (fn) => set((state) => ({ prompts: fn(state.prompts) })),
}));

export const usePrompts = () => usePromptsStore(useShallow(state => ({ prompts: state.prompts })));
