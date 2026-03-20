import { useState, useRef, useEffect } from 'react';
import { useEditor } from '../store/EditorStore';
import type { FolderNode, ECUMap } from '../store/EditorStore';
import {
  ChevronRight, ChevronDown, Search, PanelLeftClose, PanelLeft,
  Zap, Gauge, Flame, Wind, AlertTriangle, FolderOpen, Folder, FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PromptModal from './PromptModal';

// Maps top-level folder names to icons and accent colors
const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string }> = {
  'Engine':          { icon: <Gauge size={13} />,        color: 'var(--blue)' },
  'Engine Logistics':{ icon: <Gauge size={13} />,        color: 'var(--blue)' },
  'Fueling':         { icon: <Flame size={13} />,        color: '#fb923c' },
  'Ignition':        { icon: <Zap size={13} />,          color: 'var(--accent-primary)' },
  'Boost Control':   { icon: <Wind size={13} />,         color: '#a78bfa' },
  'Boost':           { icon: <Wind size={13} />,         color: '#a78bfa' },
  'DTCs':            { icon: <AlertTriangle size={13} />, color: 'var(--red)' },
  'DTC':             { icon: <AlertTriangle size={13} />, color: 'var(--red)' },
};
const DEFAULT_META = { icon: <Folder size={13} />, color: 'var(--text-muted)' };

function getCategoryMeta(name: string) {
  return CATEGORY_META[name] ?? DEFAULT_META;
}

export default function Sidebar() {
  const { rootFolder, openMapTab, openTabs, activeTabId, mapsDict } = useEditor();
  const [searchTerm, setSearchTerm]   = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [collapsed, setCollapsed]     = useState(false);
  const [promptState, setPromptState] = useState<{
    message: string; defaultValue: string; onConfirm: (v: string) => void;
  } | null>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // Total map count
  const totalMapCount = Object.keys(mapsDict).length;
  const openTabIds = new Set(openTabs.map(t => t.IdName || t.Name));

  // Drag-to-resize
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newW = Math.max(180, Math.min(500, e.clientX));
      setSidebarWidth(newW);
    };
    const onUp = () => { isResizing.current = false; resizeRef.current?.classList.remove('dragging'); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const handlePrompt = (message: string, defaultValue: string, onConfirm: (v: string) => void) => {
    setPromptState({ message, defaultValue, onConfirm });
  };

  const folders  = Object.values(rootFolder.folders);
  const rootMaps = rootFolder.maps;

  if (collapsed) {
    return (
      <div style={{ width: '38px', background: 'var(--bg-panel)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10px', gap: '10px', flexShrink: 0 }}>
        <button onClick={() => setCollapsed(false)} className="ghost" title="Expand Sidebar" style={{ padding: '5px' }}>
          <PanelLeft size={14} />
        </button>
        <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }} />
        {folders.slice(0, 6).map(f => {
          const meta = getCategoryMeta(f.name);
          return (
            <div key={f.name} title={f.name} style={{ color: meta.color, cursor: 'default', padding: '3px' }}>
              {meta.icon}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ width: sidebarWidth, background: 'var(--bg-panel)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexShrink: 0, position: 'relative', minWidth: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{ padding: '8px 8px 6px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* Label */}
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Maps</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => setCollapsed(true)} className="ghost" title="Collapse" style={{ padding: '4px', flexShrink: 0 }}>
              <PanelLeftClose size={13} />
            </button>
          </div>
          {/* Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '6px' }}>
            <Search size={11} style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search maps..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '26px', paddingRight: '8px', height: '26px', fontSize: '11px', borderRadius: '5px' }}
            />
          </div>
        </div>

        {/* MAPS header label */}
        <div style={{ padding: '6px 10px 4px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            ● MAPS
          </span>
        </div>

        {/* Tree */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2px 4px' }}>
          {folders.map(f => (
            <FolderView key={f.name} folder={f} path={[f.name]} depth={0} searchTerm={searchTerm.toLowerCase()} onSelectMap={m => openMapTab(m)} onPrompt={handlePrompt} openTabIds={openTabIds} activeTabId={activeTabId} />
          ))}
          {rootMaps.map((m, idx) => (
            <MapRow key={`${m.IdName || m.Name}-${idx}`} map={m} searchTerm={searchTerm.toLowerCase()} onSelectMap={m => openMapTab(m)} onPrompt={handlePrompt} isOpen={openTabIds.has(m.IdName || m.Name)} isActive={(m.IdName || m.Name) === activeTabId} />
          ))}
        </div>

        {/* Footer: map count */}
        <div style={{
          padding: '5px 10px', borderTop: '1px solid var(--border-subtle)',
          fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: 'var(--font-mono)',
        }}>
          <span>{totalMapCount} maps</span>
          <span>{openTabs.length} open</span>
        </div>
      </div>

      {/* Resize handle */}
      <div
        ref={resizeRef}
        className="sidebar-resize"
        onMouseDown={() => { isResizing.current = true; resizeRef.current?.classList.add('dragging'); }}
      />

      {promptState && (
        <PromptModal
          message={promptState.message}
          defaultValue={promptState.defaultValue}
          onConfirm={v => { promptState.onConfirm(v); setPromptState(null); }}
          onCancel={() => setPromptState(null)}
        />
      )}
    </div>
  );
}

/* ── FolderView ── */
function FolderView({
  folder, path, depth, searchTerm, onSelectMap, onPrompt, openTabIds, activeTabId,
}: {
  folder: FolderNode; path: string[]; depth: number; searchTerm: string;
  onSelectMap: (m: ECUMap) => void;
  onPrompt: (m: string, d: string, c: (v: string) => void) => void;
  openTabIds: Set<string>;
  activeTabId: string | null;
}) {
  const { toggleFolder, renameFolder } = useEditor();

  function hasMatch(node: FolderNode): boolean {
    if (node.name.toLowerCase().includes(searchTerm)) return true;
    if (node.maps.some(m => m.Name.toLowerCase().includes(searchTerm) || (m.IdName || '').toLowerCase().includes(searchTerm))) return true;
    return Object.values(node.folders).some(f => hasMatch(f));
  }

  if (searchTerm && !hasMatch(folder)) return null;

  const isOpen   = searchTerm ? true : folder.isOpen;
  const meta     = depth === 0 ? getCategoryMeta(folder.name) : DEFAULT_META;

  return (
    <div>
      <div
        onClick={() => toggleFolder(path)}
        onContextMenu={e => {
          e.preventDefault();
          onPrompt('Rename folder:', folder.name, n => { if (n) renameFolder(path, n); });
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: `3px 6px 3px ${6 + depth * 14}px`,
          cursor: 'pointer', borderRadius: '4px',
          fontSize: '11px', fontWeight: depth === 0 ? 600 : 500,
          color: depth === 0 ? meta.color : 'var(--text-secondary)',
          userSelect: 'none', transition: 'background 0.1s',
          position: 'relative',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        title="Right-click to rename"
      >
        {/* Indent guide line */}
        {depth > 0 && (
          <div style={{
            position: 'absolute', left: `${6 + (depth - 1) * 14 + 6}px`, top: 0, bottom: 0,
            width: '1px', background: 'var(--border-subtle)',
          }} />
        )}
        {isOpen
          ? <ChevronDown size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          : <ChevronRight size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        }
        <span style={{ color: meta.color, flexShrink: 0 }}>
          {depth === 0 ? meta.icon : (isOpen ? <FolderOpen size={11} /> : <Folder size={11} />)}
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
        <span style={{ marginLeft: 'auto', fontSize: '9px', color: 'var(--text-muted)', flexShrink: 0, paddingLeft: '4px' }}>
          {folder.maps.length > 0 && folder.maps.length}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 300, duration: 0.15 }}
            style={{ overflow: 'hidden' }}
          >
            {Object.values(folder.folders).map(f => (
              <FolderView key={f.name} folder={f} path={[...path, f.name]} depth={depth + 1} searchTerm={searchTerm} onSelectMap={onSelectMap} onPrompt={onPrompt} openTabIds={openTabIds} activeTabId={activeTabId} />
            ))}
            {folder.maps.map((m, idx) => (
              <MapRow key={`${m.IdName || m.Name}-${idx}`} map={m} searchTerm={searchTerm} onSelectMap={onSelectMap} onPrompt={onPrompt} depth={depth + 1} isOpen={openTabIds.has(m.IdName || m.Name)} isActive={(m.IdName || m.Name) === activeTabId} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── MapRow ── */
function MapRow({
  map, searchTerm, onSelectMap, onPrompt, depth = 1, isOpen = false, isActive = false,
}: {
  map: ECUMap; searchTerm: string;
  onSelectMap: (m: ECUMap) => void;
  onPrompt: (m: string, d: string, c: (v: string) => void) => void;
  depth?: number;
  isOpen?: boolean;
  isActive?: boolean;
}) {
  const { renameMap } = useEditor();
  if (searchTerm && !map.Name.toLowerCase().includes(searchTerm) && !(map.IdName || '').toLowerCase().includes(searchTerm)) {
    return null;
  }
  return (
    <div
      onClick={() => onSelectMap(map)}
      onContextMenu={e => {
        e.preventDefault();
        onPrompt('Rename map:', map.Name, n => { if (n) renameMap(map.IdName || map.Name, n); });
      }}
      style={{
        display: 'flex', alignItems: 'center',
        padding: `3px 6px 3px ${6 + depth * 14}px`,
        cursor: 'pointer', borderRadius: '4px',
        fontSize: '11px',
        color: isActive ? 'var(--accent-primary)' : isOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontWeight: isActive ? 600 : 400,
        userSelect: 'none', transition: 'background 0.08s',
        background: isActive ? 'var(--accent-subtle)' : 'transparent',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      title="Click to open · Right-click to rename"
    >
      {/* Indent guide */}
      {depth > 0 && (
        <div style={{
          position: 'absolute', left: `${6 + (depth - 1) * 14 + 6}px`, top: 0, bottom: 0,
          width: '1px', background: 'var(--border-subtle)',
        }} />
      )}
      {/* Active dot */}
      {isOpen && (
        <div style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: isActive ? 'var(--accent-primary)' : 'var(--green)',
          flexShrink: 0, marginRight: '4px',
        }} />
      )}
      <FileText size={10} style={{ color: isOpen ? 'var(--accent-primary)' : 'var(--text-muted)', flexShrink: 0, marginRight: '4px' }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{map.Name}</span>
    </div>
  );
}
