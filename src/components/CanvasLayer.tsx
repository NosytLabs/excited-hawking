import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useAgent } from '../context/useAgent';

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
  const scanlinesRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 200, height: 200 });
  const [events, setEvents] = useState<EmergenceEvent[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const grid = useMemo(() => {
    const result: string[][] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      result.push(canvasPixels.slice(i * GRID_SIZE, (i + 1) * GRID_SIZE));
    }
    return result;
  }, [canvasPixels]);

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

    if (newEvents.length > 0) {
      setEvents(prev => [...newEvents.slice(0, 10), ...prev].slice(0, 20));
    }

    lastGenCellsRef.current = currentCells;
  }, [grid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerSize.width * dpr;
    canvas.height = containerSize.height * dpr;
    ctx.scale(dpr, dpr);

    const cellSize = containerSize.width / GRID_SIZE;

    ctx.fillStyle = 'var(--shell-bg)';
    ctx.fillRect(0, 0, containerSize.width, containerSize.height);

    ctx.strokeStyle = 'var(--shell-border)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, containerSize.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(containerSize.width, i * cellSize);
      ctx.stroke();
    }

    grid.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color) {
          const accentColor = 'var(--vault-teal)';
          ctx.shadowColor = 'var(--vault-teal)';
          ctx.shadowBlur = 8;
          ctx.fillStyle = accentColor;
          ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);

          ctx.shadowBlur = 0;
          ctx.fillStyle = 'var(--vault-teal-dim)';
          ctx.fillRect(x * cellSize + 2, y * cellSize + 2, (cellSize - 2) / 3, (cellSize - 2) / 3);
        }
      });
    });
  }, [grid, containerSize]);

  useEffect(() => {
    const scanlines = scanlinesRef.current;
    if (!scanlines) return;

    const ctx = scanlines.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    scanlines.width = containerSize.width * dpr;
    scanlines.height = containerSize.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, containerSize.width, containerSize.height);

    ctx.fillStyle = 'var(--shell-text-muted)';
    for (let i = 0; i < containerSize.height; i += 3) {
      ctx.fillRect(0, i, containerSize.width, 0.5);
    }
  }, [containerSize]);

  const totalPixels = canvasPixels.filter(c => c).length;
  const density = (totalPixels / (GRID_SIZE * GRID_SIZE) * 100).toFixed(1);

  return (
    <div className="card flex flex-col h-[300px]">
      <div className="flex items-center justify-between mb-2 pb-2 px-1" style={{ borderBottom: '1px solid var(--shell-border)' }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--vault-teal)' }} />
          <h3 className="text-sm font-medium tracking-wide" style={{ color: 'var(--shell-text)' }}>
            Emergence Grid
          </h3>
        </div>
        <div className="text-xs" style={{ color: 'var(--shell-text-muted)' }}>
          Live visualization
        </div>
      </div>

      <div className="flex items-center justify-between px-1 mb-2 text-xs" style={{ color: 'var(--shell-text-muted)' }}>
        <span>Cell density: {density}%</span>
        <span>Units: {totalPixels}/{GRID_SIZE * GRID_SIZE}</span>
        <span>Status: {totalPixels > 0 ? 'Active' : 'Idle'}</span>
      </div>

      <div ref={containerRef} className="flex-1 flex items-center justify-center rounded-lg overflow-hidden relative" style={{ backgroundColor: 'var(--shell-bg)', border: '1px solid var(--shell-border)' }}>
        <canvas
          ref={canvasRef}
          width={containerSize.width}
          height={containerSize.height}
          className="rounded w-full h-full"
          role="img"
          aria-label="Emergence grid canvas showing cellular automaton state"
        />
        <canvas
          ref={scanlinesRef}
          width={containerSize.width}
          height={containerSize.height}
          className="absolute rounded w-full h-full pointer-events-none opacity-20"
          aria-hidden="true"
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1" style={{ color: 'var(--shell-text-muted)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--vault-teal)' }} />
          <span>Live</span>
        </div>
        <div className="flex items-center gap-2" style={{ color: 'var(--shell-text-muted)' }}>
          {events.length > 0 && (
            <span style={{ color: 'var(--shell-accent)' }}>
              +{events.filter(e => e.type === 'birth').length}
            </span>
          )}
          {events.filter(e => e.type === 'death').length > 0 && (
            <span style={{ color: 'var(--shell-danger)' }}>
              -{events.filter(e => e.type === 'death').length}
            </span>
          )}
        </div>
      </div>

      <div className="mt-1 pt-1 px-1 text-center" style={{ borderTop: '1px solid var(--shell-border)' }}>
        <p className="text-[9px] text-[var(--shell-text-muted)]">
          Emergence visualization powered by cellular automata
        </p>
      </div>
    </div>
  );
};