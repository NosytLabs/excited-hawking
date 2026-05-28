import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAgent } from '../context/useAgent';
import type { LogItem } from '../context/AgentContext';
import { websocketService } from '../services/websocket';
import { WSEvents } from '../types/events';
import { Terminal, Brain, Cpu, Wifi, AlertTriangle } from 'lucide-react';

interface EmergenceCell {
  alive: boolean;
}

type AgentMood = 'ACTIVE' | 'PROCESSING' | 'STANDBY' | 'CALIBRATING' | 'IDLE';

const MOOD_COLORS: Record<AgentMood, string> = {
  ACTIVE: 'var(--accent-primary)',
  PROCESSING: 'var(--warning)',
  STANDBY: 'var(--paper-muted)',
  CALIBRATING: 'var(--accent-dim)',
  IDLE: 'var(--paper-muted)',
};

const TIER_CONFIG = {
  Thriving: { color: 'var(--accent-primary)', icon: Terminal, glow: true },
  Surviving: { color: 'var(--warning)', icon: Cpu, glow: false },
  Minimal: { color: 'var(--paper-muted)', icon: AlertTriangle, glow: false },
  Dying: { color: 'var(--danger)', icon: AlertTriangle, glow: false },
};

export const AgentStream: React.FC = React.memo(() => {
  const { logs, tier, diemStaked, isConnected, backendAvailable, creatureMood } = useAgent();
  const bottomRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const moodMap: Record<string, AgentMood> = {
    ecstatic: 'ACTIVE',
    happy: 'ACTIVE',
    neutral: 'STANDBY',
    anxious: 'PROCESSING',
  };
  const mood: AgentMood = moodMap[creatureMood] || 'IDLE';
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
    if (typeof document === 'undefined') return { bg: 'var(--paper-void)', alive: 'var(--accent-primary)', grid: 'var(--paper-surface)' };
    const s = getComputedStyle(document.documentElement);
    return {
      bg: s.getPropertyValue('--paper-void').trim() || 'var(--paper-void)',
      alive: s.getPropertyValue('--accent-primary').trim() || 'var(--accent-primary)',
      grid: s.getPropertyValue('--paper-surface').trim() || 'var(--paper-surface)',
    };
  }, []);

  const lastLogTimestamp = logs.length > 0 ? logs[logs.length - 1].timestamp : null;
  const lastUpdate = lastLogTimestamp ? new Date(lastLogTimestamp) : null;

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
      case 'action': return 'var(--accent-primary)';
      case 'success': return 'var(--accent-primary)';
      case 'warning': return 'var(--warning)';
      case 'error': return 'var(--danger)';
      default: return 'var(--paper-muted)';
    }
  };

  const tierConfig = TIER_CONFIG[tier];
  const TierIcon = tierConfig.icon;

  if (!backendAvailable && logs.length === 0) {
    return (
      <div className="font-mono flex flex-col p-6 min-h-[320px] justify-between" style={{ backgroundColor: 'var(--paper-deep)', border: '2px solid var(--paper-border)' }}>
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Terminal size={16} style={{ color: 'var(--paper-muted)' }} aria-hidden="true" />
            <span className="text-base font-bold tracking-tight" style={{ color: 'var(--paper-text)' }}>Agent Stream</span>
            <span className="text-base px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--paper-elevated)', color: 'var(--paper-muted)' }}>DEMO</span>
          </div>
          <div className="space-y-3" style={{ color: 'var(--paper-muted)' }}>
            <p className="text-base">&gt; awaiting connection to agent backend</p>
            <p className="text-base">&gt; system status: <span className="text-[var(--warning)]">STANDBY</span></p>
            <p className="text-base">&gt; connect backend to activate real-time stream</p>
            <div className="mt-4 space-y-2">
              <p className="text-base text-[var(--accent-dim)]">// When connected, this panel displays:</p>
              <p className="text-base pl-4">- Emergence grid visualization</p>
              <p className="text-base pl-4">- Consciousness, memory & mood metrics</p>
              <p className="text-base pl-4">- Real-time agent interaction logs</p>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--paper-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-base" style={{ color: 'var(--paper-muted)' }}>LAST UPDATE: --:--:--</span>
            <span className="animate-pulse text-base" style={{ color: 'var(--paper-muted)' }}>● OFFLINE</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="crt-screen flex flex-col relative overflow-hidden p-4"
      style={{ 
        backgroundColor: 'var(--paper-deep)',
border: '1px solid var(--paper-border)'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center gap-3 mb-4 pb-3 border-b"
        style={{ borderColor: 'var(--paper-border)' }}
      >
        <div 
          className={`w-10 h-10 flex items-center justify-center ${tierConfig.glow ? 'animate-glow-pulse' : ''}`}
            style={{ 
              backgroundColor: 'var(--accent-primary)20', 
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
                color: 'var(--paper-text)'
              }}
            >
              Agent stream
            </h2>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span 
              className="text-base font-mono uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ 
                backgroundColor: 'var(--paper-elevated)',
                color: 'var(--paper-muted)'
              }}
            >
              TIER: {tier}
            </span>
            <span className="text-base" style={{ color: 'var(--paper-border)' }}>|</span>
            <span 
              className="text-base font-mono px-2 py-0.5 rounded"
              style={{ 
                backgroundColor: 'var(--paper-elevated)',
                color: 'var(--paper-muted)'
              }}
            >
              STAKE: {diemStaked.toFixed(1)} DIEM
            </span>
            <span className="text-base" style={{ color: 'var(--paper-border)' }}>|</span>
            <span 
              className="text-base font-mono"
              style={{ 
                color: isConnected ? 'var(--success)' : 'var(--paper-muted)'
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
            style={{ color: 'var(--accent-dim)' }}
          >
            <span className="text-base font-mono tracking-wider uppercase">Emergence Matrix</span>
            <span className="text-base font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
              GEN:{generation.toString().padStart(3, '0')}
            </span>
          </div>
          <div 
            className="p-1 border-2"
            style={{ 
              backgroundColor: 'var(--paper-void)',
              borderColor: 'var(--paper-border)'
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
                <Brain size={12} style={{ color: 'var(--accent-primary)' }} />
                <span 
                  className="text-base font-mono tracking-wider uppercase"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-dim)' }}
                >
                  CONSCIOUSNESS
                </span>
              </div>
              <span 
                className="text-base font-mono"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}
              >
                {consciousness.toFixed(0)}%
              </span>
            </div>
            <div 
              className="h-2 border"
              style={{ 
                backgroundColor: 'var(--paper-void)',
                borderColor: 'var(--paper-border)'
              }}
            >
              <div 
                className="h-full"
                style={{ 
                  width: `${consciousness}%`,
                  transition: 'width 500ms var(--ease-out)',
                  backgroundColor: 'var(--accent-primary)',
                  boxShadow: '0 0 8px var(--accent-primary)'
                }}
              />
            </div>
          </div>

          {/* Memory */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Cpu size={12} style={{ color: 'var(--warning)' }} />
                <span 
                  className="text-base font-mono tracking-wider uppercase"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-dim)' }}
                >
                  MEMORY
                </span>
              </div>
              <span 
                className="text-base font-mono"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--warning)', fontVariantNumeric: 'tabular-nums' }}
              >
                {memoryUsage.toFixed(0)}%
              </span>
            </div>
            <div 
              className="h-2 border"
              style={{ 
                backgroundColor: 'var(--paper-void)',
                borderColor: 'var(--paper-border)'
              }}
            >
              <div 
                className="h-full"
                style={{ 
                  width: `${memoryUsage}%`,
                  transition: 'width 500ms var(--ease-out)',
                  backgroundColor: 'var(--warning)',
                  boxShadow: '0 0 8px var(--warning)'
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
                  className="text-base font-mono tracking-wider uppercase"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-dim)' }}
                >
                  STATUS
                </span>
              </div>
              <span 
                className="text-base font-mono uppercase"
                style={{ 
                  fontFamily: 'var(--font-mono)', 
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
                backgroundColor: 'var(--paper-void)',
                borderColor: 'var(--paper-border)'
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
        className="flex-1 overflow-y-auto text-base space-y-2 pr-2 max-h-[180px]"
        style={{ fontFamily: 'var(--font-mono)' }}
        aria-live="polite"
      >
        {logs.map((log) => (
          <div 
            key={log.id} 
            className="animate-fade-in flex gap-3"
          >
            <span               style={{ color: 'var(--paper-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </span>
            <span style={{ color: getColor(log.type) }}>
              {log.type === 'action' ? '> ' : ''}{(() => {
              const msg = log.message;
              return msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/the agent/gi, 'I').replace(/Agent/gi, 'me');
            })()}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Status bar */}
          <div 
            className="mt-4 pt-3 border-t flex items-center justify-between text-base"
            style={{ 
              borderColor: 'var(--paper-border)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-dim)'
            }}
          >
        <span>LAST UPDATE: {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}</span>
        <span className="animate-pulse">● SYSTEM ACTIVE</span>
      </div>
    </div>
  );
});
