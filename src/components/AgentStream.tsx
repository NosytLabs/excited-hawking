import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAgent } from '../context/useAgent';
import type { LogItem } from '../context/AgentContext';
import { websocketService } from '../services/websocket';
import { WSEvents } from '../types/events';
import { Terminal, Brain, Cpu, Wifi, AlertTriangle } from 'lucide-react';
import { CardSkeleton } from './LoadingSkeleton';

interface EmergenceCell {
  alive: boolean;
}

type AgentMood = 'ACTIVE' | 'PROCESSING' | 'STANDBY' | 'CALIBRATING' | 'IDLE';

const MOOD_COLORS: Record<AgentMood, string> = {
  ACTIVE: 'var(--mood-active)',
  PROCESSING: 'var(--mood-processing)',
  STANDBY: 'var(--mood-standby)',
  CALIBRATING: 'var(--mood-calibrating)',
  IDLE: 'var(--mood-idle)',
};

const TIER_CONFIG = {
  Thriving: { color: 'var(--canvas-alive)', icon: Terminal, glow: true },
  Surviving: { color: 'var(--canvas-surviving)', icon: Cpu, glow: false },
  Minimal: { color: 'var(--canvas-minimal)', icon: AlertTriangle, glow: false },
  Dying: { color: 'var(--canvas-dying)', icon: AlertTriangle, glow: false },
};

export const AgentStream: React.FC = React.memo(() => {
  const { logs, tier, diemStaked, isConnected, backendAvailable } = useAgent();
  const bottomRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mood: AgentMood = 'IDLE';
  const memoryUsage = Math.min(100, 20 + logs.length * 2);
  const [gridCells, setGridCells] = useState<EmergenceCell[][]>([]);
  const [generation, setGeneration] = useState(0);

  const consciousness = Math.min(100, Math.max(0, (diemStaked / 500) * 100));

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || gridCells.length === 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const cellSize = canvas.width / gridCells.length;
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    
    if (x >= 0 && x < gridCells[0].length && y >= 0 && y < gridCells.length) {
      const newGrid = gridCells.map((row, ri) => 
        row.map((cell, ci) => (ri === y && ci === x) ? { ...cell, alive: !cell.alive } : cell)
      );
      setGridCells(newGrid);
      websocketService.emit(WSEvents.EMERGENCE_CELL_TOGGLE, { x, y, alive: newGrid[y][x].alive });
    }
  }, [gridCells]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  useEffect(() => {
    const handleEmergenceUpdate = (data: { grid: boolean[][]; generation: number; patterns: string[] }) => {
      setGridCells(data.grid.map(row =>
        row.map(alive => ({ alive }))
      ));
      setGeneration(data.generation);
    };

    const handleCellToggle = (data: { x: number; y: number; alive: boolean }) => {
      setGridCells(prev => prev.map((row, ri) => 
        row.map((cell, ci) => (ri === data.y && ci === data.x) ? { ...cell, alive: data.alive } : cell)
      ));
    };

    websocketService.on(WSEvents.EMERGENCE_UPDATE, handleEmergenceUpdate);
    websocketService.on(WSEvents.EMERGENCE_CELL_TOGGLE, handleCellToggle);

    return () => {
      websocketService.off(WSEvents.EMERGENCE_UPDATE, handleEmergenceUpdate);
      websocketService.off(WSEvents.EMERGENCE_CELL_TOGGLE, handleCellToggle);
    };
  }, []);

  const updateCanvasSize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    
    const size = Math.min(container.clientWidth, container.clientHeight);
    canvas.width = size;
    canvas.height = size;
  }, []);

  useEffect(() => {
    updateCanvasSize();
    
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [updateCanvasSize]);

  const canvasColors = useMemo(() => {
    if (typeof document === 'undefined') return { bg: '#0a0a0a', alive: '#00ff41', grid: '#1a1a2e' };
    const s = getComputedStyle(document.documentElement);
    return {
      bg: s.getPropertyValue('--canvas-bg').trim() || '#0a0a0a',
      alive: s.getPropertyValue('--canvas-alive').trim() || '#00ff41',
      grid: s.getPropertyValue('--canvas-grid').trim() || '#1a1a2e',
    };
  }, []);

  const lastUpdateRef = useRef(new Date());
  const lastUpdate = lastUpdateRef.current;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / gridCells.length;
    
    ctx.fillStyle = canvasColors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    gridCells.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell.alive) {
          ctx.fillStyle = canvasColors.alive;
          ctx.globalAlpha = 0.9;
          ctx.fillRect(j * cellSize + 1, i * cellSize + 1, cellSize - 2, cellSize - 2);
          ctx.shadowColor = canvasColors.alive;
          ctx.shadowBlur = 6;
          ctx.fillRect(j * cellSize + 1, i * cellSize + 1, cellSize - 2, cellSize - 2);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = canvasColors.grid;
          ctx.fillRect(j * cellSize + 1, i * cellSize + 1, cellSize - 2, cellSize - 2);
        }
        ctx.globalAlpha = 1;
      });
    });
  }, [gridCells, canvasColors]);

  const getColor = (type: LogItem['type']) => {
    switch (type) {
      case 'action': return 'var(--term-green)';
      case 'success': return 'var(--term-green)';
      case 'warning': return 'var(--term-amber)';
      case 'error': return 'var(--term-red)';
      default: return 'var(--term-ash)';
    }
  };

  const tierConfig = TIER_CONFIG[tier];
  const TierIcon = tierConfig.icon;

  if (!backendAvailable && logs.length === 0) {
    return <CardSkeleton />;
  }

  return (
    <div 
      className="crt-screen flex flex-col relative overflow-hidden p-4"
      style={{ 
        backgroundColor: 'var(--term-charcoal)',
        border: '2px solid var(--ui-bezel)'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center gap-3 mb-4 pb-3 border-b-2"
        style={{ borderColor: 'var(--ui-bezel)' }}
      >
        <div 
          className={`w-10 h-10 flex items-center justify-center ${tierConfig.glow ? 'animate-glow-pulse' : ''}`}
          style={{ 
            backgroundColor: `${tierConfig.color}20`, 
            border: `2px solid ${tierConfig.color}`,
            boxShadow: tierConfig.glow ? `0 0 15px ${tierConfig.color}40` : 'none'
          }}
        >
          <TierIcon size={20} style={{ color: tierConfig.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Terminal size={16} style={{ color: tierConfig.color }} aria-hidden="true" />
            <h2 
              className="text-lg font-bold tracking-tight m-0"
              style={{ 
                fontFamily: 'var(--font-display)',
                color: 'var(--shell-text)'
              }}
            >
              Agent stream
            </h2>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span 
              className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ 
                backgroundColor: 'var(--shell-surface-2)',
                color: 'var(--shell-text-muted)'
              }}
            >
              TIER: {tier}
            </span>
            <span className="text-xs" style={{ color: 'var(--shell-border)' }}>|</span>
            <span 
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ 
                backgroundColor: 'var(--shell-surface-2)',
                color: 'var(--shell-text-muted)'
              }}
            >
              STAKE: {diemStaked.toFixed(1)} DIEM
            </span>
            <span className="text-xs" style={{ color: 'var(--shell-border)' }}>|</span>
            <span 
              className="text-xs font-mono"
              style={{ 
                color: isConnected ? 'var(--shell-success)' : 'var(--shell-text-muted)'
              }}
            >
              {isConnected ? 'Connected' : 'Offline preview'}
            </span>
          </div>
        </div>
        <div 
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ 
            backgroundColor: tierConfig.color, 
            boxShadow: `0 0 8px ${tierConfig.color}` 
          }}
        />
      </div>

      {/* Emergence Grid + Stats */}
      <div className="mb-4 flex gap-4" style={{ flexWrap: 'wrap' }}>
        <div className="flex-shrink-0">
          <div 
            className="flex items-center justify-between mb-1"
            style={{ color: 'var(--term-green-dim)' }}
          >
            <span className="text-[10px] font-mono tracking-wider uppercase">Emergence Matrix</span>
            <span className="text-[10px] font-mono" style={{ fontFamily: 'var(--font-terminal)' }}>
              GEN:{generation.toString().padStart(3, '0')}
            </span>
          </div>
          <div 
            className="p-1 border-2"
            style={{ 
              backgroundColor: 'var(--term-void)',
              borderColor: 'var(--ui-bezel)'
            }}
          >
            <div 
              ref={containerRef}
              className="w-[96px] h-[96px] sm:w-[120px] sm:h-[120px] md:w-[144px] md:h-[144px]"
            >
              <canvas 
                ref={canvasRef} 
                className="block w-full h-full"
                style={{ cursor: 'crosshair' }}
                onClick={handleCanvasClick}
                role="img"
                aria-label="Emergence grid"
              />
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="flex-1 space-y-3">
          {/* Consciousness */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Brain size={12} style={{ color: 'var(--term-green)' }} />
                <span 
                  className="text-[10px] font-mono tracking-wider uppercase"
                  style={{ fontFamily: 'var(--font-terminal)', color: 'var(--term-green-dim)' }}
                >
                  CONSCIOUSNESS
                </span>
              </div>
              <span 
                className="text-[10px] font-mono"
                style={{ fontFamily: 'var(--font-terminal)', color: 'var(--term-green)' }}
              >
                {consciousness.toFixed(0)}%
              </span>
            </div>
            <div 
              className="h-2 border"
              style={{ 
                backgroundColor: 'var(--term-void)',
                borderColor: 'var(--ui-bezel)'
              }}
            >
              <div 
                className="h-full"
                style={{ 
                  width: `${consciousness}%`,
                  transition: 'width 500ms var(--ease-out)',
                  backgroundColor: 'var(--term-green)',
                  boxShadow: '0 0 8px var(--term-green)'
                }}
              />
            </div>
          </div>

          {/* Memory */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Cpu size={12} style={{ color: 'var(--term-amber)' }} />
                <span 
                  className="text-[10px] font-mono tracking-wider uppercase"
                  style={{ fontFamily: 'var(--font-terminal)', color: 'var(--term-green-dim)' }}
                >
                  MEMORY
                </span>
              </div>
<span 
              className="text-[10px] font-mono"
              style={{ fontFamily: 'var(--font-terminal)', color: 'var(--term-amber)', fontVariantNumeric: 'tabular-nums' }}
            >
              {memoryUsage.toFixed(0)}%
              </span>
            </div>
            <div 
              className="h-2 border"
              style={{ 
                backgroundColor: 'var(--term-void)',
                borderColor: 'var(--ui-bezel)'
              }}
            >
              <div 
                className="h-full"
                style={{ 
                  width: `${memoryUsage}%`,
                  transition: 'width 500ms var(--ease-out)',
                  backgroundColor: 'var(--term-amber)',
                  boxShadow: '0 0 8px var(--term-amber)'
                }}
              />
            </div>
          </div>

          {/* Mood */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Wifi size={12} style={{ color: MOOD_COLORS[mood] }} />
                <span 
                  className="text-[10px] font-mono tracking-wider uppercase"
                  style={{ fontFamily: 'var(--font-terminal)', color: 'var(--term-green-dim)' }}
                >
                  STATUS
                </span>
              </div>
              <span 
                className="text-[10px] font-mono uppercase"
                style={{ 
                  fontFamily: 'var(--font-terminal)', 
                  color: MOOD_COLORS[mood],
                  textShadow: `0 0 5px ${MOOD_COLORS[mood]}`
                }}
              >
                {mood}
              </span>
            </div>
            <div 
              className="h-2 border"
              style={{ 
                backgroundColor: 'var(--term-void)',
                borderColor: 'var(--ui-bezel)'
              }}
            >
              <div 
                className="h-full"
                style={{ 
                  width: '100%', 
                  transition: 'background-color var(--dur-short)',
                  backgroundColor: MOOD_COLORS[mood],
                  opacity: 0.8,
                  boxShadow: `0 0 8px ${MOOD_COLORS[mood]}`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Log Stream */}
      <div 
        className="flex-1 overflow-y-auto text-[13px] space-y-2 pr-2 max-h-[180px]"
        style={{ fontFamily: 'var(--font-terminal)' }}
        aria-live="polite"
      >
        {logs.map((log) => (
          <div 
            key={log.id} 
            className="animate-fade-in flex gap-3"
          >
            <span style={{ color: 'var(--term-ash)', fontVariantNumeric: 'tabular-nums' }}>
              {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </span>
            <span style={{ color: getColor(log.type) }}>
              {log.type === 'action' ? '> ' : ''}{(() => {
              const msg = log.message;
              return msg.replace(/the agent/gi, 'I').replace(/Agent/gi, 'me');
            })()}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Status bar */}
      <div 
        className="mt-4 pt-3 border-t-2 flex items-center justify-between text-[10px]"
        style={{ 
          borderColor: 'var(--ui-bezel)',
          fontFamily: 'var(--font-terminal)',
          color: 'var(--term-green-dim)'
        }}
      >
        <span>LAST UPDATE: {lastUpdate.toLocaleTimeString()}</span>
        <span className="animate-pulse">● SYSTEM ACTIVE</span>
      </div>
    </div>
  );
});
