import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useAgent } from '../context/useAgent';
import { websocketService } from '../services/websocket';

const GRID_SIZE = 20;
const MAX_PARTICLES = 150;
const MAX_GHOSTS = 50;
const AMBIENT_PARTICLES = 40;

interface EmergenceEvent {
  x: number;
  y: number;
  timestamp: number;
  type: 'birth' | 'death' | 'sustain';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  layer: number;
}

interface GhostCell {
  x: number;
  y: number;
  alpha: number;
  fadeRate: number;
}

interface OrbitalRing {
  cx: number;
  cy: number;
  radius: number;
  angle: number;
  speed: number;
  thickness: number;
  hue: number;
}

export const CanvasLayer: React.FC = () => {
  const { canvasPixels } = useAgent();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ghostsRef = useRef<GhostCell[]>([]);
  const orbitalRingsRef = useRef<OrbitalRing[]>([]);
  const ambientRef = useRef<Particle[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 200, height: 400 });
  const [generation, setGeneration] = useState(0);
  const [birthCount, setBirthCount] = useState(0);
  const [deathCount, setDeathCount] = useState(0);
  const [displayBirths, setDisplayBirths] = useState(0);
  const [heatmap, setHeatmap] = useState<number[][]>(() =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
  );
  const [isInteracting, setIsInteracting] = useState(false);

  const canvasColors = useMemo(() => {
    if (typeof document === 'undefined') {
      return {
        bg: '#0a0a0f',
        border: '#1a1a2e',
        teal: '#00d4ff',
        tealDim: '#006680',
        textMuted: '#6b7280',
        danger: '#ff3366',
        accent: '#00ffcc',
        paperVoid: '#0a0a0f',
        paperSurface: '#12121a',
        paperElevated: '#1a1a2e',
        paperText: '#e5e5e5',
      };
    }
    const s = getComputedStyle(document.documentElement);
    return {
      bg: s.getPropertyValue('--paper-void').trim() || '#0a0a0f',
      border: s.getPropertyValue('--paper-border').trim() || '#1a1a2e',
      teal: s.getPropertyValue('--accent-primary').trim() || '#00d4ff',
      tealDim: s.getPropertyValue('--accent-dim').trim() || '#006680',
      textMuted: s.getPropertyValue('--paper-muted').trim() || '#6b7280',
      danger: s.getPropertyValue('--danger').trim() || '#ff3366',
      accent: s.getPropertyValue('--accent-secondary').trim() || '#00ffcc',
      paperVoid: s.getPropertyValue('--paper-void').trim() || '#0a0a0f',
      paperSurface: s.getPropertyValue('--paper-surface').trim() || '#12121a',
      paperElevated: s.getPropertyValue('--paper-elevated').trim() || '#1a1a2e',
      paperText: s.getPropertyValue('--paper-text').trim() || '#e5e5e5',
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width: Math.floor(width), height: Math.floor(Math.max(height, 400)) });
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
    let births = 0;
    let deaths = 0;

    grid.forEach((row, y) => {
      row.forEach((color, x) => {
        const key = `${x},${y}`;
        if (color) {
          currentCells.add(key);
          if (!lastGenCellsRef.current.has(key)) {
            newEvents.push({ x, y, timestamp: Date.now(), type: 'birth' });
            births++;
            if (particlesRef.current.length < MAX_PARTICLES) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 0.5 + Math.random() * 2;
              particlesRef.current.push({
                x: x * (containerSize.width / GRID_SIZE) + (containerSize.width / GRID_SIZE) / 2,
                y: y * (containerSize.height / GRID_SIZE) + (containerSize.height / GRID_SIZE) / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                maxLife: 40 + Math.random() * 30,
                size: 2 + Math.random() * 3,
                hue: 180 + Math.random() * 40,
                layer: 0,
              });
            }
          }
        } else if (lastGenCellsRef.current.has(key)) {
          newEvents.push({ x, y, timestamp: Date.now(), type: 'death' });
          deaths++;
          if (particlesRef.current.length < MAX_PARTICLES) {
            for (let i = 0; i < 3; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 1 + Math.random() * 3;
              particlesRef.current.push({
                x: x * (containerSize.width / GRID_SIZE) + (containerSize.width / GRID_SIZE) / 2,
                y: y * (containerSize.height / GRID_SIZE) + (containerSize.height / GRID_SIZE) / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                maxLife: 30 + Math.random() * 20,
                size: 1.5 + Math.random() * 2,
                hue: 340 + Math.random() * 30,
                layer: 0,
              });
            }
          }
        }
      });
    });

    if (newEvents.length > 0) {
      setBirthCount(prev => prev + births);
      setDeathCount(prev => prev + deaths);
      setDisplayBirths(prev => prev + births);
      setGeneration(prev => prev + 1);
    }

    lastGenCellsRef.current = currentCells;

    const raf = requestAnimationFrame(() => {
      setHeatmap(prev => {
        const next = prev.map(row => row.map(cell => cell * 0.95));
        grid.forEach((row, y) => {
          row.forEach((color, x) => {
            if (color) {
              next[y][x] = Math.min(next[y][x] + 0.3, 1);
            }
          });
        });
        return next;
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [grid, containerSize]);

  useEffect(() => {
    if (displayBirths > 0) {
      const timer = setTimeout(() => setDisplayBirths(Math.max(0, displayBirths - Math.ceil(displayBirths / 10))), 100);
      return () => clearTimeout(timer);
    }
  }, [displayBirths]);

  useEffect(() => {
    ambientRef.current = Array.from({ length: AMBIENT_PARTICLES }, () => ({
      x: Math.random() * 500,
      y: Math.random() * 800,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      life: 1,
      maxLife: 200 + Math.random() * 100,
      size: 0.5 + Math.random() * 1.5,
      hue: 180 + Math.random() * 60,
      layer: Math.floor(Math.random() * 3),
    }));
  }, []);

  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (containerSize.width / GRID_SIZE));
    const y = Math.floor((e.clientY - rect.top) / (containerSize.height / GRID_SIZE));
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      const idx = y * GRID_SIZE + x;
      const currentState = canvasPixels[idx];
      const newAlive = !currentState;
      setIsInteracting(true);
      setTimeout(() => setIsInteracting(false), 300);
      websocketService.emit('emergence:cell-toggle', { x, y, alive: newAlive });
    }
  }, [containerSize, canvasPixels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const glowCanvas = glowCanvasRef.current;
    const particleCanvas = particleCanvasRef.current;
    if (!canvas || !glowCanvas || !particleCanvas) return;

    const ctx = canvas.getContext('2d');
    const glowCtx = glowCanvas.getContext('2d');
    const particleCtx = particleCanvas.getContext('2d');
    if (!ctx || !glowCtx || !particleCtx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerSize.width * dpr;
    canvas.height = containerSize.height * dpr;
    ctx.scale(dpr, dpr);

    glowCanvas.width = containerSize.width * dpr;
    glowCanvas.height = containerSize.height * dpr;
    glowCtx.scale(dpr, dpr);

    particleCanvas.width = containerSize.width * dpr;
    particleCanvas.height = containerSize.height * dpr;
    particleCtx.scale(dpr, dpr);

    const cellSize = containerSize.width / GRID_SIZE;
    const time = Date.now() * 0.001;
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;

    const gradient = glowCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(centerX, centerY));
    const activityLevel = heatmap.flat().reduce((a, b) => a + b, 0) / (GRID_SIZE * GRID_SIZE);
    const accentRgb = hexToRgb(canvasColors.teal);
    gradient.addColorStop(0, `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${0.1 + activityLevel * 0.15})`);
    gradient.addColorStop(0.5, `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${0.05 + activityLevel * 0.08})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    glowCtx.fillStyle = gradient;
    glowCtx.fillRect(0, 0, containerSize.width, containerSize.height);

    for (let i = 0; i <= GRID_SIZE; i++) {
      const distFromCenter = Math.abs(i * cellSize - centerX) / centerX;
      const pulseIntensity = Math.sin(time * 2 + i * 0.3) * 0.5 + 0.5;
      const alpha = 0.1 + (1 - distFromCenter) * 0.15 * pulseIntensity;

      glowCtx.strokeStyle = `rgba(26, 26, 46, ${alpha})`;
      glowCtx.lineWidth = 0.5 + pulseIntensity * 0.5;
      glowCtx.beginPath();
      glowCtx.moveTo(i * cellSize, 0);
      glowCtx.lineTo(i * cellSize, containerSize.height);
      glowCtx.stroke();

      glowCtx.beginPath();
      glowCtx.moveTo(0, i * cellSize);
      glowCtx.lineTo(containerSize.width, i * cellSize);
      glowCtx.stroke();
    }

    const vignetteGradient = ctx.createRadialGradient(centerX, centerY, centerX * 0.3, centerX, centerY, centerX * 1.2);
    vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignetteGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
    vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

    ctx.fillStyle = canvasColors.bg;
    ctx.fillRect(0, 0, containerSize.width, containerSize.height);

    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, containerSize.width, containerSize.height);

    const clusterCenters: { x: number; y: number; density: number }[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (heatmap[y][x] > 0.5) {
          let localDensity = 0;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < GRID_SIZE && nx >= 0 && nx < GRID_SIZE) {
                localDensity += heatmap[ny][nx];
              }
            }
          }
          if (localDensity > 3) {
            clusterCenters.push({
              x: x * cellSize + cellSize / 2,
              y: y * cellSize + cellSize / 2,
              density: localDensity,
            });
          }
        }
      }
    }

    orbitalRingsRef.current = clusterCenters.map(center => ({
      cx: center.x,
      cy: center.y,
      radius: 20 + center.density * 3,
      angle: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.02,
      thickness: 1 + center.density * 0.2,
      hue: 180 + Math.random() * 40,
    }));

    orbitalRingsRef.current.forEach(ring => {
      ring.angle += ring.speed;

      glowCtx.save();
      glowCtx.strokeStyle = `hsla(${ring.hue}, 100%, 60%, ${0.3 + Math.sin(time * 3 + ring.angle) * 0.2})`;
      glowCtx.lineWidth = ring.thickness;
      glowCtx.setLineDash([5, 5 + Math.sin(time * 2) * 3]);
      glowCtx.lineDashOffset = -time * 20;
      glowCtx.beginPath();
      glowCtx.arc(ring.cx, ring.cy, ring.radius, 0, Math.PI * 2);
      glowCtx.stroke();
      glowCtx.restore();
    });

    grid.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color) {
          const px = x * cellSize;
          const py = y * cellSize;
          const pulseScale = 1 + Math.sin(time * 4 + x * 0.5 + y * 0.5) * 0.1;
          const glowSize = cellSize * pulseScale;

          const cellGradient = glowCtx.createRadialGradient(
            px + cellSize / 2, py + cellSize / 2, 0,
            px + cellSize / 2, py + cellSize / 2, cellSize
          );
          cellGradient.addColorStop(0, `hsla(180, 100%, 70%, 0.8)`);
          cellGradient.addColorStop(0.5, `hsla(180, 100%, 50%, 0.3)`);
          cellGradient.addColorStop(1, `hsla(180, 100%, 50%, 0)`);

          glowCtx.fillStyle = cellGradient;
          glowCtx.fillRect(px - cellSize / 2, py - cellSize / 2, cellSize * 2, cellSize * 2);

          const borderPhase = time * 3 + x * 0.3 + y * 0.3;
          const borderAlpha = 0.5 + Math.sin(borderPhase) * 0.3;
          glowCtx.strokeStyle = `hsla(180, 100%, 80%, ${borderAlpha})`;
          glowCtx.lineWidth = 1.5;
          glowCtx.strokeRect(px + 1, py + 1, glowSize - 2, glowSize - 2);

          ctx.shadowColor = canvasColors.teal;
          ctx.shadowBlur = 15;
          ctx.fillStyle = canvasColors.teal;
          ctx.fillRect(px + 2, py + 2, glowSize - 4, glowSize - 4);
          ctx.shadowBlur = 0;

          ctx.fillStyle = canvasColors.tealDim;
          ctx.globalAlpha = 0.6;
          ctx.fillRect(px + 3, py + 3, (glowSize - 6) / 3, (glowSize - 6) / 3);
          ctx.globalAlpha = 1;
        }
      });
    });

    ghostsRef.current = ghostsRef.current.filter(ghost => {
      ghost.alpha -= ghost.fadeRate;
      if (ghost.alpha > 0) {
        const gx = ghost.x * cellSize;
        const gy = ghost.y * cellSize;
        ctx.fillStyle = canvasColors.teal;
        ctx.globalAlpha = ghost.alpha * 0.3;
        ctx.fillRect(gx + 2, gy + 2, cellSize - 4, cellSize - 4);
        ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });

    if (ghostsRef.current.length < MAX_GHOSTS && Math.random() < 0.1) {
      const activeCells: { x: number; y: number }[] = [];
      grid.forEach((row, y) => {
        row.forEach((color, x) => {
          if (color) activeCells.push({ x, y });
        });
      });
      if (activeCells.length > 0) {
        const cell = activeCells[Math.floor(Math.random() * activeCells.length)];
        ghostsRef.current.push({ x: cell.x, y: cell.y, alpha: 0.5, fadeRate: 0.02 });
      }
    }

    particleCtx.clearRect(0, 0, containerSize.width, containerSize.height);

    const parallaxFactors = [0.3, 0.5, 1.0];
    [0, 1, 2].forEach(layer => {
      const layerParticles = particlesRef.current.filter(p => p.layer === layer);
      layerParticles.forEach(p => {
        const parallaxFactor = parallaxFactors[layer];
        particleCtx.beginPath();
        particleCtx.arc(
          p.x + p.vx * (time * 50) * parallaxFactor,
          p.y + p.vy * (time * 50) * parallaxFactor,
          p.size * (1 + (1 - p.life) * 0.5),
          0, Math.PI * 2
        );
        particleCtx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.life * 0.8})`;
        particleCtx.fill();
      });
    });

    ambientRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = containerSize.width;
      if (p.x > containerSize.width) p.x = 0;
      if (p.y < 0) p.y = containerSize.height;
      if (p.y > containerSize.height) p.y = 0;

      const blurAmt = p.layer === 0 ? 2 : p.layer === 1 ? 1 : 0;
      particleCtx.filter = blurAmt > 0 ? `blur(${blurAmt}px)` : 'none';
      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      particleCtx.fillStyle = `hsla(${p.hue}, 60%, 60%, ${0.3 + Math.sin(time + p.x * 0.01) * 0.2})`;
      particleCtx.fill();
      particleCtx.filter = 'none';
    });

    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= 1 / p.maxLife;
      return p.life > 0;
    });

  }, [grid, containerSize, canvasColors, heatmap, hexToRgb]);

  const totalPixels = canvasPixels.filter(c => c).length;
  const density = (totalPixels / (GRID_SIZE * GRID_SIZE) * 100).toFixed(1);
  const activityLevel = heatmap.flat().reduce((a, b) => a + b, 0) / (GRID_SIZE * GRID_SIZE);
  const speedIndicator = activityLevel > 0.5 ? 'FAST' : activityLevel > 0.2 ? 'MED' : 'SLOW';

  if (totalPixels === 0) {
    return (
      <div
        className="flex flex-col p-6 min-h-[400px] rounded-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(10, 10, 15, 0.95) 0%, rgba(20, 20, 30, 0.9) 100%)',
          border: '1px solid rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 50%)',
            }}
          />
        </div>

        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: canvasColors.teal, boxShadow: `0 0 10px ${canvasColors.teal}` }} />
          <span className="text-base font-bold tracking-wide" style={{ color: canvasColors.paperText }}>Emergence Grid</span>
          <span
            className="text-base px-2 py-0.5 rounded"
            style={{ backgroundColor: canvasColors.paperElevated, color: canvasColors.textMuted }}
          >
            IDLE
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10">
          <div className="relative">
            <div
              className="absolute inset-0 blur-xl rounded-full"
              style={{ background: `radial-gradient(circle, ${canvasColors.teal}20 0%, transparent 70%)` }}
            />
            <div className="grid grid-cols-10 gap-1 opacity-40">
              {Array.from({ length: 100 }).map((_, i) => {
                const isActive = i % 7 === 0;
                const delay = i * 50;
                const size = 12 + (i % 3) * 2;
                return (
                  <div
                    key={i}
                    className="rounded-sm animate-pulse"
                    style={{
                      width: size,
                      height: size,
                      backgroundColor: isActive ? canvasColors.teal : canvasColors.paperSurface,
                      opacity: isActive ? 0.6 : 1,
                      animationDelay: `${delay}ms`,
                      animationDuration: `${2000 + (i % 1000)}ms`,
                      boxShadow: isActive ? `0 0 ${size}px ${canvasColors.teal}` : 'none',
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-base font-mono" style={{ color: canvasColors.textMuted }}>
              &gt; grid initialized — awaiting cell activity
            </p>
            <p className="text-base" style={{ color: canvasColors.tealDim }}>
              The cellular automaton blooms when participants submit prompts
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm" style={{ color: canvasColors.textMuted }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: canvasColors.teal }} />
              <span>Active cells</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: canvasColors.danger }} />
              <span>Deaths</span>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-24 opacity-30"
          style={{
            background: `linear-gradient(to top, ${canvasColors.paperVoid}, transparent)` }}
        />
      </div>
    );
  }

  return (
    <div
      className="card flex flex-col min-h-[400px] relative overflow-hidden rounded-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(10, 10, 15, 0.98) 0%, rgba(18, 18, 26, 0.95) 100%)',
        border: '1px solid rgba(26, 26, 46, 0.6)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-between mb-3 pb-3 px-1 relative z-10" style={{ borderBottom: '1px solid rgba(26, 26, 46, 0.8)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{
              backgroundColor: canvasColors.teal,
              boxShadow: `0 0 8px ${canvasColors.teal}, 0 0 16px ${canvasColors.teal}50`,
            }}
          />
          <h3 className="text-base font-medium tracking-wide" style={{ color: canvasColors.paperText }}>
            Emergence Grid
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: canvasColors.teal + '20',
              color: canvasColors.teal,
              border: `1px solid ${canvasColors.teal}40`,
            }}
          >
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm" style={{ color: canvasColors.textMuted }}>
          <span className="flex items-center gap-1.5">
            <span style={{ color: canvasColors.teal }}>GEN</span>
            <span className="font-mono font-bold" style={{ color: canvasColors.paperText }}>{generation}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ color: canvasColors.danger }}>SPD</span>
            <span className="font-mono font-bold" style={{ color: canvasColors.paperText }}>{speedIndicator}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 mb-3 text-sm rounded-lg p-2" style={{
        backgroundColor: canvasColors.paperVoid + '80',
        border: `1px solid ${canvasColors.border}40`,
      }}>
        <div className="flex items-center gap-2">
          <span style={{ color: canvasColors.textMuted }}>Density:</span>
          <span className="font-mono font-bold" style={{ color: canvasColors.teal }}>{density}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: canvasColors.textMuted }}>Units:</span>
          <span className="font-mono" style={{ color: canvasColors.paperText }}>{totalPixels}/{GRID_SIZE * GRID_SIZE}</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: canvasColors.textMuted }}>Activity:</span>
          <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: canvasColors.border }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${activityLevel * 100}%`,
                background: `linear-gradient(90deg, ${canvasColors.teal}, ${canvasColors.accent})`,
                boxShadow: `0 0 8px ${canvasColors.teal}`,
              }}
            />
          </div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 flex items-center justify-center rounded-lg overflow-hidden relative" style={{
        backgroundColor: canvasColors.bg,
        border: `1px solid ${isInteracting ? 'var(--bloom-primary)' : canvasColors.border}`,
        boxShadow: `inset 0 0 60px rgba(0, 0, 0, 0.5)${isInteracting ? ', 0 0 20px var(--bloom-glow)' : ''}`,
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        <canvas
          ref={canvasRef}
          width={containerSize.width}
          height={containerSize.height}
          className="rounded w-full h-full cursor-pointer hover:brightness-110 transition-all duration-200"
          role="img"
          aria-label="Emergence grid canvas showing cellular automaton state"
          onClick={handleCanvasClick}
        />
        <canvas
          ref={glowCanvasRef}
          width={containerSize.width}
          height={containerSize.height}
          className="absolute rounded w-full h-full pointer-events-none"
          aria-hidden="true"
        />
        <canvas
          ref={particleCanvasRef}
          width={containerSize.width}
          height={containerSize.height}
          className="absolute rounded w-full h-full pointer-events-none"
          aria-hidden="true"
        />

        <div
          className="absolute inset-0 pointer-events-none rounded"
          style={{
            boxShadow: `inset 0 0 80px rgba(0, 0, 0, 0.6)`,
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm relative z-10">
        <div className="flex items-center gap-1.5" style={{ color: canvasColors.textMuted }}>
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: canvasColors.teal,
              boxShadow: `0 0 6px ${canvasColors.teal}`,
            }}
          />
          <span>Live visualization</span>
        </div>
        <div className="flex items-center gap-4" style={{ color: canvasColors.textMuted }}>
          <div className="flex items-center gap-1.5">
            <span style={{ color: canvasColors.teal }}>+</span>
            <span className="font-mono font-bold transition-all duration-300" style={{ color: canvasColors.teal }}>
              {birthCount}
            </span>
            <span className="text-xs">births</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ color: canvasColors.danger }}>-</span>
            <span className="font-mono font-bold transition-all duration-300" style={{ color: canvasColors.danger }}>
              {deathCount}
            </span>
            <span className="text-xs">deaths</span>
          </div>
        </div>
      </div>

      <div
        className="mt-2 pt-2 px-1 text-center rounded-b-xl"
        style={{
          borderTop: `1px solid ${canvasColors.border}40`,
          background: `linear-gradient(to top, ${canvasColors.paperVoid}80, transparent)`,
        }}
      >
        <p className="text-xs" style={{ color: canvasColors.textMuted }}>
          Cellular automaton emergence visualization with neural network dynamics
        </p>
      </div>
    </div>
  );
};
