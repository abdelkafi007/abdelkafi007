// scripts/theme.mjs
// Design tokens and helpers for abdelkafi007 GitHub profile README assets.
// Matches personal portfolio aesthetic at https://abdelkafi-oumnih.vercel.app

export const tokens = {
  colors: {
    bgDeep: '#0b0c0f',       // page / panel base
    surface: '#12141a',      // titlebars, chips
    surface2: '#0d0f13',     // terminal body
    border: '#23262e',       // standard divider & panel stroke
    borderStrong: '#2a2e38', // prominent card borders, titlebar dots
    text: '#e6e8ec',         // primary body text, terminal commands
    textBright: '#f2f4f7',   // titles, metric values, headline
    muted: '#8b909a',        // labels, prompt punctuation, timestamps
    muted2: '#aab0ba',       // sublabels, descriptions, secondary chips
    accent: '#3ddc84',       // green; ONLY accent: status dots, LEDs, cursor
    cardBg: '#0f1115',       // project card background
    rackBody: '#14161c',     // server rack front face
    rackSide: '#0e1014',     // server rack side perspective
    rackTop: '#1a1d25',      // server rack top perspective
    rackUnit: '#0f1115',     // individual rack unit slot
  },
  type: {
    name: 28,
    cardTitle: 15,
    subtitle: 13,
    bodyMono: 12,
    chipLabel: 11,
    microCaps: 10,
  },
  spacing: {
    grid: 8,
    panelPadding: 24,
  },
  radii: {
    panel: 12,
    card: 12,
    chip: 6,
    button: 8,
    small: 4,
  },
  stroke: 1,
  fonts: {
    mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
    sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
};

export const colors = tokens.colors;
export const type = tokens.type;
export const spacing = tokens.spacing;
export const radii = tokens.radii;
export const fonts = tokens.fonts;

/**
 * Escapes characters for safe inclusion in XML / SVG text nodes.
 * @param {string|number} str
 * @returns {string}
 */
export function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Computes estimated width of a monospace chip pill.
 * @param {string} text - The chip label text
 * @param {number} padding - Horizontal padding on each side in px (default 12)
 * @param {number} charWidth - Approximate width per monospace character in px (default 6.6)
 * @returns {number}
 */
export function chipWidth(text, padding = 12, charWidth = 6.6) {
  return Math.round(String(text).length * charWidth + padding * 2);
}

/**
 * Seeded 32-bit pseudo-random number generator (mulberry32).
 * Returns a function that outputs deterministic floats in [0, 1).
 * @param {number} seed
 * @returns {() => number}
 */
export function mulberry32(seed) {
  return function() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
