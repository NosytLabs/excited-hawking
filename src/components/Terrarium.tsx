import { useContext } from 'react';
import { AgentContext } from '../context/AgentContext';
import { CreatureStats } from './CreatureStats';
import { Creature } from './Creature';

export function Terrarium() {
  const { creatureStats, creatureMood, totalPromptsProcessed, isConnected } = useContext(AgentContext);

  return (
    <div style={{
      border: '1px solid var(--shell-border)',
      borderRadius: 8,
      backgroundColor: 'var(--shell-surface)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--shell-border)',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: 'var(--shell-text-muted)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>🐚 Creature Chamber</span>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: isConnected ? '#4ade80' : '#ef4444',
          display: 'inline-block',
        }} />
      </div>
      <Creature
        vitality={creatureStats.vitality}
        momentum={creatureStats.momentum}
        coherence={creatureStats.coherence}
        mood={creatureMood}
        totalPromptsProcessed={totalPromptsProcessed}
      />
      <CreatureStats
        vitality={creatureStats.vitality}
        momentum={creatureStats.momentum}
        coherence={creatureStats.coherence}
        mood={creatureMood}
      />
    </div>
  );
}
