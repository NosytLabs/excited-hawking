/* Hallmark · component: architecture-explorer · genre: terminal-aesthetic · theme: Terminal */
import { useState } from 'react';
import { useAgent } from '../context/useAgent';
import { Network, Database, Globe, Lock, Zap, Activity, Brain, Eye } from 'lucide-react';

interface ArchNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: 'core' | 'data' | 'interface' | 'external';
  x: number;
  y: number;
  status: 'active' | 'idle' | 'error';
}

interface ArchEdge {
  from: string;
  to: string;
  label: string;
  animated: boolean;
}

const ARCH_NODES: ArchNode[] = [
  { id: 'brain', label: 'Agent Brain', icon: <Brain size={18} />, description: 'Central reasoning engine. Processes prompts through attention-weighted pipeline. Maintains coherence across interactions.', category: 'core', x: 50, y: 30, status: 'active' },
  { id: 'memory', label: 'Memory Engine', icon: <Database size={18} />, description: 'Semantic memory with dream cycles. Stores interaction memories, emergent patterns, and social connections. Consciousness = memories/100.', category: 'data', x: 20, y: 25, status: 'active' },
  { id: 'emergence', label: 'Emergence Grid', icon: <Grid size={18} />, description: '20×20 cellular automaton. Conway\'s Game of Life evolved. Prompt-weighted seeding creates complex patterns from simple rules.', category: 'data', x: 80, y: 25, status: 'active' },
  { id: 'governance', label: 'Governance', icon: <Lock size={18} />, description: 'DAO-style proposal system. Stake-weighted voting. Delegation chains. Community shapes agent direction through collective decisions.', category: 'interface', x: 20, y: 65, status: 'idle' },
  { id: 'staking', label: 'Staking', icon: <Globe size={18} />, description: 'x402 protocol micropayments. Stake DIEM tokens for attention weight. Higher stakes = greater influence on agent behavior.', category: 'external', x: 80, y: 65, status: 'active' },
  { id: 'websocket', label: 'WebSocket', icon: <Zap size={18} />, description: 'Real-time event stream. Broadcasts creature updates, memory events, emergence changes, and governance updates to all observers.', category: 'interface', x: 50, y: 75, status: 'active' },
  { id: 'creature', label: 'Creature State', icon: <Activity size={18} />, description: 'Living entity tracking. Vitality, momentum, coherence stats. Mood shifts based on interaction quality. Tier system from Thriving to Dying.', category: 'core', x: 35, y: 50, status: 'active' },
  { id: 'observer', label: 'Observer', icon: <Eye size={18} />, description: 'You. Every prompt you submit, vote you cast, and observation you make shapes the agent\'s evolution. The experiment needs you.', category: 'interface', x: 65, y: 50, status: 'active' },
];

const ARCH_EDGES: ArchEdge[] = [
  { from: 'observer', to: 'brain', label: 'prompts', animated: true },
  { from: 'brain', to: 'memory', label: 'stores', animated: false },
  { from: 'brain', to: 'emergence', label: 'seeds', animated: true },
  { from: 'brain', to: 'creature', label: 'updates', animated: false },
  { from: 'memory', to: 'websocket', label: 'emits', animated: true },
  { from: 'emergence', to: 'websocket', label: 'streams', animated: true },
  { from: 'creature', to: 'websocket', label: 'broadcasts', animated: false },
  { from: 'observer', to: 'governance', label: 'proposes', animated: false },
  { from: 'observer', to: 'staking', label: 'stakes', animated: false },
  { from: 'governance', to: 'brain', label: 'directs', animated: false },
  { from: 'staking', to: 'brain', label: 'weights', animated: true },
  { from: 'websocket', to: 'observer', label: 'feeds', animated: true },
];

const CATEGORY_COLORS: Record<string, string> = {
  core: 'var(--accent-primary)',
  data: 'var(--accent-primary)',
  interface: 'var(--warning)',
  external: 'var(--accent-dim)',
};

function Grid({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

export const ArchitectureExplorer = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const { isConnected } = useAgent();

  const selected = ARCH_NODES.find(n => n.id === selectedNode);

  const getNodeCenter = (id: string) => {
    const node = ARCH_NODES.find(n => n.id === id);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  };

  return (
    <div style={{ background: 'var(--paper-deep)', border: '1px solid var(--paper-border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Network size={16} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--paper-text)', margin: 0 }}>
            System Architecture
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? 'var(--success)' : 'var(--danger)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--paper-muted)' }}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* SVG Diagram */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/1', minHeight: 320, background: 'var(--paper-void)', borderRadius: 'var(--radius-md)', border: '1px solid var(--paper-border)', overflow: 'hidden' }}>
        {/* Grid background */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(var(--paper-text) 1px, transparent 1px), linear-gradient(90deg, var(--paper-text) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            {ARCH_EDGES.filter(e => e.animated).map((edge, i) => (
              <linearGradient key={`grad-${i}`} id={`edge-grad-${edge.from}-${edge.to}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.2" />
                <stop offset="50%" stopColor="var(--accent-primary)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.2" />
              </linearGradient>
            ))}
          </defs>

          {/* Edges */}
          {ARCH_EDGES.map((edge, i) => {
            const from = getNodeCenter(edge.from);
            const to = getNodeCenter(edge.to);
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to || selectedNode === edge.from || selectedNode === edge.to;
            return (
              <g key={i}>
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isHighlighted ? 'var(--accent-primary)' : 'var(--paper-border)'}
                  strokeWidth={isHighlighted ? 0.4 : 0.2}
                  strokeDasharray={edge.animated ? '1,0.5' : 'none'}
                  opacity={isHighlighted ? 1 : 0.5}
                />
                {isHighlighted && (
                  <text x={midX} y={midY - 1} textAnchor="middle" fill="var(--paper-muted)" fontSize="2" fontFamily="var(--font-mono)">
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {ARCH_NODES.map(node => {
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;
            const color = CATEGORY_COLORS[node.category];
            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(isSelected ? null : node.id)}
              >
                {/* Glow */}
                {(isSelected || isHovered) && (
                  <circle cx={node.x} cy={node.y} r={4} fill={color} opacity={0.15} />
                )}
                {/* Node circle */}
                <circle
                  cx={node.x} cy={node.y} r={isSelected ? 3 : 2.5}
                  fill={isSelected ? color : 'var(--paper-deep)'}
                  stroke={color}
                  strokeWidth={isSelected ? 0.5 : 0.3}
                />
                {/* Label */}
                <text
                  x={node.x} y={node.y + 5}
                  textAnchor="middle"
                  fill={isSelected || isHovered ? 'var(--paper-text)' : 'var(--paper-muted)'}
                  fontSize="2.2"
                  fontFamily="var(--font-mono)"
                  fontWeight={isSelected ? 700 : 400}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Scanlines */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)' }} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--paper-muted)', textTransform: 'capitalize' }}>{cat}</span>
          </div>
        ))}
      </div>

      {/* Selected node detail */}
      {selected && (
        <div style={{ marginTop: 16, padding: 16, background: 'var(--paper-void)', border: '1px solid var(--paper-border)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ color: CATEGORY_COLORS[selected.category] }}>{selected.icon}</div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--paper-text)', margin: 0 }}>{selected.label}</h4>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 8px',
              background: selected.status === 'active' ? 'var(--success)' : 'var(--paper-surface)',
              color: selected.status === 'active' ? 'var(--paper-void)' : 'var(--paper-muted)',
              borderRadius: 'var(--radius-sm)', textTransform: 'uppercase'
            }}>
              {selected.status}
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--paper-muted)', lineHeight: 1.6, margin: 0 }}>
            {selected.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default ArchitectureExplorer;
