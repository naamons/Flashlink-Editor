/**
 * HeatmapUtils.ts
 * Pure utility functions for computing heatmap colors in the ECU tuning grid.
 */

export type HeatmapMode = 'thermal' | 'blue-red' | 'green-only';

/**
 * Returns a CSS background-color string for a value within [min, max].
 * mode='thermal'  : blue → cyan → green → yellow → red (full spectrum)
 * mode='blue-red' : blue → red (legacy)
 * mode='green-only': dark-green → bright-green
 */
export function getHeatColor(
  value: number,
  min: number,
  max: number,
  mode: HeatmapMode = 'thermal',
): string {
  if (min === max) return 'hsl(220, 15%, 18%)';
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));

  switch (mode) {
    case 'thermal': {
      // 5-stop gradient: navy → blue → cyan → green → yellow → red
      const stops: [number, number, number][] = [
        [220, 80, 20],   // t=0 deep blue
        [200, 85, 35],   // t=0.25 cyan-blue
        [145, 70, 32],   // t=0.5  green
        [45,  85, 38],   // t=0.75 amber
        [0,   80, 42],   // t=1    red
      ];
      const idx = t * (stops.length - 1);
      const lo  = Math.floor(idx);
      const hi  = Math.min(stops.length - 1, lo + 1);
      const frac = idx - lo;
      const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
      const [h, s, l] = [
        lerp(stops[lo][0], stops[hi][0], frac),
        lerp(stops[lo][1], stops[hi][1], frac),
        lerp(stops[lo][2], stops[hi][2], frac),
      ];
      return `hsl(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%)`;
    }
    case 'blue-red': {
      const hue = (1 - t) * 240;
      return `hsl(${hue.toFixed(0)}, 80%, 32%)`;
    }
    case 'green-only': {
      const l = 18 + t * 24;
      const s = 55 + t * 25;
      return `hsl(140, ${s.toFixed(0)}%, ${l.toFixed(0)}%)`;
    }
    default:
      return 'hsl(220, 15%, 18%)';
  }
}

/**
 * Returns a foreground text color (light vs dark) for the given background luminance.
 * Currently always returns white for dark grid cells.
 */
export function getHeatTextColor(_t: number): string {
  return '#f4f4f5';
}
