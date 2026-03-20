import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor } from '../store/EditorStore';
import { Activity, Hexagon } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MainWorkArea from '../components/MainWorkArea';
import CommandPalette from '../components/CommandPalette';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

export default function EditorPage() {
  const { isLoading, generateScript, exportBin, originalBin, loadCustomBin, undoAll, closeAllTabs } = useEditor();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu]     = useState<string | null>(null);
  const [cmdPaletteOpen, setCmdPalette] = useState(false);

  // Global Cmd+K → Command Palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPalette(p => !p);
      }
      if (e.key === 'Escape') {
        setActiveMenu(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleMenu = (name: string) => setActiveMenu(a => (a === name ? null : name));

  const handleMenuClick = useCallback((action: () => void) => {
    action();
    setActiveMenu(null);
  }, []);

  const openBin = () => {
    const input = document.createElement('input');
    input.type    = 'file';
    input.accept  = '.bin';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) loadCustomBin(await file.arrayBuffer());
    };
    input.click();
  };

  const renderMenu = (
    title: string,
    items: { label: string; action: () => void; disabled?: boolean; shortcut?: string }[],
  ) => {
    const isActive = activeMenu === title;
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => toggleMenu(title)}
          style={{
            background: isActive ? 'rgba(201,162,78,0.12)' : 'transparent',
            border: '1px solid ' + (isActive ? 'rgba(201,162,78,0.25)' : 'transparent'),
            color: isActive ? '#c9a24e' : '#a1a1aa',
            borderRadius: '5px', padding: '2px 8px', fontSize: '12px',
            cursor: 'pointer', transition: 'all 0.12s',
          }}
        >
          {title}
        </button>
        {isActive && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0,
            background: '#111118',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', minWidth: '220px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
            zIndex: 2000, padding: '4px',
          }}>
            {items.map((item, i) => (
              <div
                key={i}
                onClick={() => !item.disabled && handleMenuClick(item.action)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 12px', fontSize: '12px', borderRadius: '5px',
                  color: item.disabled ? '#3f3f46' : '#e4e4e7',
                  cursor: item.disabled ? 'default' : 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = 'rgba(201,162,78,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span>{item.label}</span>
                {item.shortcut && <span style={{ fontSize: '10px', color: '#52525b', fontFamily: 'var(--font-mono)' }}>{item.shortcut}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#07070a' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
          <Activity size={40} color="#c9a24e" />
        </motion.div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5' }}>Loading ECU Data</h2>
        <p style={{ color: '#52525b', fontSize: '12px' }}>Parsing maps.json and initializing binary…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#07070a' }}>

      {/* Click-away overlay for dropdown menus */}
      {activeMenu && (
        <div onClick={() => setActiveMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 1999 }} />
      )}

      {/* ── Command Palette ── */}
      <CommandPalette isOpen={cmdPaletteOpen} onClose={() => setCmdPalette(false)} />

      {/* ── Title Bar / Menu Bar ── */}
      <header style={{
        height: '32px', flexShrink: 0,
        background: '#0d0d12',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', fontSize: '12px', color: '#a1a1aa',
        position: 'relative', zIndex: 2001,
      }}>
        {/* Left: Logo + Menus */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c9a24e', fontWeight: 700, fontSize: '12px', letterSpacing: '-0.01em', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
          >
            <Hexagon size={14} />
            <span style={{ color: '#f4f4f5' }}>ECU</span>
            <span style={{ color: '#c9a24e' }}>AutoTuner</span>
          </div>
          <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', gap: '2px' }}>
            {renderMenu('File', [
              { label: 'Open Binary (.bin)', action: openBin, shortcut: '⌘O' },
              { label: 'Compare To Bin…',   action: () => console.log('Compare'), shortcut: '⌘D' },
              { label: 'Export Modified .BIN', action: exportBin, disabled: !originalBin, shortcut: '⌘E' },
              { label: 'Save Script Diff',  action: generateScript, disabled: !originalBin, shortcut: '⌘S' },
            ])}
            {renderMenu('Edit', [
              { label: 'Undo All Changes', action: undoAll, disabled: !originalBin, shortcut: '⌘Z' },
              { label: 'Close All Tabs',   action: closeAllTabs },
            ])}
            {renderMenu('Search', [
              { label: 'Search Maps',   action: () => setCmdPalette(true), shortcut: '⌘K' },
              { label: 'Go To Address…', action: () => console.log('addr') },
            ])}
            {renderMenu('Hardware', [
              { label: 'Connect Device', action: () => console.log('connect') },
              { label: 'Read ECU',       action: () => console.log('read') },
              { label: 'Write ECU',      action: () => console.log('write') },
            ])}
            {renderMenu('View', [
              { label: '← Back to Dashboard', action: () => navigate('/dashboard') },
            ])}
            {renderMenu('Account', user ? [
              { label: 'Sign Out', action: signOut },
            ] : [
              { label: 'Sign In', action: () => navigate('/login') },
            ])}
          </div>
        </div>

        {/* Right: User pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '18px', height: '18px', borderRadius: '50%',
            background: user ? 'linear-gradient(135deg, #c9a24e, #d4b263)' : '#1f1f23',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: 700, color: user ? '#000' : '#52525b',
            border: user ? 'none' : '1px solid rgba(255,255,255,0.1)'
          }}>
            {user?.email?.[0].toUpperCase() || '?'}
          </div>
          <span style={{ fontSize: '11px', color: '#52525b' }}>{user?.email || 'Guest'}</span>
        </div>
      </header>

      <CommandPalette isOpen={cmdPaletteOpen} onClose={() => setCmdPalette(false)} />

      {/* ── Main Layout ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <Sidebar />
        <MainWorkArea />
      </div>
    </div>
  );
}
