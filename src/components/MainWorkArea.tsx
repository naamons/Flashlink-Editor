import { useState, useRef } from 'react';
import { useEditor } from '../store/EditorStore';
import { X, Maximize2, Minimize2, Minus, Maximize, Hexagon, LayoutGrid, Info, User, Car, Settings } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';
import MapGridEditor from './MapGridEditor';
import type { ECUMap } from '../store/EditorStore';

export default function MainWorkArea() {
  const { openTabs, activeTabId, closeMapTab, openMapTab, currentProject } = useEditor();
  const [arrangeKey, setArrangeKey] = useState(0);

  const handleArrange = () => setArrangeKey(k => k + 1);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: '#07070a', position: 'relative', overflow: 'hidden',
    }}>
      {/* Empty state / Project Dashboard */}
      {openTabs.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '40px',
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              width: '100%', maxWidth: '900px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px',
              padding: '40px', borderRadius: '24px',
              background: 'rgba(17,17,22,0.4)',
              border: '1px solid rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Left Col: Project Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '18px',
                  background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(99,102,241,0.15))',
                  border: '1px solid rgba(56,189,248,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Hexagon size={32} color="#38bdf8" fill="rgba(56,189,248,0.2)" />
                </div>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f4f4f5', margin: 0 }}>
                    {currentProject?.name || 'New Project'}
                  </h1>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '4px 0 0' }}>
                    Project initialized • Connected to SIM2K-250
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <DetailCard icon={<Car size={16} />} label="Vehicle" value={currentProject?.vehicleDetails || 'Unspecified'} />
                <DetailCard icon={<User size={16} />} label="Customer" value={currentProject?.customerInfo || 'Unknown'} />
                <DetailCard icon={<Info size={16} />} label="Calibration ID" value={currentProject?.calibrationId || 'Not set'} />
                <DetailCard icon={<Settings size={16} />} label="ECU Type" value={currentProject?.ecuDef || 'Standard'} />
              </div>
            </div>

            {/* Right Col: Quick Tips */}
            <div style={{ 
              background: 'rgba(255,255,255,0.02)', borderRadius: '16px', 
              border: '1px solid rgba(255,255,255,0.05)', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Getting Started</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <TipRow number="1" text="Select a map from the sidebar to begin editing variables." />
                <TipRow number="2" text="Use ⌘K to quickly search for specific map IDs or names." />
                <TipRow number="3" text="Windows now cascade automatically for better focus." />
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e4e4e7', marginBottom: '8px' }}>Project Overview</h3>
                <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: 1.6 }}>
                  Select a category and map from the sidebar to begin tuning.<br/>
                  Return to this project view anytime by clicking the <b>FLASHLINK EDITOR</b> logo in the top left.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Arrange / Organize bar */}
      {openTabs.length > 0 && (
        <div style={{
          height: '32px', position: 'absolute', top: '12px', right: '20px',
          zIndex: 1000, display: 'flex', gap: '8px'
        }}>
          <button 
            onClick={handleArrange}
            className="ghost" 
            style={{ 
              background: 'rgba(17,17,22,0.8)', padding: '6px 14px', 
              fontSize: '11px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)', gap: '8px', color: '#a1a1aa'
            }}
            title="Auto-organize all open windows"
          >
            <LayoutGrid size={13} />
            Arrange Windows
          </button>
        </div>
      )}

      {/* Floating map windows */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {openTabs.map((map, index) => {
          const id       = map.IdName || map.Name;
          const isActive = id === activeTabId;
          return (
            <FloatingMapWindow
              key={`${id}-${arrangeKey}`}
              map={map}
              index={index}
              isActive={isActive}
              zIndex={isActive ? 100 : 10 + index}
              onFocus={() => openMapTab(map)}
              onClose={() => closeMapTab(id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function DetailCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#52525b' }}>
        {icon}
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '13px', color: '#e4e4e7', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function TipRow({ number, text }: { number: string, text: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
        {number}
      </div>
      <span style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

interface FloatingMapWindowProps {
  map: ECUMap;
  index: number;
  isActive: boolean;
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
}

function FloatingMapWindow({ map, index, isActive, zIndex, onFocus, onClose }: FloatingMapWindowProps) {
  const [windowState, setWindowState] = useState<'normal' | 'maximized' | 'minimized'>('normal');
  const dragControls  = useDragControls();
  const containerRef  = useRef<HTMLDivElement>(null);

  const getAnimate = () => {
    if (windowState === 'maximized') return { opacity: 1, scale: 1, top: 12, left: 12, width: 'calc(100% - 24px)', height: 'calc(100% - 24px)', x: 0, y: 0 };
    if (windowState === 'minimized') return { opacity: 1, scale: 1, width: 320, height: 40 };
    return { 
      opacity: 1, scale: 1,
      top: 60 + index * 30,
      left: 60 + index * 30,
    };
  };

  const toggleMax = () => setWindowState(p => p === 'maximized' ? 'normal' : 'maximized');
  const toggleMin = () => setWindowState(p => p === 'minimized' ? 'normal' : 'minimized');

  return (
    <motion.div
      drag={windowState === 'normal'}
      dragControls={windowState === 'normal' ? dragControls : undefined}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.05}
      onMouseDown={onFocus}
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={getAnimate()}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      ref={containerRef}
      style={{
        position: 'absolute',
        background: '#111116',
        borderRadius: '12px',
        border: isActive
          ? '1px solid rgba(56,189,248,0.4)'
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isActive
          ? '0 0 0 1px rgba(56,189,248,0.15), 0 24px 60px rgba(0,0,0,0.8)'
          : '0 8px 32px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        resize: windowState === 'normal' ? 'both' : 'none',
        overflow: 'hidden',
        zIndex,
        minWidth: 320,
        minHeight: windowState === 'minimized' ? 40 : 200,
        width:  windowState === 'normal' ? 880 : undefined,
        height: windowState === 'normal' ? 520 : undefined,
        opacity: isActive ? 1 : 0.85,
        transition: 'border-color 0.2s, box-shadow 0.2s, opacity 0.2s',
      }}
    >
      {/* Window chrome / drag handle */}
      <div
        onDoubleClick={toggleMax}
        onPointerDown={e => { if (windowState === 'normal') dragControls.start(e); }}
        style={{
          height: '38px', flexShrink: 0,
          background: isActive ? '#1a1a22' : '#131318',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 12px',
          cursor: windowState === 'maximized' ? 'default' : 'grab',
          userSelect: 'none',
        }}
      >
        {/* Left window actions */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? '#38bdf8' : '#3f3f46' }} />
        </div>

        {/* Title */}
        <div style={{ fontSize: '11px', fontWeight: 600, color: isActive ? '#e4e4e7' : '#71717a', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{map.Name}</span>
          <span style={{ color: '#52525b', fontWeight: 400, fontFamily: 'var(--font-mono)', fontSize: '10px', flexShrink: 0 }}>{map.IdName}</span>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', gap: '4px', cursor: 'auto' }}>
          <button onClick={e => { e.stopPropagation(); toggleMin(); }} className="ghost" style={{ padding: '4px' }} title={windowState === 'minimized' ? 'Restore' : 'Minimize'}>
            {windowState === 'minimized' ? <Maximize size={11} /> : <Minus size={11} />}
          </button>
          {windowState !== 'minimized' && (
            <button onClick={e => { e.stopPropagation(); toggleMax(); }} className="ghost" style={{ padding: '4px' }} title={windowState === 'maximized' ? 'Restore' : 'Maximize'}>
              {windowState === 'maximized' ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onClose(); }} className="ghost" style={{ padding: '4px' }} title="Close">
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Editor content */}
      <div
        onPointerDown={e => e.stopPropagation()}
        style={{ flex: 1, overflow: 'hidden', display: windowState === 'minimized' ? 'none' : 'flex', pointerEvents: isActive ? 'auto' : 'none' }}
      >
        <MapGridEditor map={map} />
      </div>
    </motion.div>
  );
}
