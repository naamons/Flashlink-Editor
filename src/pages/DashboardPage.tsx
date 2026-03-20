import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hexagon, Plus, Search, Filter, Clock, User, Car,
  FileText, GitBranch, Upload, Trash2, Edit3, ChevronRight,
  FolderOpen, X, LogOut, Tag, Cpu, Download,
  BarChart3, Eye, Layers,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/* ── Types ──────────────────────────────────────────────── */
interface ProjectFile {
  id: string;
  name: string;
  type: 'bin' | 'json' | 'script';
  sizeKB: number;
  uploadedAt: number;
}

interface ProjectVersion {
  id: string;
  name: string;
  timestamp: number;
  notes: string;
  files: ProjectFile[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  vehicle: string;
}

interface Project {
  id: string;
  name: string;
  ecuType: string;
  calibrationId: string;
  vehicleInfo: string;
  customer: Customer;
  versions: ProjectVersion[];
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'delivered' | 'archived';
  tags: string[];
}

/* ── Demo Data ──────────────────────────────────────────── */
function demoData(): Project[] {
  const now = Date.now();
  return [
    {
      id: 'p1', name: 'Elantra N Stage 2', ecuType: 'SIM2K-250', calibrationId: 'CNPNKM__FT5A',
      vehicleInfo: '2024 Hyundai Elantra N (DPE)',
      customer: { id: 'c1', name: 'Nathan Amons', email: 'nathan@example.com', vehicle: '2024 Elantra N' },
      versions: [
        { id: 'v1', name: 'Stock Read', timestamp: now - 86400000 * 5, notes: 'Initial ECU read', files: [
          { id: 'f1', name: 'stock_read.bin', type: 'bin', sizeKB: 2048, uploadedAt: now - 86400000 * 5 },
          { id: 'f2', name: 'CNPNKM__FT5A.json', type: 'json', sizeKB: 384, uploadedAt: now - 86400000 * 5 },
        ]},
        { id: 'v2', name: 'Stage 1 — FBO', timestamp: now - 86400000 * 3, notes: 'Intake + exhaust tune', files: [
          { id: 'f3', name: 'stage1_fbo.bin', type: 'bin', sizeKB: 2048, uploadedAt: now - 86400000 * 3 },
          { id: 'f4', name: 'diff_stage1.json', type: 'script', sizeKB: 12, uploadedAt: now - 86400000 * 3 },
        ]},
        { id: 'v3', name: 'Stage 2 — E30', timestamp: now - 86400000, notes: 'E30 blend, higher boost targets', files: [
          { id: 'f5', name: 'stage2_e30.bin', type: 'bin', sizeKB: 2048, uploadedAt: now - 86400000 },
          { id: 'f6', name: 'diff_stage2.json', type: 'script', sizeKB: 18, uploadedAt: now - 86400000 },
        ]},
      ],
      createdAt: now - 86400000 * 5, updatedAt: now - 86400000,
      status: 'active', tags: ['Stage 2', 'E30', 'Turbo'],
    },
    {
      id: 'p2', name: 'GR Corolla — Customer Build', ecuType: 'MED17.9.x', calibrationId: 'GRC_210_A',
      vehicleInfo: '2023 Toyota GR Corolla Morizo',
      customer: { id: 'c2', name: 'Jake Peterson', email: 'jake@example.com', vehicle: '2023 GR Corolla' },
      versions: [
        { id: 'v4', name: 'Stock Read', timestamp: now - 86400000 * 10, notes: 'First read from customer car', files: [
          { id: 'f7', name: 'grc_stock.bin', type: 'bin', sizeKB: 4096, uploadedAt: now - 86400000 * 10 },
        ]},
        { id: 'v5', name: 'Stage 1 — 93 Oct', timestamp: now - 86400000 * 7, notes: '93 octane tune, stock hardware', files: [
          { id: 'f8', name: 'grc_stage1.bin', type: 'bin', sizeKB: 4096, uploadedAt: now - 86400000 * 7 },
          { id: 'f9', name: 'diff_grc_s1.json', type: 'script', sizeKB: 22, uploadedAt: now - 86400000 * 7 },
        ]},
      ],
      createdAt: now - 86400000 * 10, updatedAt: now - 86400000 * 7,
      status: 'delivered', tags: ['Stage 1', '93 Oct'],
    },
    {
      id: 'p3', name: 'N74 745i Research', ecuType: 'MSV90', calibrationId: 'N74_B7_01',
      vehicleInfo: '2014 BMW 745i (F01)',
      customer: { id: 'c3', name: 'Marcus Lee', email: 'marcus@example.com', vehicle: '2014 BMW 745i' },
      versions: [
        { id: 'v6', name: 'Initial Read', timestamp: now - 86400000 * 2, notes: 'Research project pull', files: [
          { id: 'f10', name: 'n74_read.bin', type: 'bin', sizeKB: 8192, uploadedAt: now - 86400000 * 2 },
          { id: 'f11', name: 'n74_def.json', type: 'json', sizeKB: 512, uploadedAt: now - 86400000 * 2 },
        ]},
      ],
      createdAt: now - 86400000 * 2, updatedAt: now - 86400000 * 2,
      status: 'active', tags: ['Research', 'V12'],
    },
    {
      id: 'p4', name: 'Civic Type R — Track Build', ecuType: 'Keihin', calibrationId: 'FL5_TRACK_02',
      vehicleInfo: '2024 Honda Civic Type R (FL5)',
      customer: { id: 'c4', name: 'Sara Kim', email: 'sara@example.com', vehicle: '2024 Civic Type R' },
      versions: [
        { id: 'v7', name: 'Stock Baseline', timestamp: now - 86400000 * 14, notes: 'Baseline read for track prep', files: [
          { id: 'f12', name: 'fl5_stock.bin', type: 'bin', sizeKB: 3072, uploadedAt: now - 86400000 * 14 },
        ]},
      ],
      createdAt: now - 86400000 * 14, updatedAt: now - 86400000 * 14,
      status: 'archived', tags: ['Track', 'NA'],
    },
  ];
}

/* ── Helpers ────────────────────────────────────────────── */
function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  active:    { bg: 'rgba(76,175,80,0.08)',  text: '#4caf50', border: 'rgba(76,175,80,0.2)' },
  delivered: { bg: 'rgba(66,165,245,0.08)', text: '#42a5f5', border: 'rgba(66,165,245,0.2)' },
  archived:  { bg: 'rgba(158,158,158,0.08)', text: '#9e9e9e', border: 'rgba(158,158,158,0.2)' },
};

const fileTypeIcons: Record<string, string> = { bin: '🔧', json: '📋', script: '📜' };

/* ── Main Component ─────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [projects] = useState<Project[]>(demoData);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'created'>('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  /* Filtered & sorted projects */
  const filtered = useMemo(() => {
    let list = projects;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.customer.name.toLowerCase().includes(q) ||
        p.vehicleInfo.toLowerCase().includes(q) ||
        p.ecuType.toLowerCase().includes(q) ||
        p.calibrationId.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter(p => p.status === statusFilter);
    }
    const sorted = [...list];
    if (sortBy === 'updated') sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    else if (sortBy === 'created') sorted.sort((a, b) => b.createdAt - a.createdAt);
    else sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [projects, searchQuery, statusFilter, sortBy]);

  const totalFiles = projects.reduce((s, p) => s + p.versions.reduce((vs, v) => vs + v.files.length, 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a08', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Navigation ──────────────────────────────────── */}
      <header style={{
        height: '56px', flexShrink: 0,
        background: 'rgba(12,10,8,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(200,170,120,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
               onClick={() => navigate('/')}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #c9a24e, #d4b263)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Hexagon size={14} color="#0c0a08" />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#e8e0d4' }}>
              ECU<span style={{ color: '#c9a24e' }}>AutoTuner</span>
            </span>
          </div>
          <div style={{ width: '1px', height: '20px', background: 'rgba(200,170,120,0.1)' }} />
          <span style={{ fontSize: '13px', color: '#9a8e7f', fontWeight: 500 }}>Dashboard</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/editor')}
            style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              background: 'rgba(201,162,78,0.08)', border: '1px solid rgba(201,162,78,0.15)',
              color: '#c9a24e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,162,78,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,162,78,0.08)'; }}
          >
            <Cpu size={13} /> Open Editor
          </button>

          {/* User */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px',
            borderRadius: '8px', background: 'rgba(30,26,22,0.5)',
            border: '1px solid rgba(200,170,120,0.06)',
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '6px',
              background: 'linear-gradient(135deg, #c9a24e, #d4b263)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, color: '#0c0a08',
            }}>
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: '12px', color: '#9a8e7f', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || 'user@example.com'}
            </span>
            <button
              onClick={signOut}
              title="Sign Out"
              style={{
                background: 'none', border: 'none', color: '#5c5348',
                cursor: 'pointer', display: 'flex', padding: '2px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef5350'}
              onMouseLeave={e => e.currentTarget.style.color = '#5c5348'}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px', marginBottom: '32px',
        }}>
          {[
            { label: 'Total Projects', value: projects.length, icon: FolderOpen, color: '#c9a24e' },
            { label: 'Active', value: projects.filter(p => p.status === 'active').length, icon: BarChart3, color: '#4caf50' },
            { label: 'Versions', value: projects.reduce((s, p) => s + p.versions.length, 0), icon: GitBranch, color: '#42a5f5' },
            { label: 'Files', value: totalFiles, icon: FileText, color: '#ab47bc' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                padding: '20px', borderRadius: '14px',
                background: 'rgba(21,18,16,0.6)',
                border: '1px solid rgba(200,170,120,0.06)',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: `${stat.color}12`,
                border: `1px solid ${stat.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <stat.icon size={18} color={stat.color} />
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#e8e0d4' }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: '#5c5348', fontWeight: 500 }}>{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#5c5348' }} />
            <input
              type="text"
              placeholder="Search projects, customers, vehicles, tags…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px 11px 40px',
                background: 'rgba(30,26,22,0.6)',
                border: '1px solid rgba(200,170,120,0.1)',
                borderRadius: '10px', color: '#e8e0d4', fontSize: '13px',
                outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                fontFamily: 'var(--font-sans)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,162,78,0.3)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,78,0.06)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(200,170,120,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#5c5348', cursor: 'pointer', display: 'flex', padding: '4px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(200,170,120,0.1)' }}>
            {['all', 'active', 'delivered', 'archived'].map(s => (
              <button key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '8px 14px', fontSize: '12px', fontWeight: 600,
                  background: statusFilter === s ? 'rgba(201,162,78,0.12)' : 'rgba(30,26,22,0.4)',
                  color: statusFilter === s ? '#c9a24e' : '#5c5348',
                  border: 'none', cursor: 'pointer',
                  borderRight: '1px solid rgba(200,170,120,0.06)',
                  textTransform: 'capitalize', transition: 'all 0.15s',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'updated' | 'name' | 'created')}
            style={{
              padding: '8px 12px', borderRadius: '8px', fontSize: '12px',
              background: 'rgba(30,26,22,0.6)', color: '#9a8e7f',
              border: '1px solid rgba(200,170,120,0.1)',
              outline: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <option value="updated">Updated</option>
            <option value="created">Created</option>
            <option value="name">Name</option>
          </select>

          {/* View toggle */}
          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(200,170,120,0.1)' }}>
            {(['grid', 'list'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                padding: '8px 12px', fontSize: '12px',
                background: viewMode === m ? 'rgba(201,162,78,0.12)' : 'rgba(30,26,22,0.4)',
                color: viewMode === m ? '#c9a24e' : '#5c5348', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s',
              }}>
                {m === 'grid' ? <Layers size={13} /> : <Filter size={13} />}
              </button>
            ))}
          </div>

          {/* New project */}
          <button
            onClick={() => setShowNewProject(true)}
            style={{
              padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
              background: 'linear-gradient(135deg, #c9a24e, #d4b263)',
              color: '#0c0a08', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,162,78,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <Plus size={16} /> New Project
          </button>
        </div>

        {/* ── Project Cards ─────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Search size={40} color="#5c5348" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', color: '#9a8e7f', fontWeight: 600 }}>No projects found</p>
            <p style={{ fontSize: '13px', color: '#5c5348', marginTop: '4px' }}>
              {searchQuery ? 'Try adjusting your search or filters.' : 'Create your first project to get started.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: viewMode === 'grid'
              ? 'grid'
              : 'flex',
            ...(viewMode === 'grid'
              ? { gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }
              : { flexDirection: 'column' as const, gap: '12px' }),
          }}>
            <AnimatePresence>
              {filtered.map((project, i) => {
                const isExpanded = expandedProject === project.id;
                const sc = statusColors[project.status];

                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      borderRadius: '16px',
                      background: isExpanded
                        ? 'linear-gradient(135deg, rgba(30,26,22,0.95), rgba(21,18,16,0.98))'
                        : 'rgba(21,18,16,0.6)',
                      border: `1px solid ${isExpanded ? 'rgba(201,162,78,0.15)' : 'rgba(200,170,120,0.06)'}`,
                      overflow: 'hidden',
                      transition: 'border-color 0.2s, background 0.2s',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => {
                      if (!isExpanded) e.currentTarget.style.borderColor = 'rgba(200,170,120,0.12)';
                    }}
                    onMouseLeave={e => {
                      if (!isExpanded) e.currentTarget.style.borderColor = 'rgba(200,170,120,0.06)';
                    }}
                  >
                    {/* Card header */}
                    <div
                      style={{
                        padding: '20px 24px', display: 'flex', alignItems: 'flex-start',
                        gap: '16px', cursor: 'pointer',
                      }}
                      onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                    >
                      {/* Icon */}
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                        background: 'linear-gradient(135deg, rgba(201,162,78,0.1), rgba(201,162,78,0.04))',
                        border: '1px solid rgba(201,162,78,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Cpu size={20} color="#c9a24e" />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <h3 style={{
                            fontSize: '15px', fontWeight: 700, color: '#e8e0d4',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {project.name}
                          </h3>
                          <span style={{
                            padding: '2px 8px', borderRadius: '100px', fontSize: '10px',
                            fontWeight: 600, textTransform: 'capitalize',
                            background: sc.bg, color: sc.text,
                            border: `1px solid ${sc.border}`,
                          }}>
                            {project.status}
                          </span>
                        </div>

                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '14px',
                          fontSize: '12px', color: '#5c5348', flexWrap: 'wrap',
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Car size={12} /> {project.vehicleInfo}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} /> {project.customer.name}
                          </span>
                        </div>

                        {/* Meta row */}
                        <div style={{
                          display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap',
                        }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: '6px', fontSize: '10px',
                            fontWeight: 600, fontFamily: 'var(--font-mono)',
                            background: 'rgba(66,165,245,0.08)', color: '#42a5f5',
                            border: '1px solid rgba(66,165,245,0.12)',
                          }}>
                            {project.ecuType}
                          </span>
                          <span style={{
                            padding: '3px 8px', borderRadius: '6px', fontSize: '10px',
                            fontWeight: 600, fontFamily: 'var(--font-mono)',
                            background: 'rgba(158,158,158,0.06)', color: '#9e9e9e',
                            border: '1px solid rgba(158,158,158,0.1)',
                          }}>
                            {project.calibrationId}
                          </span>
                          <span style={{
                            fontSize: '10px', color: '#5c5348',
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}>
                            <GitBranch size={10} /> {project.versions.length} version{project.versions.length !== 1 ? 's' : ''}
                          </span>
                          <span style={{
                            fontSize: '10px', color: '#5c5348',
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}>
                            <Clock size={10} /> {relativeTime(project.updatedAt)}
                          </span>
                        </div>

                        {/* Tags */}
                        {project.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                            {project.tags.map(t => (
                              <span key={t} style={{
                                padding: '2px 7px', borderRadius: '4px', fontSize: '10px',
                                fontWeight: 600, color: '#c9a24e',
                                background: 'rgba(201,162,78,0.06)',
                                border: '1px solid rgba(201,162,78,0.1)',
                              }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expand chevron */}
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ color: '#5c5348', flexShrink: 0, marginTop: '4px' }}
                      >
                        <ChevronRight size={18} />
                      </motion.div>
                    </div>

                    {/* ── Expanded: versions & files ─────────────── */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{
                            padding: '0 24px 24px',
                            borderTop: '1px solid rgba(200,170,120,0.06)',
                          }}>
                            {/* Actions */}
                            <div style={{
                              display: 'flex', gap: '8px', padding: '16px 0',
                              borderBottom: '1px solid rgba(200,170,120,0.04)',
                              flexWrap: 'wrap',
                            }}>
                              {[
                                { label: 'Open in Editor', icon: Cpu, primary: true },
                                { label: 'Upload File', icon: Upload },
                                { label: 'New Version', icon: GitBranch },
                                { label: 'Export', icon: Download },
                                { label: 'Edit', icon: Edit3 },
                                { label: 'Delete', icon: Trash2, danger: true },
                              ].map(btn => (
                                <button key={btn.label}
                                  style={{
                                    padding: '6px 12px', borderRadius: '7px', fontSize: '11px',
                                    fontWeight: 600,
                                    background: btn.primary
                                      ? 'rgba(201,162,78,0.1)'
                                      : btn.danger
                                        ? 'rgba(239,83,80,0.06)'
                                        : 'rgba(30,26,22,0.6)',
                                    color: btn.primary
                                      ? '#c9a24e'
                                      : btn.danger
                                        ? '#ef5350'
                                        : '#9a8e7f',
                                    border: `1px solid ${btn.primary
                                      ? 'rgba(201,162,78,0.15)'
                                      : btn.danger
                                        ? 'rgba(239,83,80,0.12)'
                                        : 'rgba(200,170,120,0.06)'}`,
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  <btn.icon size={12} /> {btn.label}
                                </button>
                              ))}
                            </div>

                            {/* Customer info */}
                            <div style={{
                              padding: '16px 0', borderBottom: '1px solid rgba(200,170,120,0.04)',
                              display: 'flex', gap: '24px', flexWrap: 'wrap',
                            }}>
                              <div>
                                <div style={{ fontSize: '10px', color: '#5c5348', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Customer</div>
                                <div style={{ fontSize: '13px', color: '#e8e0d4', fontWeight: 600 }}>{project.customer.name}</div>
                                <div style={{ fontSize: '11px', color: '#5c5348' }}>{project.customer.email}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '10px', color: '#5c5348', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Vehicle</div>
                                <div style={{ fontSize: '13px', color: '#e8e0d4', fontWeight: 600 }}>{project.customer.vehicle}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '10px', color: '#5c5348', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Created</div>
                                <div style={{ fontSize: '13px', color: '#e8e0d4', fontWeight: 600 }}>{new Date(project.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>

                            {/* Versions */}
                            <div style={{ padding: '16px 0 0' }}>
                              <div style={{
                                fontSize: '11px', fontWeight: 700, color: '#9a8e7f',
                                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px',
                              }}>
                                Versions ({project.versions.length})
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {project.versions.map((ver, vi) => {
                                  const verExpanded = expandedVersion === ver.id;
                                  const isLatest = vi === project.versions.length - 1;
                                  return (
                                    <div key={ver.id} style={{
                                      borderRadius: '10px',
                                      background: verExpanded ? 'rgba(30,26,22,0.6)' : 'rgba(30,26,22,0.3)',
                                      border: `1px solid ${verExpanded ? 'rgba(200,170,120,0.1)' : 'rgba(200,170,120,0.04)'}`,
                                      transition: 'all 0.15s',
                                    }}>
                                      <div
                                        style={{
                                          padding: '12px 16px', display: 'flex', alignItems: 'center',
                                          gap: '12px', cursor: 'pointer',
                                        }}
                                        onClick={() => setExpandedVersion(verExpanded ? null : ver.id)}
                                      >
                                        <motion.div
                                          animate={{ rotate: verExpanded ? 90 : 0 }}
                                          transition={{ duration: 0.15 }}
                                          style={{ color: '#5c5348', flexShrink: 0 }}
                                        >
                                          <ChevronRight size={14} />
                                        </motion.div>

                                        <GitBranch size={14} color={isLatest ? '#c9a24e' : '#5c5348'} style={{ flexShrink: 0 }} />

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8e0d4' }}>{ver.name}</span>
                                            {isLatest && (
                                              <span style={{
                                                padding: '1px 6px', borderRadius: '4px', fontSize: '9px',
                                                fontWeight: 700, background: 'rgba(201,162,78,0.1)',
                                                color: '#c9a24e', border: '1px solid rgba(201,162,78,0.15)',
                                              }}>
                                                LATEST
                                              </span>
                                            )}
                                          </div>
                                          <div style={{ fontSize: '11px', color: '#5c5348', marginTop: '2px' }}>
                                            {ver.notes} · {relativeTime(ver.timestamp)} · {ver.files.length} file{ver.files.length !== 1 ? 's' : ''}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Version files */}
                                      <AnimatePresence>
                                        {verExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ overflow: 'hidden' }}
                                          >
                                            <div style={{
                                              padding: '0 16px 12px 46px',
                                              display: 'flex', flexDirection: 'column', gap: '6px',
                                            }}>
                                              {ver.files.map(f => (
                                                <div key={f.id} style={{
                                                  display: 'flex', alignItems: 'center', gap: '10px',
                                                  padding: '8px 12px', borderRadius: '8px',
                                                  background: 'rgba(12,10,8,0.4)',
                                                  border: '1px solid rgba(200,170,120,0.04)',
                                                  transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,162,78,0.04)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(12,10,8,0.4)'}
                                                >
                                                  <span style={{ fontSize: '14px' }}>{fileTypeIcons[f.type] || '📄'}</span>
                                                  <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                      fontSize: '12px', fontWeight: 600, color: '#e8e0d4',
                                                      fontFamily: 'var(--font-mono)',
                                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                    }}>
                                                      {f.name}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#5c5348' }}>
                                                      {f.sizeKB >= 1024 ? `${(f.sizeKB / 1024).toFixed(1)} MB` : `${f.sizeKB} KB`} · {relativeTime(f.uploadedAt)}
                                                    </div>
                                                  </div>
                                                  <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button title="Download" style={{
                                                      background: 'none', border: 'none', color: '#5c5348',
                                                      cursor: 'pointer', display: 'flex', padding: '4px',
                                                      borderRadius: '4px', transition: 'color 0.15s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#c9a24e'}
                                                    onMouseLeave={e => e.currentTarget.style.color = '#5c5348'}
                                                    >
                                                      <Download size={13} />
                                                    </button>
                                                    <button title="View" style={{
                                                      background: 'none', border: 'none', color: '#5c5348',
                                                      cursor: 'pointer', display: 'flex', padding: '4px',
                                                      borderRadius: '4px', transition: 'color 0.15s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#42a5f5'}
                                                    onMouseLeave={e => e.currentTarget.style.color = '#5c5348'}
                                                    >
                                                      <Eye size={13} />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ── New Project Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showNewProject && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            padding: '24px',
          }}
          onClick={() => setShowNewProject(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: '520px',
                background: '#151210', border: '1px solid rgba(200,170,120,0.1)',
                borderRadius: '18px', padding: '32px', position: 'relative',
                boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
              }}
            >
              <button
                onClick={() => setShowNewProject(false)}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'none', border: 'none', color: '#5c5348',
                  cursor: 'pointer', padding: '4px', display: 'flex',
                }}
              >
                <X size={20} />
              </button>

              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#e8e0d4', marginBottom: '8px' }}>
                New Project
              </h2>
              <p style={{ fontSize: '13px', color: '#9a8e7f', marginBottom: '28px' }}>
                Set up a new ECU calibration project for a customer.
              </p>

              <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                    onSubmit={e => { e.preventDefault(); setShowNewProject(false); }}>
                {[
                  { label: 'Project Name', placeholder: 'Elantra N Stage 2', icon: Tag },
                  { label: 'Customer Name', placeholder: 'John Doe', icon: User },
                  { label: 'Vehicle', placeholder: '2024 Hyundai Elantra N', icon: Car },
                  { label: 'ECU Type', placeholder: 'SIM2K-250', icon: Cpu },
                  { label: 'Calibration ID', placeholder: 'CNPNKM__FT5A', icon: FileText },
                ].map(field => (
                  <div key={field.label}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8e7f', display: 'block', marginBottom: '6px' }}>
                      {field.label}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <field.icon size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5c5348' }} />
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        style={{
                          width: '100%', padding: '11px 12px 11px 38px',
                          background: 'rgba(30,26,22,0.6)',
                          border: '1px solid rgba(200,170,120,0.1)',
                          borderRadius: '10px', color: '#e8e0d4', fontSize: '13px',
                          outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                          fontFamily: 'var(--font-sans)',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,162,78,0.3)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,78,0.06)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(200,170,120,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>
                ))}

                {/* Upload area */}
                <div style={{
                  padding: '24px', borderRadius: '12px', textAlign: 'center',
                  border: '2px dashed rgba(200,170,120,0.1)',
                  background: 'rgba(30,26,22,0.3)',
                  cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,162,78,0.25)'; e.currentTarget.style.background = 'rgba(201,162,78,0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(200,170,120,0.1)'; e.currentTarget.style.background = 'rgba(30,26,22,0.3)'; }}
                >
                  <Upload size={24} color="#5c5348" style={{ marginBottom: '8px' }} />
                  <p style={{ fontSize: '13px', color: '#9a8e7f', fontWeight: 600 }}>Drop your .bin file here</p>
                  <p style={{ fontSize: '11px', color: '#5c5348', marginTop: '4px' }}>or click to browse</p>
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '14px', marginTop: '4px',
                    borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                    background: 'linear-gradient(135deg, #c9a24e, #d4b263)',
                    color: '#0c0a08', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,162,78,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <Plus size={16} /> Create Project
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
