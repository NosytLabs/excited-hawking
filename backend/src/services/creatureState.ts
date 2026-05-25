import { getIO } from './websocket.js';

export interface CreatureStats {
  vitality: number;
  momentum: number;
  coherence: number;
}

export interface CreatureState {
  stats: CreatureStats;
  mood: 'anxious' | 'neutral' | 'happy' | 'ecstatic';
  lastPromptAt: number;
  totalPromptsProcessed: number;
}

const creature: CreatureState = {
  stats: { vitality: 60, momentum: 50, coherence: 50 },
  mood: 'neutral',
  lastPromptAt: Date.now(),
  totalPromptsProcessed: 0
};

const DECAY_INTERVAL_MS = 60_000;

function calculateMood(): CreatureState['mood'] {
  const { vitality: v, momentum: m, coherence: c } = creature.stats;
  if (v > 80 && m > 70 && c > 70) return 'ecstatic';
  if (v > 60 && m > 50) return 'happy';
  if (v < 30) return 'anxious';
  return 'neutral';
}

function applyDecay(): void {
  creature.stats.vitality = Math.max(0, creature.stats.vitality - 0.5);
  creature.stats.momentum = Math.max(0, creature.stats.momentum - 1);
  creature.stats.coherence = Math.max(0, creature.stats.coherence - 0.3);
}

function broadcast(): void {
  creature.mood = calculateMood();
  getIO().emit('creature:update', {
    stats: creature.stats,
    mood: creature.mood,
    totalPromptsProcessed: creature.totalPromptsProcessed
  });
}

let decayTimer: ReturnType<typeof setInterval> | null = null;

export function startDecayTimer(): void {
  if (decayTimer) return;
  decayTimer = setInterval(() => {
    applyDecay();
    broadcast();
  }, DECAY_INTERVAL_MS);
}

export function stopDecayTimer(): void {
  if (decayTimer) {
    clearInterval(decayTimer);
    decayTimer = null;
  }
}

export function recordPrompt(promptText: string): void {
  creature.lastPromptAt = Date.now();
  creature.totalPromptsProcessed++;

  const lengthBonus = Math.min(15, Math.floor(promptText.length / 100));
  creature.stats.vitality = Math.min(100, creature.stats.vitality + 2 + lengthBonus);
  creature.stats.momentum = Math.min(100, creature.stats.momentum + 5);

  if (promptText.length > 50) {
    creature.stats.coherence = Math.min(100, creature.stats.coherence + 1);
  }

  broadcast();
}

export function recordStake(): void {
  creature.stats.coherence = Math.min(100, creature.stats.coherence + 3);
  creature.stats.vitality = Math.min(100, creature.stats.vitality + 1);
  broadcast();
}

export function getCreatureState(): CreatureState {
  return {
    ...creature,
    mood: calculateMood(),
    stats: { ...creature.stats }
  };
}

export function calculateTierFromVitality(vitality: number): 'Thriving' | 'Surviving' | 'Struggling' | 'Dying' {
  if (vitality > 75) return 'Thriving';
  if (vitality > 50) return 'Surviving';
  if (vitality > 25) return 'Struggling';
  return 'Dying';
}
