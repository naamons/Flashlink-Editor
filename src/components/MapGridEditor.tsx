import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useEditor } from '../store/EditorStore';
import type { ECUMap } from '../store/EditorStore';
import {
  Spline, AlignJustify, Hash, Minus, Plus, Percent,
  Undo2, Redo2, Link, Unlink,
} from 'lucide-react';
import PromptModal from './PromptModal';
import { getHeatColor, type HeatmapMode } from '../utils/HeatmapUtils';

export default function MapGridEditor({ map }: { map: ECUMap }) {
  const {
    editedBin, originalBin, updateBinData, updateBinDataBatch,
    undo, redo, undoCount, redoCount,
    linkMaps, unlinkMaps, getLinkedGroup,
  } = useEditor();

  const [editingCell, setEditingCell] = useState<{r: number, c: number} | null>(null);
  const [editValue, setEditValue]     = useState('');

  // Selection
  const [selStart, setSelStart] = useState<{r: number, c: number} | null>(null);
  const [selEnd,   setSelEnd]   = useState<{r: number, c: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // View mode: current (edited) vs reference (original)
  const [viewMode, setViewMode] = useState<'current' | 'reference'>('current');

  // Interpolation preview
  const [interpPreview, setInterpPreview] = useState<Set<string>>(new Set());

  const [heatMode, setHeatMode] = useState<HeatmapMode | null>('thermal');
  const [promptState, setPromptState] = useState<{
    message: string; defaultValue: string; onConfirm: (v: string) => void;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Map metadata ── */
  const startAddr = parseInt(map.Fieldvalues?.StartAddr?.replace('$', '') || '0', 16);
  const cols      = parseInt(map.Columns || '1', 10);
  const rows      = parseInt(map.Rows || '1', 10);
  const is16Bit   = map.DataOrg === 'eLoHi' || map.DataOrg === 'eHiLo';
  const factor    = parseFloat(map.Fieldvalues?.Factor || '1');
  const offset    = parseFloat(map.Fieldvalues?.Offset || '0');
  const precRaw   = parseInt(map.Precision || '2', 10);
  const precision = isNaN(precRaw) ? 2 : Math.max(0, Math.min(10, precRaw));

  const mapId = map.IdName || map.Name;
  const linkedGroup = getLinkedGroup(mapId);

  /* ── Axis parsing ── */
  const parseAxis = useCallback((axisObj: Record<string, string> | undefined, count: number, bin: Uint8Array | null) => {
    if (!bin || !axisObj?.DataAddr) return Array.from({ length: count }, (_, i) => i);
    const aAddr = parseInt(axisObj.DataAddr.replace('$', ''), 16);
    if (isNaN(aAddr)) return Array.from({ length: count }, (_, i) => i);
    const aFactor = parseFloat(axisObj.Factor || '1');
    const aOffset = parseFloat(axisObj.Offset || '0');
    const aIs16   = axisObj.DataOrg === 'eWord' || axisObj.DataOrg === 'eLoHi' || axisObj.DataOrg === 'eHiLo';
    const bytesPerA = aIs16 ? 2 : 1;
    const arr: number[] = [];
    for (let i = 0; i < count; i++) {
      const addr = aAddr + i * bytesPerA;
      if (addr + bytesPerA > bin.length) { arr.push(i); continue; }
      let raw = 0;
      if (aIs16) {
        raw = axisObj.DataOrg === 'eLoHi'
          ? bin[addr] | (bin[addr + 1] << 8)
          : (bin[addr] << 8) | bin[addr + 1];
      } else { raw = bin[addr]; }
      arr.push(raw * aFactor + aOffset);
    }
    return arr;
  }, []);

  const activeBin = viewMode === 'reference' ? originalBin : editedBin;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axisX = useMemo(() => parseAxis(map.AxisX as any, cols, activeBin), [parseAxis, map.AxisX, cols, activeBin]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axisY = useMemo(() => parseAxis(map.AxisY as any, rows, activeBin), [parseAxis, map.AxisY, rows, activeBin]);

  /* ── Matrix computation ── */
  const matrix = useMemo(() => {
    if (!activeBin) return [] as number[][];
    const bpc = is16Bit ? 2 : 1;
    const mat: number[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        const addr = startAddr + (r * cols + c) * bpc;
        if (addr + bpc > activeBin.length) { row.push(0); continue; }
        let raw = 0;
        if (is16Bit) {
          raw = map.DataOrg === 'eLoHi'
            ? activeBin[addr] | (activeBin[addr+1] << 8)
            : (activeBin[addr] << 8) | activeBin[addr+1];
        } else { raw = activeBin[addr]; }
        row.push(raw * factor + offset);
      }
      mat.push(row);
    }
    return mat;
  }, [activeBin, startAddr, cols, rows, is16Bit, factor, offset, map.DataOrg]);

  const minMax = useMemo(() => {
    let mn = Infinity, mx = -Infinity;
    matrix.forEach(r => r.forEach(v => { if (v < mn) mn = v; if (v > mx) mx = v; }));
    return { min: mn, max: mx };
  }, [matrix]);

  /* ── Selection stats ── */
  const selStats = useMemo(() => {
    if (!selStart || !selEnd || matrix.length === 0) return null;
    const r0 = Math.min(selStart.r, selEnd.r), r1 = Math.max(selStart.r, selEnd.r);
    const c0 = Math.min(selStart.c, selEnd.c), c1 = Math.max(selStart.c, selEnd.c);
    const vals: number[] = [];
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++)
        vals.push(matrix[r]?.[c] ?? 0);
    if (!vals.length) return null;
    const mn = Math.min(...vals), mx = Math.max(...vals), avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { count: vals.length, min: mn.toFixed(precision), max: mx.toFixed(precision), avg: avg.toFixed(precision) };
  }, [selStart, selEnd, matrix, precision]);

  /* ── Byte helpers ── */
  const getCellBytes = (physVal: number) => {
    let raw = Math.round((physVal - offset) / factor);
    raw = Math.max(0, Math.min(is16Bit ? 65535 : 255, raw));
    const bytes = new Uint8Array(is16Bit ? 2 : 1);
    if (is16Bit) {
      if (map.DataOrg === 'eLoHi') { bytes[0] = raw & 0xFF; bytes[1] = (raw >> 8) & 0xFF; }
      else                         { bytes[0] = (raw >> 8) & 0xFF; bytes[1] = raw & 0xFF; }
    } else { bytes[0] = raw & 0xFF; }
    return bytes;
  };

  const getAddress = (r: number, c: number) => startAddr + (r * cols + c) * (is16Bit ? 2 : 1);

  const saveCell = (r: number, c: number, valStr: string) => {
    const v = parseFloat(valStr);
    if (!isNaN(v)) updateBinData(getAddress(r, c), getCellBytes(v));
    setEditingCell(null);
  };

  /* ── Batch apply to selection ── */
  const applyToSelection = useCallback((fn: (v: number, r: number, c: number) => number) => {
    if (!selStart || !selEnd || viewMode === 'reference') return;
    const r0 = Math.min(selStart.r, selEnd.r), r1 = Math.max(selStart.r, selEnd.r);
    const c0 = Math.min(selStart.c, selEnd.c), c1 = Math.max(selStart.c, selEnd.c);
    const updates: {address: number, data: Uint8Array}[] = [];
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++)
        updates.push({ address: getAddress(r, c), data: getCellBytes(fn(matrix[r][c], r, c)) });
    updateBinDataBatch(updates, mapId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selStart, selEnd, matrix, viewMode, mapId]);

  /* ── Keyboard handler ── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) return;

    // Arrow key navigation
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      e.preventDefault();
      setSelStart(prev => {
        if (!prev) return { r: 0, c: 0 };
        let { r, c } = e.shiftKey ? (selEnd ?? prev) : prev;
        if (e.key === 'ArrowUp')    r = Math.max(0, r - 1);
        if (e.key === 'ArrowDown')  r = Math.min(rows - 1, r + 1);
        if (e.key === 'ArrowLeft')  c = Math.max(0, c - 1);
        if (e.key === 'ArrowRight') c = Math.min(cols - 1, c + 1);
        if (e.shiftKey) { setSelEnd({ r, c }); return prev; }
        setSelEnd({ r, c });
        return { r, c };
      });
      return;
    }

    if (e.key === 'Enter' && selStart) {
      setEditingCell(selStart);
      setEditValue(matrix[selStart.r]?.[selStart.c]?.toFixed(precision) ?? '0');
      return;
    }

    switch (e.key.toLowerCase()) {
      case '+': case '=': applyToSelection(v => v + 1); break;
      case '-': case '_': applyToSelection(v => v - 1); break;
      case 'r': applyToSelection(v => Math.round(v)); break;
      case 'p': case '%':
        setPromptState({
          message: 'Enter percentage change (e.g. 5 for +5%, -10 for -10%):',
          defaultValue: '0',
          onConfirm: amt => {
            if (amt && !isNaN(parseFloat(amt))) applyToSelection(v => v * (parseFloat(amt) / 100 + 1));
          },
        });
        break;
      case 'v':
        setPromptState({
          message: 'Enter new value for selected cells:',
          defaultValue: selStart ? (matrix[selStart.r]?.[selStart.c]?.toFixed(precision) ?? '0') : '0',
          onConfirm: val => {
            if (val && !isNaN(parseFloat(val))) applyToSelection(() => parseFloat(val));
          },
        });
        break;
      case 's': case 'i': {
        if (!selStart || !selEnd) break;
        const r0 = Math.min(selStart.r, selEnd.r), r1 = Math.max(selStart.r, selEnd.r);
        const c0 = Math.min(selStart.c, selEnd.c), c1 = Math.max(selStart.c, selEnd.c);
        const ul = matrix[r0][c0], ur = matrix[r0][c1], ll = matrix[r1][c0], lr = matrix[r1][c1];
        const preview = new Set<string>();
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) preview.add(`${r}-${c}`);
        setInterpPreview(preview);
        applyToSelection((_v, r, c) => {
          const rf = r1 === r0 ? 0 : (r - r0) / (r1 - r0);
          const cf = c1 === c0 ? 0 : (c - c0) / (c1 - c0);
          return ul + (ur - ul) * cf + (ll - ul) * rf + (lr - ul - (ur - ul) - (ll - ul)) * cf * rf;
        });
        setTimeout(() => setInterpPreview(new Set()), 600);
        break;
      }
      case 'm': {
        if (!selStart || !selEnd) break;
        const r0 = Math.min(selStart.r, selEnd.r), r1 = Math.max(selStart.r, selEnd.r);
        const c0 = Math.min(selStart.c, selEnd.c), c1 = Math.max(selStart.c, selEnd.c);
        let mx = -Infinity;
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (matrix[r][c] > mx) mx = matrix[r][c];
        applyToSelection(() => mx);
        break;
      }
    }
  };

  /* ── Mouse selection ── */
  const isSelected = (r: number, c: number) => {
    if (!selStart || !selEnd) return false;
    return r >= Math.min(selStart.r, selEnd.r) && r <= Math.max(selStart.r, selEnd.r)
        && c >= Math.min(selStart.c, selEnd.c) && c <= Math.max(selStart.c, selEnd.c);
  };

  useEffect(() => {
    const up = () => setIsDragging(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const cycleHeat = () => {
    setHeatMode(prev => {
      if (!prev)              return 'thermal';
      if (prev === 'thermal') return 'blue-red';
      if (prev === 'blue-red') return 'green-only';
      return null;
    });
    containerRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)', outline: 'none' }}
    >
      {/* ── Header: Title + Current/Reference ── */}
      <div style={{
        padding: '6px 12px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{map.Name}</span>
          <span style={{
            fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
            background: 'var(--bg-hover)', padding: '1px 5px', borderRadius: '3px',
          }}>
            {rows}×{cols}
          </span>
          {/* Current / Reference toggle */}
          <div className="view-toggle" style={{ marginLeft: '8px' }}>
            <button
              className={viewMode === 'current' ? 'active' : ''}
              onClick={() => setViewMode('current')}
            >
              Current
            </button>
            <button
              className={viewMode === 'reference' ? 'active' : ''}
              onClick={() => setViewMode('reference')}
            >
              Reference
            </button>
          </div>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
          {linkedGroup && (
            <span style={{ color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Link size={10} /> Linked ({linkedGroup.mode})
            </span>
          )}
          <span>Maps —</span>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={{
        padding: '4px 12px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', gap: '3px', alignItems: 'center', flexShrink: 0,
        background: 'var(--bg-surface)',
      }}>
        {/* Smooth / Interpolate */}
        <button
          className="toolbar-btn"
          onClick={() => { if (selStart && selEnd) handleKeyDown({ key: 's', preventDefault: () => {}, stopPropagation: () => {} } as unknown as React.KeyboardEvent); }}
          title="Smooth / Interpolate (S)"
        >
          <Spline size={12} />
        </button>
        {/* List view */}
        <button className="toolbar-btn" title="List view">
          <AlignJustify size={12} />
        </button>
        {/* Hash (show raw hex) */}
        <button className="toolbar-btn" title="Show raw hex values (#)">
          <Hash size={12} />
        </button>

        <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)', margin: '0 3px' }} />

        {/* Increment / Decrement */}
        <button className="toolbar-btn" onClick={() => applyToSelection(v => v + 1)} title="Increment (+)">
          <Plus size={12} />
        </button>
        <button className="toolbar-btn" onClick={() => applyToSelection(v => v - 1)} title="Decrement (-)">
          <Minus size={12} />
        </button>

        {/* Percent */}
        <button
          className="toolbar-btn"
          onClick={() => {
            setPromptState({
              message: 'Enter percentage change:', defaultValue: '0',
              onConfirm: amt => { if (amt && !isNaN(parseFloat(amt))) applyToSelection(v => v * (parseFloat(amt) / 100 + 1)); },
            });
          }}
          title="Percentage change (%)"
        >
          <Percent size={12} />
        </button>

        <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)', margin: '0 3px' }} />

        {/* Undo / Redo */}
        <button className="toolbar-btn" onClick={undo} disabled={undoCount === 0} title={`Undo (${undoCount})`}>
          <Undo2 size={12} />
        </button>
        <button className="toolbar-btn" onClick={redo} disabled={redoCount === 0} title={`Redo (${redoCount})`}>
          <Redo2 size={12} />
        </button>

        <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)', margin: '0 3px' }} />

        {/* Heat toggle */}
        <button
          className={`toolbar-btn ${heatMode ? 'active' : ''}`}
          onClick={cycleHeat}
          title="Cycle heatmap (C)"
        >
          {heatMode || 'Heat'}
        </button>

        {/* Link toggle */}
        <button
          className={`toolbar-btn ${linkedGroup ? 'active' : ''}`}
          onClick={() => {
            if (linkedGroup) { unlinkMaps(linkedGroup.id); }
            else {
              setPromptState({
                message: 'Enter map IDs to link (comma-separated):',
                defaultValue: mapId,
                onConfirm: ids => {
                  const arr = ids.split(',').map(s => s.trim()).filter(Boolean);
                  if (arr.length > 1) linkMaps(arr, 'percent');
                },
              });
            }
          }}
          title={linkedGroup ? 'Unlink maps' : 'Link maps'}
        >
          {linkedGroup ? <Unlink size={12} /> : <Link size={12} />}
        </button>

        {/* Reference mode indicator */}
        {viewMode === 'reference' && (
          <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            READ ONLY
          </span>
        )}
      </div>

      {/* ── Grid ── */}
      <div
        style={{ flex: 1, overflow: 'auto', padding: '8px' }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div style={{
          display: 'inline-grid',
          gridTemplateColumns: `minmax(48px, max-content) repeat(${cols}, minmax(48px, 1fr))`,
          gap: '1px',
          background: 'var(--bg-dark)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          {/* Corner */}
          <div style={{ background: 'var(--bg-surface)' }} />

          {/* X Axis headers */}
          {axisX.map((val, c) => {
            const p = isNaN(parseInt(map.AxisX?.Precision)) ? 0 : Math.max(0, parseInt(map.AxisX.Precision));
            return (
              <div key={`x-${c}`} style={{
                background: 'var(--bg-surface)', color: 'var(--text-muted)',
                padding: '4px 6px', textAlign: 'center', fontSize: '10px', fontWeight: 600,
                fontFamily: 'var(--font-mono)',
              }}>
                {val.toFixed(p)}
              </div>
            );
          })}

          {matrix.map((row, r) => (
            <React.Fragment key={`r-${r}`}>
              {/* Y axis */}
              <div style={{
                background: 'var(--bg-surface)', color: 'var(--text-muted)',
                padding: '4px 6px', textAlign: 'right', fontSize: '10px', fontWeight: 600,
                fontFamily: 'var(--font-mono)',
              }}>
                {(() => {
                  const p = isNaN(parseInt(map.AxisY?.Precision)) ? 0 : Math.max(0, parseInt(map.AxisY.Precision));
                  return axisY[r]?.toFixed(p);
                })()}
              </div>

              {/* Data cells */}
              {row.map((cell, c) => {
                const selected  = isSelected(r, c);
                const isPreview = interpPreview.has(`${r}-${c}`);
                const heatBg    = heatMode ? getHeatColor(cell, minMax.min, minMax.max, heatMode) : 'var(--bg-active)';
                const isEditing = editingCell?.r === r && editingCell?.c === c;

                const bg = selected
                  ? 'var(--accent-subtle)'
                  : isPreview
                    ? 'rgba(201,162,78,0.15)'
                    : heatBg;

                const border = selected
                  ? '1px solid var(--border-active)'
                  : isPreview
                    ? '1px solid rgba(201,162,78,0.3)'
                    : '1px solid transparent';

                return (
                  <div
                    key={`d-${r}-${c}`}
                    onMouseDown={() => { setSelStart({r,c}); setSelEnd({r,c}); setIsDragging(true); containerRef.current?.focus(); }}
                    onMouseEnter={() => { if (isDragging) setSelEnd({r,c}); }}
                    onDoubleClick={() => {
                      if (viewMode === 'reference') return;
                      setEditingCell({r,c});
                      setEditValue(cell.toFixed(precision));
                    }}
                    style={{
                      background: bg, border, padding: '4px 6px',
                      textAlign: 'right', fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: selected ? 'var(--accent-primary)' : heatMode ? 'var(--text-primary)' : 'var(--green)',
                      position: 'relative', cursor: viewMode === 'reference' ? 'default' : 'cell',
                      userSelect: 'none', minWidth: '48px',
                    }}
                  >
                    {isEditing ? (
                      <input
                        className="cell-editing-input"
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => saveCell(r, c, editValue)}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  { saveCell(r, c, editValue); }
                          if (e.key === 'Escape') { setEditingCell(null); }
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            saveCell(r, c, editValue);
                            const nc = c + 1 < cols ? c + 1 : 0;
                            const nr = nc === 0 ? r + 1 : r;
                            if (nr < rows) { setEditingCell({r: nr, c: nc}); setEditValue(matrix[nr][nc].toFixed(precision)); }
                          }
                          e.stopPropagation();
                        }}
                      />
                    ) : cell.toFixed(precision)}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Bottom stats bar ── */}
      <div style={{
        padding: '4px 12px', borderTop: '1px solid var(--border-subtle)',
        fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: '10px',
        alignItems: 'center', background: 'var(--bg-surface)', flexShrink: 0,
        fontFamily: 'var(--font-mono)',
      }}>
        {selStats ? (
          <>
            <span><span style={{ color: 'var(--accent-primary)' }}>{selStats.count}</span> cells</span>
            <span>min <span style={{ color: 'var(--green)' }}>{selStats.min}</span></span>
            <span>max <span style={{ color: 'var(--red)' }}>{selStats.max}</span></span>
            <span>avg <span style={{ color: 'var(--blue)' }}>{selStats.avg}</span></span>
          </>
        ) : (
          <span>No selection</span>
        )}
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
          {map.Fieldvalues?.StartAddr} · {map.DataOrg}
        </span>
      </div>

      {promptState !== null && (
        <PromptModal
          message={promptState.message}
          defaultValue={promptState.defaultValue}
          onConfirm={val => { promptState.onConfirm(val); setPromptState(null); containerRef.current?.focus(); }}
          onCancel={() => { setPromptState(null); containerRef.current?.focus(); }}
        />
      )}
    </div>
  );
}
