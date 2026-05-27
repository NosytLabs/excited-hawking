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
  Dying: { symbol: '[X]', name: 'Fading', glow: 'rgba(100,100,100,0.2)', color: '#666' },
  Struggling: { symbol: '[-]', name: 'Dim', glow: 'rgba(150,150,150,0.3)', color: '#999' },
  Surviving: { symbol: '[>]', name: 'Active', glow: 'rgba(74,222,128,0.4)', color: '#15803d' },
  Thriving: { symbol: '[*]', name: 'Evolved', glow: 'rgba(250,204,21,0.6)', color: '#facc15' },
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
          color: 'var(--shell-text-muted)',
        }}>
          {totalPromptsProcessed} prompts processed
        </div>
      )}
    </div>
  );
}
