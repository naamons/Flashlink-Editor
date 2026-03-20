import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useEditor } from '../store/EditorStore';
import { Layers } from 'lucide-react';

export default function HexViewer({ mapStartAddr }: { mapStartAddr?: string }) {
  const { editedBin, hexViewerOffset, setHexViewOffset, updateBinData, openTabs, activeTabId } = useEditor();
  const [localOffset, setLocalOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse start address
  useEffect(() => {
    if (mapStartAddr) {
      const addr = parseInt(mapStartAddr.replace('$', ''), 16);
      if (!isNaN(addr)) {
        setHexViewOffset(Math.max(0, addr - 128)); // Show a bit before the map
      }
    }
  }, [mapStartAddr, setHexViewOffset]);

  useEffect(() => {
    setLocalOffset(hexViewerOffset);
  }, [hexViewerOffset]);

  // Compute highlight ranges for all open maps
  const highlightRanges = useMemo(() => {
    return openTabs.map(map => {
       const start = parseInt(map.Fieldvalues.StartAddr?.replace('$', '') || '0', 16);
       const cols = parseInt(map.Columns || '1', 10);
       const rows = parseInt(map.Rows || '1', 10);
       const is16Bit = map.DataOrg === 'eLoHi' || map.DataOrg === 'eHiLo';
       const bytesPerCell = is16Bit ? 2 : 1;
       const length = cols * rows * bytesPerCell;
       
       const id = map.IdName || map.Name;
       const active = id === activeTabId;

       return { start, end: start + length, name: map.Name, active };
    });
  }, [openTabs, activeTabId]);

  const getByteHighlight = (addr: number) => {
    const range = highlightRanges.find(r => addr >= r.start && addr < r.end);
    if (!range) return { bg: 'transparent', border: '1px solid transparent', color: '#4ade80' }; // Default green text
    
    // Determine borders for the box effect

    if (range.active) {
      return { 
        bg: 'rgba(30, 58, 138, 0.4)', // Dark blue bg
        border: '1px solid #3b82f6', // Bright blue border
        color: '#60a5fa' // Light blue text for active
      };
    }
    return { bg: 'rgba(239, 68, 68, 0.2)', border: '1px solid transparent', color: '#f87171' }; 
  }

  // Keep offset aligned to 16 bytes
  const alignedOffset = Math.floor(localOffset / 16) * 16;
  const rowsToRender = 100; // Increased to cover a full 1080p height easily

  const rows = useMemo(() => {
    if (!editedBin) return [];
    const r = [];
    for (let i = 0; i < rowsToRender; i++) {
      const addr = alignedOffset + (i * 16);
      if (addr >= editedBin.length) break;
      
      const bytes = [];
      for (let j = 0; j < 16; j++) {
        if (addr + j < editedBin.length) {
          bytes.push(editedBin[addr + j]);
        } else {
          bytes.push(null);
        }
      }
      r.push({ addr, bytes });
    }
    return r;
  }, [editedBin, alignedOffset]);


  const handleWheel = (e: React.WheelEvent) => {
    if (!editedBin) return;
    const delta = Math.sign(e.deltaY) * 16 * 5; // Scroll 5 rows at a time
    const newOffset = Math.max(0, Math.min(editedBin.length - 16, alignedOffset + delta));
    setLocalOffset(newOffset);
  };

  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  const toAscii = (n: number) => (n >= 32 && n <= 126) ? String.fromCharCode(n) : '.';

  const handleByteEdit = (addr: number, val: string) => {
    if (!editedBin) return;
    const clean = val.replace(/[^0-9A-Fa-f]/g, '').slice(0, 2);
    if (clean.length === 2) {
      const n = parseInt(clean, 16);
      updateBinData(addr, new Uint8Array([n]));
    }
  };

  if (!editedBin) return (
    <div style={{ flex: 1, backgroundColor: 'var(--bg-panel)' }}></div>
  );

  return (
    <div 
      style={{ 
        flex: 1,
        width: '100%',
        backgroundColor: '#09090b', // Deep black for hex editor background
        display: 'flex', 
        flexDirection: 'column',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: '#666'
      }}
    >
      <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={14} color="var(--accent-primary)" />
          RAW HEX VIEW (BACKGROUND BASE)
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>Addr:</span>
            <input 
                type="text" 
                value={toHex(alignedOffset)} 
                onChange={e => {
                  const n = parseInt(e.target.value, 16);
                  if (!isNaN(n)) setLocalOffset(n);
                }}
                style={{ width: '80px', height: '22px', padding: '0 6px', fontSize: '11px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'var(--text-primary)' }} 
            />
        </div>
      </div>

      <div 
        ref={containerRef}
        onWheel={handleWheel}
        style={{ flex: 1, overflowY: 'hidden', padding: '16px', userSelect: 'none' }}
      >
        {/* Header Row */}
        <div style={{ display: 'flex', marginBottom: '8px', color: 'var(--text-muted)' }}>
          <div style={{ width: '80px', flexShrink: 0 }}>Offset</div>
          <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
            {Array.from({length: 16}).map((_, i) => (
              <div key={i} style={{ width: '22px', textAlign: 'center' }}>{toHex(i)}</div>
            ))}
          </div>
          <div style={{ width: '120px', paddingLeft: '8px' }}>Decoded</div>
        </div>

        {/* Data Rows */}
        {rows.map(row => (
          <div key={row.addr} style={{ display: 'flex', padding: '1px 0', alignItems: 'center' }}>
            {/* Address */}
            <div style={{ width: '80px', flexShrink: 0, color: 'var(--hex-address)' }}>
              {toHex(row.addr).padStart(8, '0')}
            </div>
            
            {/* Hex Cells */}
            <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
              {row.bytes.map((b, i) => {
                if (b === null) return <div key={`empty-${i}`} style={{ width: '22px' }} />;
                
                const addr = row.addr + i;
                const highlightStyle = getByteHighlight(addr);
                const isHighlighted = highlightStyle.bg !== 'transparent';

                return (
                  <input
                    key={addr}
                    type="text"
                    defaultValue={toHex(b)}
                    onBlur={e => handleByteEdit(addr, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    style={{ 
                        width: '26px', // slightly wider to accommodate border
                        padding: '2px 0', 
                        background: highlightStyle.bg, 
                        border: highlightStyle.border, 
                        borderRadius: '0px',
                        color: highlightStyle.color, 
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        fontWeight: isHighlighted ? 600 : 500,
                        margin: '0 -1px', // overlap borders slightly
                        outline: 'none'
                    }} 
                  />
                );
              })}
            </div>

            {/* ASCII Decoded */}
            <div style={{ width: '120px', paddingLeft: '8px', color: 'var(--hex-ascii)', letterSpacing: '2px', whiteSpace: 'pre' }}>
              {row.bytes.map(b => b !== null ? toAscii(b) : ' ').join('')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
