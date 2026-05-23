import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useAgent } from '../context/useAgent';
import { Grid, Zap, AlertCircle } from 'lucide-react';

const GRID_SIZE = 20;

interface EmergenceEvent {
  x: number;
  y: number;
  timestamp: number;
  type: 'birth' | 'death' | 'sustain';
}

export const CanvasLayer: React.FC = () => {
  const { canvasPixels } = useAgent();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [events, setEvents] = useState<EmergenceEvent[]>([]);

  // Convert flat array to 2D grid
  const grid = useMemo(() => {
    const result: string[][] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      result.push(canvasPixels.slice(i * GRID_SIZE, (i + 1) * GRID_SIZE));
    }
    return result;
  }, [canvasPixels]);

  // Track emergence events
  const lastGenCellsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentCells = new Set<string>();
    const newEvents: EmergenceEvent[] = [];

    grid.forEach((row, y) => {
      row.forEach((color, x) => {
        const key = `${x},${y}`;
        if (color) {
          currentCells.add(key);
          if (!lastGenCellsRef.current.has(key)) {
            newEvents.push({ x, y, timestamp: Date.now(), type: 'birth' });
          }
        } else if (lastGenCellsRef.current.has(key)) {
          newEvents.push({ x, y, timestamp: Date.now(), type: 'death' });
        }
      });
    });

    // Keep last 10 events
    if (newEvents.length > 0) {
      setEvents(prev => [...newEvents.slice(0, 10), ...prev].slice(0, 20));
    }

    lastGenCellsRef.current = currentCells;
  }, [grid]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;
    
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw cells with effects
    grid.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color) {
          // Glow effect
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = color;
          ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
          
          // Inner highlight
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillRect(x * cellSize + 2, y * cellSize + 2, (cellSize - 2) / 3, (cellSize - 2) / 3);
        }
      });
    });
  }, [grid]);

  const totalPixels = canvasPixels.filter(c => c).length;
  const density = (totalPixels / (GRID_SIZE * GRID_SIZE) * 100).toFixed(1);

  return (
    <div className="glass-panel flex flex-col h-[300px]">
      <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
        <h3 className="font-mono text-sm uppercase tracking-wider flex items-center gap-2 text-zinc-300">
          <Grid size={16} className="text-pink-400" />
          Public Canvas
        </h3>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-zinc-500">{totalPixels}/{GRID_SIZE * GRID_SIZE} pixels</span>
          <span className="text-pink-400/70">{density}% density</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-black/40 rounded border border-zinc-800 overflow-hidden relative">
        <canvas 
          ref={canvasRef}
          width={200}
          height={200}
          className="rounded"
        />
        
        {/* Emergence Events Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {events.slice(0, 5).map((event, idx) => (
            <div
              key={`${event.timestamp}-${idx}`}
              className="absolute w-3 h-3 rounded-full animate-ping"
              style={{
                left: `${(event.x / GRID_SIZE) * 100}%`,
                top: `${(event.y / GRID_SIZE) * 100}%`,
                backgroundColor: event.type === 'birth' ? '#00d992' : '#ef4444',
                opacity: 0.6,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Real-time updates indicator */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00d992] animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Live Updates</span>
        </div>
        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-green-400/60">
              <Zap size={10} />
              <span>{events.filter(e => e.type === 'birth').length} births</span>
            </div>
          )}
          {events.filter(e => e.type === 'death').length > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-red-400/60">
              <AlertCircle size={10} />
              <span>{events.filter(e => e.type === 'death').length} deaths</span>
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-zinc-500 font-mono mt-2 text-center uppercase tracking-widest">
        1 Paid Prompt = 1 Pixel Edit
      </p>
    </div>
  );
};