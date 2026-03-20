# Design Principles & Code Examples

This document contains specific code implementation patterns for the interface-design skill.

## Surface Elevation (Tailwind)

Use a consistent elevation scale for backgrounds:

```css
:root {
  --base: 0 0% 100%;
  --surface-1: 0 0% 98%;
  --surface-2: 0 0% 96%;
  --surface-3: 0 0% 94%;
}

.dark {
  --base: 220 15% 10%;
  --surface-1: 220 15% 12%;
  --surface-2: 220 15% 14%;
  --surface-3: 220 15% 16%;
}
```

## Border Progression

Avoid harsh borders. Use low-opacity scales:

```css
--border-soft: rgba(0, 0, 0, 0.05);
--border-medium: rgba(0, 0, 0, 0.1);
--border-strong: rgba(0, 0, 0, 0.2);
```

## Inset Inputs

Inputs should feel "cut out" of the surface:

```css
.input-inset {
  background: var(--surface-2);
  border: 1px solid var(--border-soft);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}
```

## Data density (ECU Specific)

For high-density tables (like MAP or Ignition timing):
- Use `font-variant-numeric: tabular-nums`
- Use monospace fonts for alignment
- Padding should be tight: `py-1 px-2`
