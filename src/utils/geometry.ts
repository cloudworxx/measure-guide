import { Point, Units } from "../types";

export const distPx = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

export const midPoint = (a: Point, b: Point) => ({ 
  x: (a.x + b.x) / 2, 
  y: (a.y + b.y) / 2 
});

export function metersToUnit(m: number, unit: Units) {
  switch (unit) {
    case "mm": return m * 1000;
    case "cm": return m * 100;
    case "m": default: return m;
  }
}

export function unitToMeters(val: number, unit: Units) {
  switch (unit) {
    case "mm": return val / 1000;
    case "cm": return val / 100;
    case "m": default: return val;
  }
}

export function formatLength(m: number, unit: Units) {
  const v = metersToUnit(m, unit);
  return `${v.toFixed(2)} ${unit}`;
}

export function areaLabel(m2: number, unit: Units) {
  // convert by linear dimension, then square it
  const linear = metersToUnit(1, unit); // factor
  const v = m2 * (linear * linear);
  const suffix = unit === "m" ? "m²" : unit === "cm" ? "cm²" : "mm²";
  return `${v.toFixed(2)} ${suffix}`;
}

export function uid(prefix = "id") { 
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

// Helpers for color alpha
export function colorToAlpha(hex: string, alpha: number) {
  // hex #rrggbb
  const c = hex.replace('#','');
  const r = parseInt(c.substring(0,2),16);
  const g = parseInt(c.substring(2,4),16);
  const b = parseInt(c.substring(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function fillToColor(fill: string) {
  // naive: extract rgb -> hex
  const m = fill.match(/rgba?\((\d+),(\d+),(\d+)/);
  if (!m) return "#00a3ff";
  const r = Number(m[1]).toString(16).padStart(2,'0');
  const g = Number(m[2]).toString(16).padStart(2,'0');
  const b = Number(m[3]).toString(16).padStart(2,'0');
  return `#${r}${g}${b}`;
}
