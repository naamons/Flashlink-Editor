import { useState } from 'react';
import { useEditor } from '../store/EditorStore';
import type { Project } from '../store/EditorStore';
import { FolderOpen, Plus, Trash2, Clock, X, Save, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectModal({ isOpen, onClose }: Props) {
  const {
    savedProjects, currentProject,
    saveProject, loadProject, deleteProject,
    saveVersion, loadVersion,
    loadCustomBin,
  } = useEditor();

  const [tab, setTab] = useState<'projects' | 'versions'>('projects');
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    saveProject(name);
    setNewName('');
  };

  const handleOpenBin = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.bin';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const buf = await file.arrayBuffer();
      loadCustomBin(buf);
      onClose();
    };
    input.click();
  };

  const handleSaveVersion = () => {
    const name = prompt('Version name:');
    if (name) saveVersion(name);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              width: '520px', maxHeight: '70vh',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px 0', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Project Manager
              </h2>
              <button onClick={onClose} className="ghost" style={{ padding: '4px' }}>
                <X size={14} />
              </button>
            </div>

            {/* Tab switcher */}
            <div style={{
              display: 'flex', gap: '0', margin: '12px 20px 0',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <button
                onClick={() => setTab('projects')}
                style={{
                  padding: '6px 14px', fontSize: '11px', fontWeight: 600,
                  background: 'transparent', border: 'none',
                  borderBottom: tab === 'projects' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: tab === 'projects' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Projects
              </button>
              <button
                onClick={() => setTab('versions')}
                style={{
                  padding: '6px 14px', fontSize: '11px', fontWeight: 600,
                  background: 'transparent', border: 'none',
                  borderBottom: tab === 'versions' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: tab === 'versions' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                disabled={!currentProject}
              >
                Versions {currentProject ? `(${currentProject.versions.length})` : ''}
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 20px' }}>
              {tab === 'projects' && (
                <>
                  {/* Create new */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                      placeholder="New project name…"
                      style={{ flex: 1, height: '30px', fontSize: '12px' }}
                    />
                    <button onClick={handleCreate} className="primary" style={{ padding: '4px 12px', gap: '4px' }}>
                      <Plus size={12} /> Create
                    </button>
                  </div>

                  {/* Open bin directly */}
                  <button onClick={handleOpenBin} className="ghost" style={{ width: '100%', justifyContent: 'center', padding: '8px', marginBottom: '12px', gap: '6px', border: '1px dashed var(--border-light)' }}>
                    <Upload size={13} /> Open Binary File (.bin)
                  </button>

                  {/* Project list */}
                  {savedProjects.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '12px' }}>
                      No saved projects yet
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {savedProjects.map((p: Project) => (
                        <div
                          key={p.name}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 10px', borderRadius: '6px',
                            background: currentProject?.name === p.name ? 'var(--accent-subtle)' : 'transparent',
                            border: '1px solid ' + (currentProject?.name === p.name ? 'var(--border-active)' : 'var(--border-subtle)'),
                            cursor: 'pointer',
                            transition: 'background 0.1s',
                          }}
                          onClick={() => { loadProject(p.name); onClose(); }}
                          onMouseEnter={e => { if (currentProject?.name !== p.name) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                          onMouseLeave={e => { if (currentProject?.name !== p.name) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FolderOpen size={14} style={{ color: 'var(--accent-primary)' }} />
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                {p.ecuDef} · {p.versions.length} version{p.versions.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); deleteProject(p.name); }}
                            className="ghost"
                            style={{ padding: '4px', color: 'var(--text-muted)' }}
                            title="Delete project"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {tab === 'versions' && currentProject && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Project: <strong style={{ color: 'var(--text-primary)' }}>{currentProject.name}</strong>
                    </span>
                    <button onClick={handleSaveVersion} className="primary" style={{ padding: '4px 12px', gap: '4px' }}>
                      <Save size={12} /> Save Version
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {currentProject.versions.map((v, idx) => (
                      <div
                        key={idx}
                        onClick={() => { loadVersion(idx); onClose(); }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 10px', borderRadius: '6px',
                          background: idx === currentProject.activeVersionIdx ? 'var(--accent-subtle)' : 'transparent',
                          border: '1px solid ' + (idx === currentProject.activeVersionIdx ? 'var(--border-active)' : 'var(--border-subtle)'),
                          cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { if (idx !== currentProject.activeVersionIdx) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={e => { if (idx !== currentProject.activeVersionIdx) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={13} style={{ color: idx === currentProject.activeVersionIdx ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{v.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {formatDate(v.timestamp)}
                            </div>
                          </div>
                        </div>
                        {idx === currentProject.activeVersionIdx && (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Active</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
