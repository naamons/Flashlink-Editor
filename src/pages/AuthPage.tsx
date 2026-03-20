import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hexagon, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Zap, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUp = location.pathname === '/signup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setSuccess('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#0c0a08',
    }}>
      {/* Left panel – branding */}
      <div style={{
        flex: '0 0 45%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '48px',
        background: 'linear-gradient(135deg, #0c0a08, #151210)',
        borderRight: '1px solid rgba(200,170,120,0.06)',
        position: 'relative', overflow: 'hidden',
      }}
      className="auth-left-panel"
      >
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.02,
          backgroundImage: 'linear-gradient(rgba(201,162,78,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,78,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />
        {/* Radial glow */}
        <div style={{
          position: 'absolute', bottom: -100, left: -100,
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(201,162,78,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Top – logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #c9a24e, #d4b263)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Hexagon size={18} color="#0c0a08" />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#e8e0d4', letterSpacing: '-0.02em' }}>
              Flash<span style={{ color: '#c9a24e' }}>Link</span> Editor
            </span>
          </div>
        </div>

        {/* Center – copy */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: '32px', fontWeight: 800, color: '#e8e0d4',
            lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '16px',
          }}>
            {isSignUp ? (
              <>The professional tuning platform<br />you've been waiting for.</>
            ) : (
              <>Welcome back.<br />Your projects are waiting.</>
            )}
          </h2>
          <p style={{ fontSize: '15px', color: '#9a8e7f', lineHeight: 1.7, maxWidth: '380px' }}>
            {isSignUp
              ? 'Create your account to start managing ECU calibrations, track versions, and deliver tunes to your customers.'
              : 'Log in to access your cloud-synced projects, versions, and customer data.'}
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '32px' }}>
            {['Cloud Sync', 'Version Control', 'Customer Mgmt', 'Binary Diff'].map(tag => (
              <span key={tag} style={{
                padding: '5px 12px', borderRadius: '100px', fontSize: '11px',
                fontWeight: 600, color: '#c9a24e',
                background: 'rgba(201,162,78,0.08)',
                border: '1px solid rgba(201,162,78,0.12)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ position: 'relative', zIndex: 1, fontSize: '12px', color: '#3c352e' }}>
          © {new Date().getFullYear()} FlashLink Editor
        </div>
      </div>

      {/* Right panel – form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px', position: 'relative',
      }}>
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'absolute', top: '24px', left: '24px',
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', color: '#9a8e7f',
            fontSize: '13px', cursor: 'pointer', transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#e8e0d4'}
          onMouseLeave={e => e.currentTarget.style.color = '#9a8e7f'}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: '400px' }}
        >
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#e8e0d4', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h1>
          <p style={{ fontSize: '14px', color: '#9a8e7f', marginBottom: '36px' }}>
            {isSignUp ? 'Get started with your free account.' : 'Enter your credentials to continue.'}
          </p>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Full Name — sign-up only */}
            {isSignUp && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8e7f', display: 'block', marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#5c5348' }} />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '13px 14px 13px 42px',
                      background: 'rgba(30,26,22,0.6)',
                      border: '1px solid rgba(200,170,120,0.1)',
                      borderRadius: '10px', color: '#e8e0d4', fontSize: '14px',
                      outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                      fontFamily: 'var(--font-sans)',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,162,78,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,78,0.08)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(200,170,120,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8e7f', display: 'block', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#5c5348' }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '13px 14px 13px 42px',
                    background: 'rgba(30,26,22,0.6)',
                    border: '1px solid rgba(200,170,120,0.1)',
                    borderRadius: '10px', color: '#e8e0d4', fontSize: '14px',
                    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,162,78,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,78,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(200,170,120,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8e7f', display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#5c5348' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: '100%', padding: '13px 42px 13px 42px',
                    background: 'rgba(30,26,22,0.6)',
                    border: '1px solid rgba(200,170,120,0.1)',
                    borderRadius: '10px', color: '#e8e0d4', fontSize: '14px',
                    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,162,78,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,78,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(200,170,120,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#5c5348', cursor: 'pointer',
                    padding: '4px', display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <div style={{
                fontSize: '12px', color: '#ef5350',
                background: 'rgba(239,83,80,0.08)',
                padding: '10px 14px', borderRadius: '8px',
                border: '1px solid rgba(239,83,80,0.15)',
              }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{
                fontSize: '12px', color: '#4caf50',
                background: 'rgba(76,175,80,0.08)',
                padding: '10px 14px', borderRadius: '8px',
                border: '1px solid rgba(76,175,80,0.15)',
              }}>
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', marginTop: '4px',
                borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                background: loading ? '#5c5348' : 'linear-gradient(135deg, #c9a24e, #d4b263)',
                color: '#0c0a08', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,162,78,0.25)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {loading ? (
                <><Loader2 size={18} className="spin-anim" /> Processing…</>
              ) : isSignUp ? (
                <><Zap size={16} /> Create Account</>
              ) : (
                <>Sign In</>
              )}
            </button>
          </form>


          {/* Toggle */}
          <p style={{ marginTop: '28px', textAlign: 'center', fontSize: '13px', color: '#9a8e7f' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => navigate(isSignUp ? '/login' : '/signup')}
              style={{
                background: 'none', border: 'none', color: '#c9a24e',
                cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              }}
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
