import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Hexagon, Zap, Shield, Upload, GitBranch, Users,
  ArrowRight, ChevronDown, Star, Play, BarChart3, Cpu, Gauge,
  Search, CloudUpload, History, UserCheck, Menu, X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/* ── Animated counter ───────────────────────────────────────────── */
function Counter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const start = performance.now();
          const step = (now: number) => {
            const pct = Math.min((now - start) / duration, 1);
            setVal(Math.round(pct * end));
            if (pct < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── Feature card ───────────────────────────────────────────────── */
function FeatureCard({
  icon: Icon, title, desc, delay
}: { icon: React.ElementType; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, scale: 1.02 }}
      style={{
        background: 'linear-gradient(135deg, rgba(30,26,22,0.9) 0%, rgba(21,18,16,0.95) 100%)',
        border: '1px solid rgba(200,170,120,0.12)',
        borderRadius: '16px',
        padding: '32px 28px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Glow accent */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: '100px', height: '100px',
        background: 'radial-gradient(circle, rgba(201,162,78,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: 'rgba(201,162,78,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px', border: '1px solid rgba(201,162,78,0.15)',
      }}>
        <Icon size={22} color="#c9a24e" />
      </div>
      <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#e8e0d4', marginBottom: '10px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#9a8e7f' }}>
        {desc}
      </p>
    </motion.div>
  );
}

/* ── Step card ──────────────────────────────────────────────────── */
function StepCard({
  num, title, desc, icon: Icon, delay
}: { num: number; title: string; desc: string; icon: React.ElementType; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.5, delay }}
      style={{
        display: 'flex', gap: '24px', alignItems: 'flex-start',
        padding: '28px', borderRadius: '14px',
        background: 'rgba(30,26,22,0.5)',
        border: '1px solid rgba(200,170,120,0.08)',
        position: 'relative',
      }}
    >
      <div style={{
        width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(201,162,78,0.15), rgba(201,162,78,0.05))',
        border: '1px solid rgba(201,162,78,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <Icon size={22} color="#c9a24e" />
        <div style={{
          position: 'absolute', top: -6, right: -6,
          width: '22px', height: '22px', borderRadius: '50%',
          background: '#c9a24e', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 800, color: '#0c0a08',
        }}>
          {num}
        </div>
      </div>
      <div>
        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#e8e0d4', marginBottom: '6px' }}>{title}</h4>
        <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#9a8e7f', maxWidth: '400px' }}>{desc}</p>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const features = [
    { icon: Cpu,       title: 'Advanced Map Editing',    desc: 'Visual 2D/3D heatmap editor with real-time cell editing, axis overlays, and precision control over every calibration value.' },
    { icon: GitBranch, title: 'Version Control',         desc: 'Save unlimited versions of your tune. Compare diffs, roll back changes, and branch experiments without losing work.' },
    { icon: Users,     title: 'Customer Management',     desc: 'Track customer vehicles, assign tunes to clients, and maintain a professional workflow from start to delivery.' },
    { icon: CloudUpload, title: 'Cloud Sync',            desc: 'Your projects live in the cloud. Access and edit from any machine, share with collaborators, and never lose a file.' },
    { icon: Shield,    title: 'Binary Integrity',        desc: 'Checksum validation, safe-mode write protection, and binary diff scripts ensure your ECU is always protected.' },
    { icon: BarChart3, title: 'Live Data HUD',           desc: 'Connect to your ECU for real-time data monitoring. Overlay live parameters on your maps while tuning on the dyno.' },
  ];

  const steps = [
    { icon: Upload,    title: 'Upload Your Binary',        desc: 'Drop in a .bin file from your ECU read. We auto-detect calibration definitions and map layouts.' },
    { icon: Search,    title: 'Browse & Edit Maps',        desc: 'Navigate the full map tree, apply precision edits with the visual grid editor, and compare changes against the stock file.' },
    { icon: History,   title: 'Save Versions & Iterate',   desc: 'Snapshot your work at any point. Name each version, compare diffs, and roll back instantly if something goes wrong.' },
    { icon: UserCheck, title: 'Assign & Deliver',          desc: 'Link tunes to customer profiles, export the modified binary, and generate script diffs for your flash tool.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a08', overflow: 'auto' }}>
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '0 32px', height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(12,10,8,0.85)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(200,170,120,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #c9a24e, #d4b263)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Hexagon size={18} color="#0c0a08" />
          </div>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#e8e0d4', letterSpacing: '-0.02em' }}>
            Flash<span style={{ color: '#c9a24e' }}>Link</span> Editor
          </span>
        </div>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}
             className="nav-links-desktop">
          {['Features', 'How It Works', 'Community'].map(label => (
            <a key={label}
               href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
               style={{
                 color: '#9a8e7f', fontSize: '13px', fontWeight: 500,
                 textDecoration: 'none', transition: 'color 0.15s',
               }}
               onMouseEnter={e => (e.currentTarget.style.color = '#e8e0d4')}
               onMouseLeave={e => (e.currentTarget.style.color = '#9a8e7f')}
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
             className="nav-cta-desktop">
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                background: 'linear-gradient(135deg, #c9a24e, #d4b263)',
                color: '#0c0a08', border: 'none', cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,162,78,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Open Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  background: 'transparent', color: '#e8e0d4',
                  border: '1px solid rgba(200,170,120,0.2)', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,162,78,0.4)'; e.currentTarget.style.background = 'rgba(201,162,78,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(200,170,120,0.2)'; e.currentTarget.style.background = 'transparent'; }}
              >
                Log In
              </button>
              <button
                onClick={() => navigate('/signup')}
                style={{
                  padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                  background: 'linear-gradient(135deg, #c9a24e, #d4b263)',
                  color: '#0c0a08', border: 'none', cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,162,78,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Get Started Free
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileMenuOpen(o => !o)}
          style={{ display: 'none', background: 'none', border: 'none', color: '#e8e0d4', cursor: 'pointer' }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </motion.nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 99,
              background: 'rgba(12,10,8,0.97)', backdropFilter: 'blur(16px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px',
            }}
          >
            {['Features', 'How It Works'].map(label => (
              <a key={label} href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                 onClick={() => setMobileMenuOpen(false)}
                 style={{ color: '#e8e0d4', fontSize: '18px', fontWeight: 500, textDecoration: 'none' }}>
                {label}
              </a>
            ))}
            <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                    style={{ padding: '12px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, background: 'linear-gradient(135deg, #c9a24e, #d4b263)', color: '#0c0a08', border: 'none', cursor: 'pointer' }}>
              Get Started
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: '64px' }}>
        {/* Animated gradient bg */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,162,78,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(rgba(201,162,78,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,78,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '800px', padding: '0 24px' }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: '100px',
              background: 'rgba(201,162,78,0.08)',
              border: '1px solid rgba(201,162,78,0.15)',
              fontSize: '12px', fontWeight: 600, color: '#c9a24e',
              marginBottom: '32px',
            }}
          >
            <Zap size={13} /> Professional ECU Tuning Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800,
              color: '#e8e0d4', lineHeight: 1.1, letterSpacing: '-0.03em',
              marginBottom: '24px',
            }}
          >
            Precision ECU Calibration,{' '}
            <span style={{
              background: 'linear-gradient(135deg, #c9a24e, #d4b263, #e0c97a)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Reimagined
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{
              fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.7,
              color: '#9a8e7f', maxWidth: '600px', margin: '0 auto 40px',
            }}
          >
            Upload your ECU binary, edit calibration maps with a visual grid editor,
            manage versions and customers — all in one cloud-synced workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <button
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
              style={{
                padding: '14px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
                background: 'linear-gradient(135deg, #c9a24e, #d4b263)',
                color: '#0c0a08', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(201,162,78,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Start Tuning <ArrowRight size={16} />
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                padding: '14px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: 600,
                background: 'rgba(30,26,22,0.8)', color: '#e8e0d4',
                border: '1px solid rgba(200,170,120,0.15)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,162,78,0.3)'; e.currentTarget.style.background = 'rgba(201,162,78,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(200,170,120,0.15)'; e.currentTarget.style.background = 'rgba(30,26,22,0.8)'; }}
            >
              <Play size={14} /> See How It Works
            </button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{ marginTop: '60px', display: 'flex', justifyContent: 'center' }}
          >
            <ChevronDown size={20} color="#5c5348" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────── */}
      <section style={{
        padding: '48px 24px', borderTop: '1px solid rgba(200,170,120,0.06)',
        borderBottom: '1px solid rgba(200,170,120,0.06)',
        background: 'rgba(21,18,16,0.5)',
      }}>
        <div style={{
          maxWidth: '1000px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px',
          textAlign: 'center',
        }}>
          {[
            { value: 12000, suffix: '+', label: 'Maps Edited' },
            { value: 850,   suffix: '+', label: 'Active Tuners' },
            { value: 50,    suffix: '+',  label: 'ECU Platforms' },
            { value: 99.9,  suffix: '%',  label: 'Uptime' },
          ].map((stat, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#c9a24e', letterSpacing: '-0.02em' }}>
                <Counter end={stat.value} suffix={stat.suffix} />
              </div>
              <div style={{ fontSize: '13px', color: '#5c5348', marginTop: '4px', fontWeight: 500 }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '64px' }}
        >
          <span style={{
            fontSize: '12px', fontWeight: 700, color: '#c9a24e',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            Features
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#e8e0d4', marginTop: '12px', letterSpacing: '-0.02em' }}>
            Everything You Need to Tune
          </h2>
          <p style={{ fontSize: '15px', color: '#9a8e7f', maxWidth: '520px', margin: '16px auto 0', lineHeight: 1.7 }}>
            A complete professional toolkit — from binary upload to customer delivery.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {features.map((f, i) => (
            <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section id="how-it-works" style={{
        padding: '100px 24px',
        background: 'linear-gradient(180deg, rgba(21,18,16,0.3) 0%, rgba(12,10,8,1) 100%)',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '56px' }}
          >
            <span style={{
              fontSize: '12px', fontWeight: 700, color: '#c9a24e',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Workflow
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#e8e0d4', marginTop: '12px', letterSpacing: '-0.02em' }}>
              Four Steps to a Perfect Tune
            </h2>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {steps.map((s, i) => (
              <StepCard key={i} num={i + 1} icon={s.icon} title={s.title} desc={s.desc} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial / Social Proof ────────────────────────── */}
      <section style={{ padding: '100px 24px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{
            padding: '48px 40px', borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(30,26,22,0.6) 0%, rgba(21,18,16,0.8) 100%)',
            border: '1px solid rgba(200,170,120,0.1)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '200px', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(201,162,78,0.3), transparent)',
          }} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '24px' }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#c9a24e" color="#c9a24e" />)}
          </div>
          <p style={{
            fontSize: '18px', fontStyle: 'italic', color: '#e8e0d4', lineHeight: 1.8,
            maxWidth: '600px', margin: '0 auto 24px',
          }}>
            "This is the tool I've been waiting for. The map editor is incredibly intuitive,
            versioning saves me hours, and my customers love the professional delivery."
          </p>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#c9a24e' }}>
            — Professional ECU Tuner
          </div>
          <div style={{ fontSize: '12px', color: '#5c5348', marginTop: '4px' }}>
            500+ tunes delivered
          </div>
        </motion.div>
      </section>

      {/* ── CTA Section ───────────────────────────────────────── */}
      <section style={{
        padding: '100px 24px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(201,162,78,0.03) 50%, transparent 100%)',
        textAlign: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ maxWidth: '600px', margin: '0 auto' }}
        >
          <div style={{
            width: '64px', height: '64px', margin: '0 auto 28px', borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(201,162,78,0.15), rgba(201,162,78,0.05))',
            border: '1px solid rgba(201,162,78,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Gauge size={28} color="#c9a24e" />
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#e8e0d4', letterSpacing: '-0.02em', marginBottom: '16px' }}>
            Ready to Level Up Your Tuning?
          </h2>
          <p style={{ fontSize: '15px', color: '#9a8e7f', lineHeight: 1.7, marginBottom: '36px' }}>
            Join hundreds of professional tuners already using FlashLink Editor.
            Create your free account and start editing in under a minute.
          </p>
          <button
            onClick={() => navigate(user ? '/dashboard' : '/signup')}
            style={{
              padding: '16px 40px', borderRadius: '12px', fontSize: '16px', fontWeight: 700,
              background: 'linear-gradient(135deg, #c9a24e, #d4b263)',
              color: '#0c0a08', border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(201,162,78,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {user ? 'Go to Dashboard' : 'Create Free Account'} <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer style={{
        padding: '48px 24px', borderTop: '1px solid rgba(200,170,120,0.06)',
        background: 'rgba(12,10,8,0.9)',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hexagon size={16} color="#c9a24e" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#5c5348' }}>
              FlashLink Editor
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#3c352e' }}>
            © {new Date().getFullYear()} FlashLink Editor. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
