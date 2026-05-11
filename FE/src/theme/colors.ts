/**
 * Single source of truth for all colors and gradients.
 * Used for non-CSS usage (e.g. charts) and as reference for @theme in index.css.
 * All names are descriptive (no brand names).
 */

/** Palette A: dark, neutral, midnight, mint, amber */
export const jenny = {
  dark: '#2a2a2a',
  cream: '#f7f7f7',
  slate: '#191970',
  green: '#2ea857',
  amber: '#ffb114',
} as const

/** Palette B: ink, midnight, purple, lavender, blue */
export const purple = {
  ink: '#2a2a2a',
  indigoDeep: '#191970',
  violet: '#9400d3',
  lavender: '#e1e1ff',
  indigo: '#85b8fd',
} as const

/** Palette C: surface-light, lavender, purple, blue, midnight, midnight-deep */
export const atlitude = {
  surfaceLight: '#ffffff',
  pinkLight: '#e1e1ff',
  violet: '#9400d3',
  blue: '#85b8fd',
  blueDeep: '#191970',
  indigoDeep: '#191970',
} as const

/** Palette D: surface-alt, lavender, surface-muted, blue, purple, dark */
export const mindful = {
  surfaceAlt: '#f7f7f7',
  grayLight: '#e1e1ff',
  surfaceMuted: '#ffffff',
  indigo: '#85b8fd',
  violetDeep: '#9400d3',
  dark: '#2a2a2a',
} as const

export const palettes = { jenny, purple, atlitude, mindful } as const

/** Palette C gradients (linear, top to bottom) */
export const gradientsAtlitude = {
  gradient1: `linear-gradient(in oklch to bottom, ${atlitude.surfaceLight}, ${atlitude.violet})`,
  gradient2: `linear-gradient(in oklch to bottom, ${atlitude.pinkLight}, ${atlitude.violet}, ${atlitude.blue})`,
  gradient3: `linear-gradient(in oklch to bottom, ${atlitude.violet}, ${atlitude.blue}, ${atlitude.blueDeep})`,
  gradient4: `linear-gradient(in oklch to bottom, ${atlitude.blue}, ${atlitude.blueDeep}, ${atlitude.indigoDeep})`,
} as const

/** Palette D gradients */
export const gradientsMindful = {
  gradient01: `linear-gradient(in oklch to bottom, ${mindful.surfaceAlt}, ${mindful.surfaceMuted})`,
  gradient02: `linear-gradient(in oklch to bottom, ${mindful.grayLight}, ${mindful.surfaceMuted})`,
  gradient03: `linear-gradient(in oklch to bottom, ${mindful.grayLight}, ${mindful.indigo})`,
  gradient04: `linear-gradient(in oklch to bottom, ${mindful.surfaceMuted}, ${mindful.indigo}, ${mindful.dark})`,
  gradient05: `linear-gradient(in oklch to bottom, ${mindful.violetDeep}, ${mindful.dark})`,
} as const

export const gradients = { atlitude: gradientsAtlitude, mindful: gradientsMindful } as const

/** Brand gradient (logo/text): violet → blue */
export const gradientBrand = `linear-gradient(in oklch to right, ${atlitude.violet}, ${atlitude.blue})`

/**
 * Semantic colors: used by the app for backgrounds, text, buttons, etc.
 */
export const semantic = {
  primary: atlitude.blue,
  primaryHover: purple.indigoDeep,
  accent: atlitude.blue,
  accentMuted: atlitude.surfaceLight,
  surface: atlitude.surfaceLight,
  background: '#f7f7f7',
  highlight: jenny.amber,
  highlightHover: '#ffc757',
  success: jenny.green,
  warning: '#ffc757',
  error: '#ff5c1c',
  border: 'rgba(25, 25, 112, 0.18)',
  primaryForeground: '#0f172a',
} as const

export const gradientsExtra = {
  sunset: `linear-gradient(in oklch to right, ${jenny.amber}, ${semantic.error})`,
  ocean: `linear-gradient(in oklch to right, ${atlitude.blue}, ${semantic.success})`,
  twilight: `linear-gradient(in oklch to right, ${purple.indigoDeep}, ${atlitude.violet}, ${atlitude.pinkLight})`,
  frost: `linear-gradient(in oklch to right, ${atlitude.surfaceLight}, ${purple.lavender}, ${purple.indigo})`,
  ember: `linear-gradient(in oklch to right, ${jenny.amber}, ${semantic.error}, ${purple.indigoDeep})`,
} as const

export type SemanticColorKey = keyof typeof semantic

export function getSemanticColor(name: SemanticColorKey): string {
  return semantic[name]
}
