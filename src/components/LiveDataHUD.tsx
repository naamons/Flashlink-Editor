import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ChevronDown, ChevronUp, Gauge, Droplets, Thermometer, TrendingUp } from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────── */
interface Channel {
  key: string;
  label: string;
  unit: string;
  color: string;
  min: number;
  max: number;
  decimals: number;
  icon: React.ReactNode;
  getValue: (t: number) => number;
}

const SAMPLE_COUNT = 80; // sparkline history depth

/* Demo signal generators – replace with real data source later */
const channels: Channel[] = [
  {
    key: 'rpm', label: 'RPM', unit: 'rpm', color: '#42a5f5', min: 0, max: 8000, decimals: 0,
    icon: <Gauge size={13} />,
    getValue: (t) => 3200 + Math.sin(t * 0.8) * 1800 + Math.sin(t * 2.1) * 400 + (Math.random() - 0.5) * 150,
  },
  {
    key: 'load', label: 'Load', unit: '%', color: '#a78bfa', min: 0, max: 100, decimals: 1,
    icon: <TrendingUp size={13} />,
    getValue: (t) => 55 + Math.sin(t * 0.9) * 30 + Math.sin(t * 1.7) * 12 + (Math.random() - 0.5) * 5,
  },
  {
    key: 'afr', label: 'AFR', unit: 'λ', color: '#4ade80', min: 10, max: 17, decimals: 2,
    icon: <Droplets size={13} />,
    getValue: (t) => 14.7 + Math.sin(t * 1.2) * 1.8 + (Math.random() - 0.5) * 0.4,
  },
  {
    key: 'stft', label: 'STFT', unit: '%', color: '#fbbf24', min: -25, max: 25, decimals: 1,
    icon: <Thermometer size={13} />,
    getValue: (t) => 2.3 + Math.sin(t * 3.1) * 12 + (Math.random() - 0.5) * 3,
  },
  {
    key: 'ltft', label: 'LTFT', unit: '%', color: '#fb923c', min: -25, max: 25, decimals: 1,
    icon: <Thermometer size={13} />,
    getValue: (t) => 1.5 + Math.sin(t * 0.3) * 5 + (Math.random() - 0.5) * 1,
  },
];

/* ── Sparkline Canvas ───────────────────────────────────────────── */
function Sparkline({
  samples, color, min, max, width = 120, height = 36,
}: {
  samples: number[];
  color: string;
  min: number;
  max: number;
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = width  * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (samples.length < 2) return;
    const range = max - min || 1;

    const toY = (v: number) => height - ((v - min) / range) * height;

    // Fill area
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, color + '55');
    grad.addColorStop(1, color + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    samples.forEach((v, i) => {
      const x = (i / (samples.length - 1)) * width;
      const y = toY(Math.max(min, Math.min(max, v)));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Line
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.beginPath();
    samples.forEach((v, i) => {
      const x = (i / (samples.length - 1)) * width;
      const y = toY(Math.max(min, Math.min(max, v)));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Current value dot
    const lastV = samples[samples.length - 1];
    const dotX  = width;
    const dotY  = toY(Math.max(min, Math.min(max, lastV)));
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [samples, color, min, max, width, height]);

  return <canvas ref={canvasRef} style={{ width, height, display: 'block' }} />;
}

/* ── HUD Channel Card ───────────────────────────────────────────── */
function ChannelCard({ ch, samples }: { ch: Channel; samples: number[] }) {
  const current = samples[samples.length - 1] ?? 0;
  const t = samples.length > 1
    ? (current - ch.min) / ((ch.max - ch.min) || 1)
    : 0;

  // Value color: green center, amber edges, red extremes
  const valueColor = t < 0.15 || t > 0.85 ? 'var(--red)' : t < 0.25 || t > 0.75 ? 'var(--accent-primary)' : ch.color;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '8px', padding: '8px 12px',
      minWidth: '180px',
    }}>
      {/* Icon + label */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '52px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: ch.color }}>
          {ch.icon}
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{ch.label}</span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: valueColor, lineHeight: 1 }}>
          {current.toFixed(ch.decimals)}
        </div>
        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{ch.unit}</div>
      </div>

      {/* Sparkline */}
      <div className="hud-channel">
        <Sparkline samples={samples} color={ch.color} min={ch.min} max={ch.max} width={110} height={34} />
      </div>
    </div>
  );
}

/* ── LiveDataHUD ────────────────────────────────────────────────── */
interface LiveDataHUDProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function LiveDataHUD({ isOpen, onToggle }: LiveDataHUDProps) {
  // Each channel gets a rolling array of samples
  const [data, setData] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(channels.map(c => [c.key, Array(SAMPLE_COUNT).fill((c.min + c.max) / 2)])),
  );
  const tRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    let raf: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      tRef.current += dt;
      const t = tRef.current;

      setData(prev => {
        const next = { ...prev };
        channels.forEach(ch => {
          const newVal = ch.getValue(t);
          const arr    = prev[ch.key];
          next[ch.key] = [...arr.slice(1), newVal];
        });
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  const [isConnected] = useState(false); // will be true when real hardware attached

  return (
    <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-panel)', position: 'relative' }}>

      {/* Toggle bar */}
      <button
        onClick={onToggle}
        className="ghost"
        style={{
          width: '100%', borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none',
          padding: '4px 16px', justifyContent: 'space-between', fontSize: '10px',
          color: 'var(--text-muted)', letterSpacing: '0.08em',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={11} style={{ color: isOpen ? 'var(--green)' : 'var(--text-muted)' }} />
          <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>Live Telemetry</span>
          {!isConnected && (
            <span style={{ fontSize: '9px', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '3px', padding: '0 5px' }}>
              DEMO
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      {/* Content panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex', gap: '8px', padding: '10px 14px 12px',
              overflowX: 'auto', alignItems: 'center',
            }}>
              {channels.map(ch => (
                <ChannelCard key={ch.key} ch={ch} samples={data[ch.key]} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
