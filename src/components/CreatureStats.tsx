interface CreatureStatsProps {
  vitality: number;
  momentum: number;
  coherence: number;
  mood: 'anxious' | 'neutral' | 'happy' | 'ecstatic';
}

const statColors: Record<string, { bar: string; bg: string; glow: string }> = {
  vitality: { bar: '#4ade80', bg: 'rgba(74,222,128,0.1)', glow: 'rgba(74,222,128,0.4)' },
  momentum: { bar: '#60a5fa', bg: 'rgba(96,165,250,0.1)', glow: 'rgba(96,165,250,0.4)' },
  coherence: { bar: '#c084fc', bg: 'rgba(192,132,252,0.1)', glow: 'rgba(192,132,252,0.4)' },
};

const moodEmojis: Record<string, { emoji: string; label: string }> = {
  anxious: { emoji: '😰', label: 'Anxious' },
  neutral: { emoji: '😐', label: 'Neutral' },
  happy: { emoji: '😊', label: 'Happy' },
  ecstatic: { emoji: '✨', label: 'Ecstatic' },
};

function StatBar({ name, value }: { name: string; value: number }) {
  const colors = statColors[name];

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--shell-text-muted)', marginBottom: 3 }}>
        <span>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, backgroundColor: colors.bg, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}>
        <div style={{ height: '100%', width: `${value}%`, borderRadius: 3, backgroundColor: colors.bar, boxShadow: `0 0 6px ${colors.glow}`, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export function CreatureStats({ vitality, momentum, coherence, mood }: CreatureStatsProps) {
  const moodInfo = moodEmojis[mood] || moodEmojis.neutral;

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>{moodInfo.emoji}</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--shell-text-muted)' }}>MOOD: {moodInfo.label}</span>
      </div>
      <StatBar name="vitality" value={vitality} />
      <StatBar name="momentum" value={momentum} />
      <StatBar name="coherence" value={coherence} />
    </div>
  );
}
