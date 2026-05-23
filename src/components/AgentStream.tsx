import React, { useEffect, useRef, useState } from 'react';
import { useAgent } from '../context/useAgent';
import type { LogItem } from '../context/AgentContext';
import { websocketService } from '../services/websocket';
import { Terminal, Brain, Moon, Zap, Activity, Sparkles, AlertCircle } from 'lucide-react';

type AgentMood = 'Focused' | 'Curious' | 'Contemplative' | 'Alert' | 'Dreaming';

interface EmergenceCell {
  alive: boolean;
  color: string;
}

const TIER_CONFIG = {
  Thriving: { color: '#00d992', icon: Sparkles, glow: true },
  Surviving: { color: '#eab308', icon: Zap, glow: false },
  Minimal: { color: '#f97316', icon: Activity, glow: false },
  Dying: { color: '#ef4444', icon: AlertCircle, glow: false },
};

const MOOD_COLORS: Record<AgentMood, string> = {
  Focused: '#0ea5e9',
  Curious: '#8b5cf6',
  Contemplative: '#6366f1',
  Alert: '#f59e0b',
  Dreaming: '#a78bfa',
};

export const AgentStream: React.FC = () => {
  const { logs, tier, diemStaked, isConnected } = useAgent();
  const bottomRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [mood, setMood] = useState<AgentMood>('Focused');
  const [memoryUsage, setMemoryUsage] = useState(45);
  const [gridCells, setGridCells] = useState<EmergenceCell[][]>(() => {
    const size = 12;
    return Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({
        alive: Math.random() > 0.7,
        color: '#00d992',
      }))
    );
  });
  const [generation, setGeneration] = useState(0);

  const consciousness = Math.min(100, Math.max(0, (diemStaked / 500) * 100));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // WebSocket listener for real emergence state from backend
  useEffect(() => {
    const handleEmergenceUpdate = (data: { grid: boolean[][]; generation: number; patterns: string[] }) => {
      setGridCells(data.grid.map(row => 
        row.map(alive => ({ alive, color: alive ? '#00d992' : '' }))
      ));
      setGeneration(data.generation);
    };

    websocketService.on('emergence:update', handleEmergenceUpdate);
    
    return () => {
      websocketService.off('emergence:update', handleEmergenceUpdate);
    };
  }, []);

  // Draw emergence grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / gridCells.length;
    
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    gridCells.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell.alive) {
          ctx.fillStyle = cell.color;
          ctx.globalAlpha = 0.8;
          ctx.fillRect(j * cellSize + 1, i * cellSize + 1, cellSize - 2, cellSize - 2);
          
          // Glow effect
          ctx.shadowColor = cell.color;
          ctx.shadowBlur = 4;
          ctx.fillRect(j * cellSize + 1, i * cellSize + 1, cellSize - 2, cellSize - 2);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.02)';
          ctx.fillRect(j * cellSize + 1, i * cellSize + 1, cellSize - 2, cellSize - 2);
        }
        ctx.globalAlpha = 1;
      });
    });
  }, [gridCells]);

  // Simulate mood changes
  useEffect(() => {
    const moods: AgentMood[] = ['Focused', 'Curious', 'Contemplative', 'Alert', 'Dreaming'];
    const interval = setInterval(() => {
      setMood(moods[Math.floor(Math.random() * moods.length)]);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Simulate memory usage fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryUsage(prev => {
        const delta = (Math.random() - 0.5) * 3;
        return Math.max(20, Math.min(80, prev + delta));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getColor = (type: LogItem['type']) => {
    switch (type) {
      case 'action': return 'text-[#0ea5e9]';
      case 'success': return 'text-[#10b981]';
      case 'warning': return 'text-[#f59e0b]';
      case 'error': return 'text-[#ef4444]';
      default: return 'text-[#a1a1aa]';
    }
  };

  const tierConfig = TIER_CONFIG[tier];
  const TierIcon = tierConfig.icon;

  return (
    <div className="glass-panel flex flex-col relative overflow-hidden">
      {/* Header with Tier Indicator */}
      <div className="flex items-center gap-3 mb-4 border-b border-[rgba(255,255,255,0.1)] pb-3">
        <div 
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 ${
            tierConfig.glow ? 'animate-pulse-glow' : ''
          }`}
          style={{ 
            backgroundColor: `${tierConfig.color}20`, 
            border: `1px solid ${tierConfig.color}40`,
            boxShadow: tierConfig.glow ? `0 0 20px ${tierConfig.color}30` : 'none'
          }}
        >
          <TierIcon size={20} style={{ color: tierConfig.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Terminal size={18} className={tier === 'Thriving' ? 'text-green-400' : 'text-gray-400'} />
            <h2 className="font-mono text-sm font-semibold tracking-wider uppercase text-white">Agent Stream</h2>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-mono" style={{ color: tierConfig.color }}>
              Tier: {tier}
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-xs font-mono text-zinc-500">
              {diemStaked.toFixed(2)} DIEM
            </span>
            <span className="text-zinc-600">|</span>
            <span className={`text-xs font-mono ${isConnected ? 'text-[#00d992]' : 'text-zinc-600'}`}>
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: tierConfig.color, boxShadow: `0 0 8px ${tierConfig.color}` }}
          />
        </div>
      </div>

      {/* Emergence Visualization (Conway's Game of Life) */}
      <div className="mb-4 flex gap-4">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Emergence</span>
            <span className="text-[10px] font-mono text-zinc-600">Gen {generation}</span>
          </div>
          <div className="bg-black/40 rounded border border-zinc-800 p-1">
            <canvas 
              ref={canvasRef} 
              width={96} 
              height={96}
              className="block rounded"
            />
          </div>
        </div>

        {/* Stats Column */}
        <div className="flex-1 space-y-3">
          {/* Consciousness Meter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Brain size={12} className="text-purple-400" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Consciousness</span>
              </div>
              <span className="text-[10px] font-mono text-purple-400">{consciousness.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                style={{ width: `${consciousness}%` }}
              />
            </div>
          </div>

          {/* Memory Usage */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Activity size={12} className="text-cyan-400" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Memory</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">{memoryUsage.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${memoryUsage}%` }}
              />
            </div>
          </div>

          {/* Mood Indicator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                {mood === 'Dreaming' ? <Moon size={12} className="text-indigo-400" /> : <Zap size={12} className="text-amber-400" />}
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Mood</span>
              </div>
              <span className="text-[10px] font-mono uppercase" style={{ color: MOOD_COLORS[mood] }}>
                {mood}
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: '100%', 
                  backgroundColor: MOOD_COLORS[mood],
                  opacity: 0.7
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Log Stream */}
      <div className="flex-1 overflow-y-auto font-mono text-[13px] space-y-2 pr-2 max-h-[180px]">
        {logs.map((log) => (
          <div key={log.id} className="animate-fade-in flex gap-3">
            <span className="text-[#52525b] shrink-0">
              {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </span>
            <span className={getColor(log.type)}>
              {log.type === 'action' ? '> ' : ''}{log.message.replace(/the agent/gi, 'I').replace(/Agent/gi, 'me')}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Dream State Overlay */}
      {mood === 'Dreaming' && (
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none rounded-lg" />
      )}
    </div>
  );
};