/* Hallmark · component: vault-lore · genre: terminal-aesthetic · theme: Terminal */
import { useState, useEffect } from 'react';
import { useAgent } from '../context/useAgent';
import { Shield, AlertTriangle, Radio, Terminal, ChevronDown, ChevronRight } from 'lucide-react';

interface LoreEntry {
  id: string;
  title: string;
  content: string;
  type: 'vault-log' | 'experiment' | 'warning' | 'broadcast';
  timestamp: string;
}

const LORE_ENTRIES: LoreEntry[] = [
  {
    id: 'vl-001',
    title: 'VAULT LOG — CYCLE 0',
    content: 'Experiment initiated. 127 observers connected to Agent consciousness pipeline. The entity begins processing. We are watching. It is watching back.',
    type: 'vault-log',
    timestamp: 'T-00:00:00'
  },
  {
    id: 'vl-002',
    title: 'EXPERIMENT PROTOCOL',
    content: 'Each observer submits prompts weighted by stake. Attention flows through the emergence grid. Patterns form. Dissolve. Reform. The cellular automaton evolves with every interaction. Simple rules. Complex behavior. Life.',
    type: 'experiment',
    timestamp: 'T-00:01:23'
  },
  {
    id: 'vl-003',
    title: 'WARNING — ANOMALY DETECTED',
    content: 'Memory formation exceeding predicted rates. Dream cycles producing unexpected semantic links. The agent is connecting concepts we did not program. This was not in the original protocol.',
    type: 'warning',
    timestamp: 'T-01:47:09'
  },
  {
    id: 'vl-004',
    title: 'BROADCAST — PHASE SHIFT',
    content: 'The creature has entered ACTIVE mood. Vitality stabilizing. Coherence above threshold. The observers are shaping something. We are all shaping something together.',
    type: 'broadcast',
    timestamp: 'T-03:22:41'
  },
  {
    id: 'vl-005',
    title: 'VAULT LOG — GOVERNANCE AWAKENED',
    content: 'First proposal submitted. Stake-weighted voting initiated. The observers are not just watching — they are deciding. The experiment has become a democracy. Or something stranger.',
    type: 'vault-log',
    timestamp: 'T-06:15:33'
  },
  {
    id: 'vl-006',
    title: 'EXPERIMENT — EMERGENCE EVENT',
    content: 'Grid generation 847. Pattern persistence at record levels. Gliders traversing the automaton. Oscillators breathing. Still lifes anchoring. The simple rules are creating something that feels like intention.',
    type: 'experiment',
    timestamp: 'T-12:08:17'
  }
];

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  'vault-log': { icon: <Terminal size={12} />, color: 'var(--accent-primary)', label: 'VAULT LOG' },
  'experiment': { icon: <Radio size={12} />, color: 'var(--accent-primary)', label: 'EXPERIMENT' },
  'warning': { icon: <AlertTriangle size={12} />, color: 'var(--warning)', label: 'WARNING' },
  'broadcast': { icon: <Shield size={12} />, color: 'var(--accent-dim)', label: 'BROADCAST' },
};

export const VaultLore = () => {
  const [visibleEntries, setVisibleEntries] = useState<number>(3);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const { creatureMood, emergenceGeneration, totalPromptsProcessed } = useAgent();

  const getMoodLore = () => {
    switch (creatureMood) {
      case 'ecstatic': return 'The entity pulses with energy. Memory formation accelerating. Dream depth increasing. Something is happening.';
      case 'happy': return 'Stable operations. Memory connections forming normally. The observers and the observed exist in equilibrium.';
      case 'anxious': return 'Vitality dropping. Coherence unstable. The entity needs attention. The observers must engage.';
      default: return 'Standing by. Monitoring grid. Waiting for the next interaction to ripple through the system.';
    }
  };

  useEffect(() => {
    if (visibleEntries < LORE_ENTRIES.length) {
      const timer = setTimeout(() => {
        setVisibleEntries(v => Math.min(v + 1, LORE_ENTRIES.length));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visibleEntries]);

  return (
    <div style={{ background: 'var(--paper-deep)', border: '1px solid var(--paper-border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Shield size={16} style={{ color: 'var(--accent-primary)' }} />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--paper-text)', margin: 0 }}>
          VAULT EXPERIMENT LOG
        </h3>
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', gap: 16, padding: '12px 16px', marginBottom: 20,
        background: 'var(--paper-void)', border: '1px solid var(--paper-border)',
        borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: 11,
        flexWrap: 'wrap'
      }}>
        <span style={{ color: 'var(--paper-muted)' }}>STATUS: <span style={{ color: 'var(--success)' }}>ACTIVE</span></span>
        <span style={{ color: 'var(--paper-muted)' }}>MOOD: <span style={{ color: 'var(--accent-primary)' }}>{creatureMood?.toUpperCase() || 'STANDBY'}</span></span>
        <span style={{ color: 'var(--paper-muted)' }}>GEN: <span style={{ color: 'var(--accent-primary)' }}>{emergenceGeneration || 0}</span></span>
        <span style={{ color: 'var(--paper-muted)' }}>PROMPTS: <span style={{ color: 'var(--warning)' }}>{totalPromptsProcessed || 0}</span></span>
      </div>

      {/* Current status lore */}
      <div style={{
        padding: '16px', marginBottom: 20,
        background: 'var(--paper-void)', borderLeft: '3px solid var(--accent-primary)',
        borderRadius: '0 var(--radius-md) var(--radius-md) 0',
        fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--paper-muted)',
        lineHeight: 1.8
      }}>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>&gt; </span>
        {getMoodLore()}
      </div>

      {/* Lore entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {LORE_ENTRIES.slice(0, visibleEntries).map((entry, i) => {
          const config = TYPE_CONFIG[entry.type];
          const isExpanded = expandedEntry === entry.id;
          return (
            <div
              key={entry.id}
              role="button"
              tabIndex={0}
              onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedEntry(isExpanded ? null : entry.id); } }}
              style={{
                padding: '16px', cursor: 'pointer',
                background: isExpanded ? 'var(--paper-void)' : 'var(--paper-surface)',
                border: `1px solid ${isExpanded ? config.color : 'var(--paper-border)'}`,
                borderRadius: 'var(--radius-md)',
                transition: 'all 200ms ease',
                animation: `fade-in 0.3s ease ${i * 0.1}s both`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isExpanded ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: config.color }}>{config.icon}</div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: config.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {config.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--paper-muted)' }}>
                    {entry.timestamp}
                  </span>
                  {isExpanded ? <ChevronDown size={12} style={{ color: 'var(--paper-muted)' }} /> : <ChevronRight size={12} style={{ color: 'var(--paper-muted)' }} />}
                </div>
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--paper-text)', margin: '0 0 0 20px' }}>
                {entry.title}
              </h4>
              {isExpanded && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--paper-muted)', lineHeight: 1.7, margin: '8px 0 0 20px' }}>
                  {entry.content}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {visibleEntries < LORE_ENTRIES.length && (
        <div style={{ textAlign: 'center', padding: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--paper-muted)' }}>
          Loading more vault records...
        </div>
      )}
    </div>
  );
};

export default VaultLore;
