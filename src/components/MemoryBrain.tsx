import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { websocketService } from '../services/websocket';
import { WSEvents } from '../types/events';

interface MemoryNode {
  id: string;
  type: 'interaction' | 'dream' | 'emergence' | 'social';
  content: string;
  timestamp: number;
  connections: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const mockNodes: MemoryNode[] = [
  { id: '1', type: 'interaction', content: 'User asked about neural networks', timestamp: Date.now() - 3600000, connections: ['2', '3'], x: 140, y: 100, vx: 0, vy: 0 },
  { id: '2', type: 'dream', content: 'Dream: networks of light connecting distant nodes', timestamp: Date.now() - 7200000, connections: ['1'], x: 80, y: 60, vx: 0, vy: 0 },
  { id: '3', type: 'emergence', content: 'New emergence pattern detected', timestamp: Date.now() - 1800000, connections: ['1', '4'], x: 200, y: 140, vx: 0, vy: 0 },
  { id: '4', type: 'social', content: 'Collaborated with another agent', timestamp: Date.now() - 900000, connections: ['3'], x: 180, y: 180, vx: 0, vy: 0 },
];

const COLORS = {
  interaction: '#14fe17',
  dream: '#3b82f6',
  emergence: '#f59e0b',
  social: '#a855f7',
} as const;

const CANVAS_WIDTH = 280;
const CANVAS_HEIGHT = 200;
const REPULSION_STRENGTH = 800;
const ATTRACTION_STRENGTH = 0.02;
const DAMPING = 0.92;
const IDEAL_EDGE_LENGTH = 60;

export const MemoryBrain = React.memo(function MemoryBrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<MemoryNode[]>(mockNodes);
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef(nodes);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    const handleNewMemory = (memory: { id: string; type: string; content: string; timestamp: number }) => {
      const newNode: MemoryNode = {
        id: memory.id,
        type: memory.type as MemoryNode['type'],
        content: memory.content,
        timestamp: memory.timestamp,
        connections: [],
        x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 100,
        y: CANVAS_HEIGHT / 2 + (Math.random() - 0.5) * 80,
        vx: 0,
        vy: 0,
      };
      setNodes(prev => {
        const updated = [newNode, ...prev];
        if (updated.length > 50) return updated.slice(0, 50);
        return updated;
      });
      setIsLive(true);
      setTimeout(() => setIsLive(false), 2000);
    };
    websocketService.on(WSEvents.MEMORY_NEW, handleNewMemory);
    return () => websocketService.off(WSEvents.MEMORY_NEW);
  }, []);

  const simulateRef = useRef(() => {
    const currentNodes = nodesRef.current;
    if (currentNodes.length === 0) return;

    setNodes(prevNodes => {
      const updated = prevNodes.map(node => ({ ...node }));

      for (let i = 0; i < updated.length; i++) {
        for (let j = i + 1; j < updated.length; j++) {
          const a = updated[i];
          const b = updated[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = REPULSION_STRENGTH / (dist * dist);

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      updated.forEach(node => {
        node.connections.forEach(targetId => {
          const target = updated.find(n => n.id === targetId);
          if (target && target !== node) {
            const dx = target.x - node.x;
            const dy = target.y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const displacement = dist - IDEAL_EDGE_LENGTH;
            const force = displacement * ATTRACTION_STRENGTH;

            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            node.vx += fx;
            node.vy += fy;
          }
        });
      });

      const centerX = CANVAS_WIDTH / 2;
      const centerY = CANVAS_HEIGHT / 2;
      updated.forEach(node => {
        node.vx += (centerX - node.x) * 0.001;
        node.vy += (centerY - node.y) * 0.001;
      });

      updated.forEach(node => {
        node.vx *= DAMPING;
        node.vy *= DAMPING;
        node.x += node.vx;
        node.y += node.vy;
        node.x = Math.max(15, Math.min(CANVAS_WIDTH - 15, node.x));
        node.y = Math.max(15, Math.min(CANVAS_HEIGHT - 15, node.y));
      });

      return updated;
    });
  });

  useEffect(() => {
    const animate = () => {
      if (isVisibleRef.current) {
        simulateRef.current();
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let pulsePhase = 0;

    const render = () => {
      if (isVisibleRef.current) {
        pulsePhase += 0.05;

        ctx.fillStyle = 'oklch(from var(--term-charcoal) l c h)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.strokeStyle = 'oklch(from var(--term-green-dim) l c h / 0.3)';
        ctx.lineWidth = 1;
        const gridSize = 20;
        for (let x = gridSize; x < CANVAS_WIDTH; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, CANVAS_HEIGHT);
          ctx.stroke();
        }
        for (let y = gridSize; y < CANVAS_HEIGHT; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(CANVAS_WIDTH, y);
          ctx.stroke();
        }

        nodesRef.current.forEach(node => {
          node.connections.forEach(targetId => {
            const target = nodesRef.current.find(n => n.id === targetId);
            if (target) {
              const gradient = ctx.createLinearGradient(node.x, node.y, target.x, target.y);
              gradient.addColorStop(0, COLORS[node.type]);
              gradient.addColorStop(1, COLORS[target.type]);
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(target.x, target.y);
              ctx.strokeStyle = gradient;
              ctx.lineWidth = 1.5;
              ctx.globalAlpha = 0.4;
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          });
        });

        nodesRef.current.forEach(node => {
          const isHovered = hoveredNode === node.id;
          const isSelected = selectedNode?.id === node.id;
          const baseRadius = node.type === 'dream' ? 10 : 7;
          const radius = isHovered ? baseRadius * 1.3 : baseRadius;

          if (node.type === 'dream') {
            const pulseRadius = radius + Math.sin(pulsePhase) * 3 + 4;
            ctx.beginPath();
            ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
            ctx.fillStyle = COLORS[node.type];
            ctx.globalAlpha = 0.15 + Math.sin(pulsePhase) * 0.1;
            ctx.fill();
            ctx.globalAlpha = 1;

            ctx.beginPath();
            ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS[node.type];
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + Math.sin(pulsePhase) * 0.3;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }

          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = COLORS[node.type];
          ctx.fill();

          if (isSelected || isHovered) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          if (isSelected) {
            ctx.shadowColor = COLORS[node.type];
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 2, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS[node.type];
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationRef.current);
  }, [hoveredNode, selectedNode]);

  useEffect(() => {
    const handleVisibility = () => { isVisibleRef.current = !document.hidden; };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const clickedNode = nodesRef.current.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const radius = node.type === 'dream' ? 12 : 9;
      return Math.sqrt(dx * dx + dy * dy) < radius;
    });

    setSelectedNode(clickedNode || null);
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const hovered = nodesRef.current.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const radius = node.type === 'dream' ? 12 : 9;
      return Math.sqrt(dx * dx + dy * dy) < radius;
    });

    setHoveredNode(hovered?.id || null);
    canvas.style.cursor = hovered ? 'pointer' : 'crosshair';
  }, []);

  const typeLabels = {
    interaction: 'Interaction',
    dream: 'Dream',
    emergence: 'Emergence',
    social: 'Social',
  };

  return (
    <div 
      className="rounded-lg overflow-hidden"
      style={{ 
        backgroundColor: 'oklch(from var(--term-charcoal) l c h)',
        border: '2px solid oklch(from var(--term-green-dim) l c h)',
      }}
    >
      <div 
        className="flex items-center justify-between p-3"
        style={{ borderBottom: '2px solid oklch(from var(--term-green-dim) l c h)' }}
      >
        <div className="flex items-center gap-2">
          <Brain size={16} style={{ color: 'var(--term-green)' }} />
          <span 
            className="text-sm font-mono uppercase tracking-wider"
            style={{ color: 'var(--term-green)', fontFamily: 'var(--font-terminal)' }}
          >
            Memory Brain
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{ 
              backgroundColor: 'oklch(from var(--term-charcoal) l c h)',
              color: 'var(--term-dust)',
              border: '1px solid oklch(from var(--term-green-dim) l c h)',
            }}
          >
            {nodes.length} nodes
          </span>
          {isLive && (
            <span 
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded animate-pulse"
              style={{ 
                backgroundColor: 'var(--term-green)', 
                color: 'var(--term-void)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <Sparkles size={10} /> New
            </span>
          )}
        </div>
      </div>

      <canvas 
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        aria-label="Interactive neural network visualization of agent memory nodes"
        role="img"
        style={{ 
          display: 'block',
          width: '100%',
          cursor: 'crosshair',
        }}
      />

      {selectedNode && (
        <div 
          className="p-3"
          style={{ 
            borderTop: '2px solid oklch(from var(--term-green-dim) l c h)',
            backgroundColor: 'oklch(from var(--term-charcoal) l c h)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: COLORS[selectedNode.type] }}
            />
            <span 
              className="text-xs font-mono uppercase"
              style={{ color: COLORS[selectedNode.type] }}
            >
              {typeLabels[selectedNode.type]}
            </span>
            <span 
              className="text-xs font-mono"
              style={{ color: 'var(--term-dust)' }}
            >
              {new Date(selectedNode.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p 
            className="text-sm leading-relaxed"
            style={{ 
              color: 'var(--term-green)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {selectedNode.content}
          </p>
        </div>
      )}

      <div 
        className="flex items-center justify-center gap-4 p-2"
        style={{ 
          borderTop: '1px solid oklch(from var(--term-green-dim) l c h)',
          backgroundColor: 'oklch(from var(--term-charcoal) l c h / 0.5)',
        }}
      >
        {(Object.entries(COLORS) as [keyof typeof COLORS, string][]).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span 
              className="text-xs font-mono uppercase"
              style={{ color: 'var(--term-dust)', fontSize: '0.6rem' }}
            >
              {typeLabels[type]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default MemoryBrain;