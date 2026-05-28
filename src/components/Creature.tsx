interface CreatureProps {
  vitality: number;
  momentum: number;
  coherence: number;
  mood: 'anxious' | 'neutral' | 'happy' | 'ecstatic';
  totalPromptsProcessed?: number;
}

type Tier = 'Dying' | 'Struggling' | 'Surviving' | 'Thriving';

function calculateTier(v: number): Tier {
  if (v > 75) return 'Thriving';
  if (v > 50) return 'Surviving';
  if (v > 25) return 'Struggling';
  return 'Dying';
}

const tierConfig: Record<Tier, { symbol: string; name: string; glow: string; color: string }> = {
  Dying: { symbol: '[X]', name: 'Fading', glow: 'var(--paper-muted)', color: 'var(--paper-muted)' },
  Struggling: { symbol: '[-]', name: 'Dim', glow: 'var(--paper-border)', color: 'var(--accent-dim)' },
  Surviving: { symbol: '[>]', name: 'Active', glow: 'var(--success)', color: 'var(--success)' },
  Thriving: { symbol: '[*]', name: 'Evolved', glow: 'var(--warning)', color: 'var(--warning)' },
};

export function Creature({ vitality, mood: _mood, totalPromptsProcessed }: CreatureProps) {
  const tier = calculateTier(vitality);
  const config = tierConfig[tier];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      padding: 24,
    }}>
      <div style={{
        fontSize: 64,
        lineHeight: 1,
        filter: `drop-shadow(0 0 12px ${config.glow})`,
        transition: 'filter 0.5s ease, opacity 0.5s ease',
        opacity: tier === 'Dying' ? 0.4 : 1,
        animation: tier === 'Dying' ? 'flicker 2s infinite' : tier === 'Surviving' || tier === 'Thriving' ? 'breathing 3s ease-in-out infinite' : 'none',
      }}>
        {config.symbol}
      </div>
      <div style={{
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: config.color,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        {config.name}
      </div>
      {totalPromptsProcessed !== undefined && (
        <div style={{
          fontSize: 10,
        fontFamily: 'var(--font-mono)',
        color: 'var(--paper-muted)',
        }}>
          {totalPromptsProcessed} prompts processed
        </div>
      )}
    </div>
  );
}
