import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useAgent } from '../context/useAgent';
import { Activity, TrendingUp, Zap, Clock, Sparkles, Radio } from 'lucide-react';
const ThreeDCanvas = lazy(() => import('./ThreeDCanvas'));

function withAlpha(color: string, alphaHex: string): string {
  if (color.startsWith('#')) return color + alphaHex;
  const alpha = parseInt(alphaHex, 16) / 255;
  if (color.startsWith('oklch(')) {
    return color.includes('/') ? color.replace(/\/[^)]*\)/, `/ ${alpha})`) : color.replace(')', ` / ${alpha})`);
  }
  if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  if (color.startsWith('hsl(')) return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
  return color;
}

interface MetricPoint {
  timestamp: number;
  value: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  color: string;
}

const AnimatedCounter = ({ value, duration = 500, color }: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const startValue = prevValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value, duration]);

  return <span style={{ color }}>{displayValue.toLocaleString()}</span>;
};

interface ConsolidatedAnimationRefs {
  progressGlow?: number;
  pulseAngle?: number;
  orbitalAngle?: number;
}

const ConsolidatedRings = ({
  vitality, momentum, coherence,
  colors, size = 60, strokeWidth = 4
}: {
  vitality: number; momentum: number; coherence: number;
  colors: { vitality: string; momentum: string; coherence: string };
  size?: number; strokeWidth?: number;
}) => {
  const vitalityRef = useRef<HTMLCanvasElement>(null);
  const momentumRef = useRef<HTMLCanvasElement>(null);
  const coherenceRef = useRef<HTMLCanvasElement>(null);
  const animRefs = useRef<ConsolidatedAnimationRefs>({});
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctxVitality = vitalityRef.current?.getContext('2d');
    const ctxMomentum = momentumRef.current?.getContext('2d');
    const ctxCoherence = coherenceRef.current?.getContext('2d');
    if (!ctxVitality || !ctxMomentum || !ctxCoherence) return;

    const draw = () => {
      if (document.hidden) { rafRef.current = requestAnimationFrame(draw); return; }
      const drawProgressRing = (ctx: CanvasRenderingContext2D, progress: number, color: string) => {
        const cx = size / 2;
        const cy = size / 2;
        const radius = (size - strokeWidth) / 2;

        ctx.clearRect(0, 0, size, size);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = strokeWidth;
        ctx.stroke();

        animRefs.current.progressGlow = ((animRefs.current.progressGlow || 0) + 0.05) % (Math.PI * 2);
        const glowIntensity = 0.3 + Math.sin(animRefs.current.progressGlow) * 0.2;

        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, withAlpha(color, '80'));

        ctx.beginPath();
        ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + (progress / 100) * Math.PI * 2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = 8 * glowIntensity;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(color, '10');
        ctx.fill();
      };

      drawProgressRing(ctxVitality, vitality, colors.vitality);
      drawProgressRing(ctxMomentum, momentum, colors.momentum);
      drawProgressRing(ctxCoherence, coherence, colors.coherence);

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [vitality, momentum, coherence, colors, size, strokeWidth]);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative' }}>
        <canvas ref={vitalityRef} width={size} height={size} style={{ transform: 'rotate(-90deg)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--paper-muted)', marginTop: 2 }}>VIT</span>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <canvas ref={momentumRef} width={size} height={size} style={{ transform: 'rotate(-90deg)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--paper-muted)', marginTop: 2 }}>MOM</span>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <canvas ref={coherenceRef} width={size} height={size} style={{ transform: 'rotate(-90deg)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--paper-muted)', marginTop: 2 }}>COH</span>
        </div>
      </div>
    </div>
  );
};

const ConsolidatedPulseIndicator = ({ color }: { color: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, 20, 20);
      animRef.current = (animRef.current + 0.08) % (Math.PI * 2);

      const scale = 1 + Math.sin(animRef.current) * 0.3;
      const alpha = 0.5 + Math.sin(animRef.current) * 0.3;

      ctx.beginPath();
      ctx.arc(10, 10, 6 * scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.arc(10, 10, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [color]);

  return <canvas ref={canvasRef} width={20} height={20} />;
};

const MiniSparkline = ({ data, color, height = 30 }: { data: MetricPoint[]; color: string; height?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, withAlpha(color, '40'));
    gradient.addColorStop(1, withAlpha(color, '00'));

    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.moveTo(0, h);

    data.forEach((point, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (point.value / 100) * h * 0.8 - h * 0.1;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((point, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (point.value / 100) * h * 0.8 - h * 0.1;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [data, color, height]);

  return <canvas ref={canvasRef} width={80} height={height} />;
};

const MiniBarChart = ({ data, color }: { data: MetricPoint[]; color: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const barWidth = w / Math.max(data.length, 1);

    ctx.clearRect(0, 0, w, h);

    data.slice(-10).forEach((point, i) => {
      const barH = (point.value / 100) * h * 0.8;
      const x = i * barWidth + 1;
      const y = h - barH;

      ctx.fillStyle = withAlpha(color, '60');
      ctx.fillRect(x, y, barWidth - 2, barH);

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 3;
      ctx.fillRect(x, y, barWidth - 2, 2);
      ctx.shadowBlur = 0;
    });
  }, [data, color]);

  return <canvas ref={canvasRef} width={80} height={24} />;
};

const ParticleField = ({ colors }: { colors: string[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const createParticle = (): Particle => ({
      id: idRef.current++,
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 1.5 - 0.5,
      life: 0,
      maxLife: 100 + Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 2 + 1,
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add new particles occasionally
      if (Math.random() < 0.1 && particlesRef.current.length < 30) {
        particlesRef.current.push(createParticle());
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const alpha = 1 - p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(p.color, Math.floor(alpha * 99).toString(16).padStart(2, '0'));
        ctx.fill();

        return p.life < p.maxLife;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [colors]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
};

function MetricBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  const [glowIntensity, setGlowIntensity] = useState(0);
  const prevValue = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (value !== prevValue.current) {
      setGlowIntensity(1);
      prevValue.current = value;
    }
    
    const animate = () => {
      if (document.hidden) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      setGlowIntensity(prev => {
        const next = Math.max(0, prev - 0.02);
        if (next <= 0) {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          return next;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--paper-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {icon} {label}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, textShadow: `0 0 ${10 * glowIntensity}px ${color}` }}>
          {Math.round(value)}%
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--paper-void)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: `linear-gradient(90deg, ${withAlpha(color, '80')}, ${color})`,
          borderRadius: 3,
          transition: 'width 300ms ease',
          boxShadow: `0 0 ${10 + glowIntensity * 15}px ${withAlpha(color, '60')}, inset 0 1px 0 rgba(255,255,255,0.3)`,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.2), transparent)',
            borderRadius: 3,
          }} />
        </div>
      </div>
    </div>
  );
}

export const LiveMetrics = () => {
  const { creatureStats, creatureMood, totalPromptsProcessed, emergenceGeneration, diemStaked } = useAgent();
  const [vitalityHistory, setVitalityHistory] = useState<MetricPoint[]>([]);
  const [momentumHistory, setMomentumHistory] = useState<MetricPoint[]>([]);
  const [coherenceHistory, setCoherenceHistory] = useState<MetricPoint[]>([]);
  const [updateFrequency, setUpdateFrequency] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const prevVitality = useRef(creatureStats?.vitality);
  const prevMomentum = useRef(creatureStats?.momentum);
  const prevCoherence = useRef(creatureStats?.coherence);
  const updatesRef = useRef<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync canvas pixel resolution to container width for sharp rendering on all screens
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(160 * dpr);
    });

    observer.observe(container);
    // Initial sizing
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(160 * dpr);

    return () => observer.disconnect();
  }, []);

  // Track metric history
  useEffect(() => {
    const v = creatureStats?.vitality ?? 0;
    const m = creatureStats?.momentum ?? 0;
    const c = creatureStats?.coherence ?? 0;
    const changed = v !== prevVitality.current || m !== prevMomentum.current || c !== prevCoherence.current;
    if (!changed) return;

    prevVitality.current = v;
    prevMomentum.current = m;
    prevCoherence.current = c;

    const now = Date.now();
    updatesRef.current.push(now);
    updatesRef.current = updatesRef.current.filter(t => now - t < 1000);
    setUpdateFrequency(updatesRef.current.length);

    setVitalityHistory(prev => [...prev.slice(-50), { timestamp: now, value: v }]);
    setMomentumHistory(prev => [...prev.slice(-50), { timestamp: now, value: m }]);
    setCoherenceHistory(prev => [...prev.slice(-50), { timestamp: now, value: c }]);
  }, [creatureStats?.vitality, creatureStats?.momentum, creatureStats?.coherence]);

  // Get computed colors from CSS variables
  const getColor = (cssVar: string): string => {
    if (typeof document === 'undefined') return cssVar;
    const varName = cssVar.replace('var(', '').replace(')', '');
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return value || cssVar;
  };

  // Animated sparkline renderer with gradient fills and particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let offset = 0;
    let idCounter = 0;

    const createParticle = (x: number, y: number, color: string): Particle => ({
      id: idCounter++,
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2 - 1,
      life: 0,
      maxLife: 60 + Math.random() * 40,
      color,
      size: Math.random() * 2 + 1,
    });

    const drawLine = (data: MetricPoint[], color: string) => {
      if (data.length < 2) return;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, withAlpha(color, '40'));
      gradient.addColorStop(0.5, withAlpha(color, '15'));
      gradient.addColorStop(1, withAlpha(color, '00'));

      ctx.beginPath();
      ctx.moveTo(0, canvas.height);

      for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * canvas.width;
        const y = canvas.height - (data[i].value / 100) * canvas.height;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, canvas.height - (data[0].value / 100) * canvas.height);

      for (let i = 1; i < data.length; i++) {
        const x = (i / (data.length - 1)) * canvas.width;
        const y = canvas.height - (data[i].value / 100) * canvas.height;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (data.length > 0) {
        const last = data[data.length - 1];
        const x = canvas.width;
        const y = canvas.height - (last.value / 100) * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(color, '30');
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (Math.abs(last.value - (data[data.length - 2]?.value ?? last.value)) > 5) {
          if (particlesRef.current.length < 20) {
            particlesRef.current.push(createParticle(x, y, color));
          }
        }
      }
    };

    let rafId: number;

    const draw = () => {
      if (!document.hidden) {
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = 'rgba(10, 10, 20, 0.3)';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.lineWidth = 0.5;
        for (let y = 0; y < h; y += 12) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        for (let x = 0; x < w; x += 12) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }

        drawLine(vitalityHistory, getColor('var(--success)'));
        drawLine(momentumHistory, getColor('var(--accent-primary)'));
        drawLine(coherenceHistory, getColor('var(--accent-dim)'));

        particlesRef.current = particlesRef.current.filter(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.02;
          p.life++;

          const alpha = 1 - p.life / p.maxLife;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = withAlpha(p.color, Math.floor(alpha * 255).toString(16).padStart(2, '0'));
          ctx.fill();

          return p.life < p.maxLife;
        });

        offset = (offset + 1) % w;
        const accentColor = getColor('var(--accent-primary)');
        const scanGradient = ctx.createLinearGradient(offset - 30, 0, offset + 30, 0);
        scanGradient.addColorStop(0, 'transparent');
        scanGradient.addColorStop(0.5, withAlpha(accentColor, '26'));
        scanGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = scanGradient;
        ctx.fillRect(offset - 30, 0, 60, h);

      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [vitalityHistory, momentumHistory, coherenceHistory]);

  const moodColor = creatureMood === 'ecstatic' ? getColor('var(--success)') :
                    creatureMood === 'happy' ? getColor('var(--accent-primary)') :
                    creatureMood === 'anxious' ? getColor('var(--warning)') : getColor('var(--paper-muted)');

  return (
    <div style={{
      background: `linear-gradient(145deg, ${withAlpha(getColor('var(--paper-void)'), 'f2')}, ${withAlpha(getColor('var(--paper-deep)'), 'e6')})`,
      border: `1px solid ${getColor('var(--paper-border)')}`,
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      {/* Background particles */}
      <ParticleField colors={[getColor('var(--success)'), getColor('var(--accent-primary)'), getColor('var(--accent-dim)')]} />

      {/* Depth gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, ${withAlpha(getColor('var(--accent-primary)'), '14')}, transparent 60%)`,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Activity size={18} style={{ color: getColor('var(--accent-primary)'), filter: `drop-shadow(0 0 8px ${getColor('var(--accent-primary)')})` }} />
          <ConsolidatedPulseIndicator color={getColor('var(--success)')} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--paper-text)', margin: 0, letterSpacing: 2 }}>
          LIVE TELEMETRY
        </h3>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: `${withAlpha(getColor('var(--paper-surface)'), '0d')}`, borderRadius: 'var(--radius-sm)', border: `1px solid ${withAlpha(getColor('var(--paper-border)'), '0d')}` }}>
          <Radio size={10} style={{ color: getColor('var(--success)') }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--paper-muted)' }}>{updateFrequency} Hz</span>
        </div>
      </div>

      {/* Metric bars with rings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 24, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <MetricBar label="VITALITY" value={creatureStats?.vitality || 0} color={getColor('var(--success)')} icon={<Activity size={10} />} />
          <MetricBar label="MOMENTUM" value={creatureStats?.momentum || 0} color={getColor('var(--accent-primary)')} icon={<TrendingUp size={10} />} />
          <MetricBar label="COHERENCE" value={creatureStats?.coherence || 0} color={getColor('var(--accent-dim)')} icon={<Zap size={10} />} />
        </div>
        <ConsolidatedRings
          vitality={creatureStats?.vitality || 0}
          momentum={creatureStats?.momentum || 0}
          coherence={creatureStats?.coherence || 0}
          colors={{ vitality: getColor('var(--success)'), momentum: getColor('var(--accent-primary)'), coherence: getColor('var(--accent-dim)') }}
          size={50}
          strokeWidth={3}
        />
      </div>

      {/* Large sparkline canvas */}
      <div ref={containerRef} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: `1px solid ${getColor('var(--paper-border)')}`, marginBottom: 20 }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Suspense fallback={<div style={{ height: 160 }} />}>
            <ThreeDCanvas width={460} height={160} />
          </Suspense>
        </div>
        <canvas ref={canvasRef} style={{ width: '100%', height: 160, display: 'block', position: 'relative', zIndex: 2 }} />
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8, background: `${withAlpha(getColor('var(--paper-void)'), 'cc')}`, padding: '6px 10px', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(8px)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: getColor('var(--success)') }}>&#9679; VIT</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: getColor('var(--accent-primary)') }}>&#9679; MOM</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: getColor('var(--accent-dim)') }}>&#9679; COH</span>
        </div>
        <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Sparkles size={10} style={{ color: getColor('var(--paper-muted)') }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: getColor('var(--paper-muted)') }}>REAL-TIME STREAM</span>
        </div>
      </div>

      {/* Stats grid with mini charts */}
      <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: 12, marginBottom: 20 }}>
        <div style={{
          textAlign: 'center',
          padding: '12px 8px',
          background: `${withAlpha(getColor('var(--paper-surface)'), '05')}`,
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${withAlpha(getColor('var(--paper-border)'), '0d')}`,
          position: 'relative',
        }}>
          <MiniSparkline data={vitalityHistory} color={getColor('var(--success)')} height={25} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: getColor('var(--accent-primary)'), marginTop: 4 }}>
            <AnimatedCounter value={totalPromptsProcessed || 0} color={getColor('var(--accent-primary)')} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: getColor('var(--paper-muted)'), textTransform: 'uppercase', marginTop: 2 }}>Prompts</div>
        </div>
        <div style={{
          textAlign: 'center',
          padding: '12px 8px',
          background: `${withAlpha(getColor('var(--paper-surface)'), '05')}`,
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${withAlpha(getColor('var(--paper-border)'), '0d')}`,
          position: 'relative',
        }}>
          <MiniSparkline data={momentumHistory} color={getColor('var(--accent-primary)')} height={25} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: getColor('var(--accent-primary)'), marginTop: 4 }}>
            <AnimatedCounter value={emergenceGeneration || 0} color={getColor('var(--accent-primary)')} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: getColor('var(--paper-muted)'), textTransform: 'uppercase', marginTop: 2 }}>Generations</div>
        </div>
        <div style={{
          textAlign: 'center',
          padding: '12px 8px',
          background: `linear-gradient(145deg, ${withAlpha(getColor('var(--warning)'), '1a')}, ${withAlpha(getColor('var(--warning)'), '05')})`,
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${withAlpha(getColor('var(--warning)'), '33')}`,
          position: 'relative',
          boxShadow: `0 0 20px ${withAlpha(getColor('var(--warning)'), '1a')}, inset 0 0 20px ${withAlpha(getColor('var(--warning)'), '0d')}`,
        }}>
          <MiniBarChart data={coherenceHistory} color={getColor('var(--warning)')} />
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 20,
            fontWeight: 700,
            color: getColor('var(--warning)'),
            marginTop: 4,
            textShadow: `0 0 20px ${withAlpha(getColor('var(--warning)'), '80')}`,
          }}>
            <AnimatedCounter value={diemStaked || 0} color={getColor('var(--warning)')} />
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            color: getColor('var(--warning)'),
            textTransform: 'uppercase',
            marginTop: 2,
            letterSpacing: 1,
          }}>DIEM Staked</div>
        </div>
      </div>

      {/* Entity mood with dramatic color cycling */}
      <div style={{
        marginTop: 16,
        padding: '14px 18px',
        background: `linear-gradient(145deg, ${withAlpha(getColor('var(--paper-void)'), '4d')}, ${withAlpha(getColor('var(--paper-void)'), '33')})`,
        border: `1px solid ${getColor('var(--paper-border)')}`,
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg, transparent, ${withAlpha(moodColor, '10')}, transparent)`,
          animation: 'shimmer 3s ease-in-out infinite',
        }} />

        <Clock size={14} style={{ color: moodColor, filter: `drop-shadow(0 0 6px ${moodColor})` }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--paper-muted)' }}>
          ENTITY MOOD:
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 700,
          color: moodColor,
          textTransform: 'uppercase',
          letterSpacing: 2,
          textShadow: `0 0 15px ${withAlpha(moodColor, '80')}`,
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          {creatureMood || 'STANDBY'}
        </span>

        {/* Mood indicator bars */}
        <div style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>
          {['ecstatic', 'happy', 'anxious', 'neutral'].map(mood => (
            <div key={mood} style={{
              width: 4,
              height: 16,
              borderRadius: 2,
              background: creatureMood === mood ? moodColor : withAlpha(getColor('var(--paper-text)'), '1a'),
              boxShadow: creatureMood === mood ? `0 0 8px ${moodColor}` : 'none',
              transition: 'all 300ms ease',
            }} />
          ))}
        </div>
      </div>

    </div>
  );
};

export default LiveMetrics;
