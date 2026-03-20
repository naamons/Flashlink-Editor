import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor } from '../store/EditorStore';
import type { ECUMap } from '../store/EditorStore';
import { Search, Command, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const { mapsDict, openMapTab } = useEditor();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allMaps: ECUMap[] = Object.values(mapsDict);

  const filtered = query.trim() === ''
    ? allMaps.slice(0, 30)
    : allMaps.filter(m =>
        m.Name.toLowerCase().includes(query.toLowerCase()) ||
        (m.IdName || '').toLowerCase().includes(query.toLowerCase()) ||
        (m.FolderName || '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 40);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => { setSelectedIdx(0); }, [query]);

  const handleSelect = useCallback((map: ECUMap) => {
    openMapTab(map);
    onClose();
  }, [openMapTab, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIdx]) handleSelect(filtered[selectedIdx]);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const item = listRef.current?.children[selectedIdx] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const highlightMatch = (text: string, q: string) => {
    if (!q) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <span>{text}</span>;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)', borderRadius: '2px', padding: '0 1px' }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={onClose}
          >
            {/* Palette Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350, duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '580px',
                maxHeight: '70vh',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-active)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Search Input Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <Search size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search maps, IDs, folders…"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    style={{ background: 'transparent', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={14} />
                  </button>
                )}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '3px',
                  background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)',
                  borderRadius: '5px', padding: '2px 7px', fontSize: '11px', color: 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  <Command size={10} /> K
                </div>
              </div>

              {/* Results Section Label */}
              <div style={{ padding: '8px 16px 4px', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {query ? `${filtered.length} Results` : 'All Maps'}
              </div>

              {/* Results List */}
              <div
                ref={listRef}
                style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 8px' }}
              >
                {filtered.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No maps match "<strong style={{ color: 'var(--text-secondary)' }}>{query}</strong>"
                  </div>
                ) : (
                  filtered.map((map, i) => (
                    <div
                      key={map.IdName || map.Name}
                      onClick={() => handleSelect(map)}
                      onMouseEnter={() => setSelectedIdx(i)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: i === selectedIdx ? 'var(--accent-subtle)' : 'transparent',
                        border: i === selectedIdx ? '1px solid var(--border-active)' : '1px solid transparent',
                        marginBottom: '2px',
                        transition: 'background 0.08s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <Zap size={13} style={{ color: i === selectedIdx ? 'var(--accent-primary)' : 'var(--text-muted)', flexShrink: 0 }} />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {highlightMatch(map.Name, query)}
                          </div>
                          {map.FolderName && (
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                              {map.FolderName}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'var(--bg-hover)', borderRadius: '3px', padding: '1px 5px' }}>
                          {map.IdName}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-hover)', borderRadius: '3px', padding: '1px 5px' }}>
                          {map.Rows}×{map.Columns}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '8px 16px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '16px',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}>
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
                <span>Esc Close</span>
                <span style={{ marginLeft: 'auto' }}>{allMaps.length} maps loaded</span>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
