import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAgent } from '../context/useAgent';
import type { LogItem } from '../context/AgentContext';
import { websocketService } from '../services/websocket';
import { Terminal, Brain, Cpu, Wifi, AlertTriangle } from 'lucide-react';
import { CardSkeleton } from './LoadingSkeleton';

type AgentMood = 'ACTIVE' | 'PROCESSING' | 'STANDBY' | 'CALIBRATING' | 'IDLE';

interface EmergenceCell {
  alive: boolean;
  color: string;
}

export const AgentStream: React.FC = () => {
  const { logs, tier, diemStaked, isConnected, backendAvailable } = useAgent();
  const bottomRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [mood] = useState<AgentMood>('IDLE');
  const [memoryUsage] = useState(0);
  const [gridCells, setGridCells] = useState<EmergenceCell[][]>([]);
  const [generation, setGeneration] = useState(0);

  const consciousness = Math.min(100, Math.max(0, (diemStaked / 500) * 100));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const handleEmergenceUpdate = (data: { grid: boolean[][]; generation: number; patterns: string[] }) => {
      setGridCells(data.grid.map(row => 
        row.map(alive => ({ alive, color: alive ? '#14fe17' : '' }))
      ));
      setGeneration(data.generation);
    };

    websocketService.on(WSEvents.EMERGENCE_UPDATE, handleEmergenceUpdate);

    return () => {
      websocketService.off(WSEvents.EMERGENCE_UPDATE);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / gridCells.length;
    
    ctx.fillStyle = 'var(--canvas-bg)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    gridCells.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell.alive) {
          ctx.fillStyle = cell.color;
          ctx.globalAlpha = 0.9;
          ctx.fillRect(j * cellSize + 1, i * cellSize + 1, cellSize - 2, cellSize - 2);
          ctx.shadowColor = cell.color;
          ctx.shadowBlur = 6;
          ctx.fillRect(j * cellSize + 1, i * cellSize + 1, cellSize - 2, cellSize - 2);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = 'var(--canvas-grid)';
          ctx.fillRect(j * cellSize + 1, i * cellSize + 1, cellSize - 2, cellSize - 2);
        }
        ctx.globalAlpha = 1;
      });
    });
  }, [gridCells]);

  const TIER_CONFIG = {
    Thriving: { color: 'var(--canvas-alive)', icon: Terminal, glow: true },
    Surviving: { color: 'var(--canvas-surviving)', icon: Cpu, glow: false },
    Minimal: { color: 'var(--canvas-minimal)', icon: AlertTriangle, glow: false },
    Dying: { color: 'var(--canvas-dying)', icon: AlertTriangle, glow: false },
  };

  const MOOD_COLORS: Record<AgentMood, string> = {
    'ACTIVE': 'var(--mood-active)',
    'PROCESSING': 'var(--mood-processing)',
    'STANDBY': 'var(--mood-standby)',
    'CALIBRATING': 'var(--mood-calibrating)',
    'IDLE': 'var(--mood-idle)',
  };

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
              className="font-mono text-sm font-bold tracking-wider uppercase"
              style={{ 
                fontFamily: 'var(--font-terminal)',
                color: 'var(--term-green)'
              }}
            >
              AGENT_STREAM.EXE
            </h2>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span 
              className="text-xs font-mono"
              style={{ color: tierConfig.color, fontFamily: 'var(--font-terminal)' }}
            >
              TIER: {tier.toUpperCase()}
            </span>
            <span className="text-xs" style={{ color: 'var(--term-ash)' }}>|</span>
            <span 
              className="text-xs font-mono"
              style={{ fontFamily: 'var(--font-terminal)', color: 'var(--term-green-dim)' }}
            >
              STAKE: {diemStaked.toFixed(2)} DIEM
            </span>
            <span className="text-xs" style={{ color: 'var(--term-ash)' }}>|</span>
            <span 
              className={`text-xs font-mono ${isConnected ? 'animate-blink' : ''}`}
              style={{ 
                fontFamily: 'var(--font-terminal)', 
                color: isConnected ? 'var(--term-green)' : 'var(--term-red)'
              }}
            >
              {isConnected ? 'CONNECTED' : 'OFFLINE'}
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
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${consciousness}%`,
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
                style={{ fontFamily: 'var(--font-terminal)', color: 'var(--term-amber)' }}
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
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${memoryUsage}%`,
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
                className="h-full transition-all duration-500"
                style={{ 
                  width: '100%', 
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
            <span style={{ color: 'var(--term-ash)' }}>
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
        <span>LAST UPDATE: {new Date().toLocaleTimeString()}</span>
        <span className="animate-pulse">● SYSTEM ACTIVE</span>
      </div>
    </div>
  );
};