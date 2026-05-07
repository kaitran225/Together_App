/**
 * Single source of truth for all colors and gradients.
 * Used for non-CSS usage (e.g. charts) and as reference for @theme in index.css.
 * All names are descriptive (no brand names).
 */

/** Palette A: dark, cream, slate, green, amber */
export const jenny = {
  dark: '#171717',
  cream: '#FCF3E3',
  slate: '#64748b',
  green: '#708C69',
  amber: '#F8A258',
} as const

/** Palette B: ink, indigo-deep, violet, lavender, indigo */
export const purple = {
  ink: '#171717',
  indigoDeep: '#4c1d95',
  violet: '#7546E8',
  lavender: '#C8B3F6',
  indigo: '#6366f1',
} as const

/** Palette C: surface-light, pink-light, violet, blue, blue-deep, indigo-deep */
export const atlitude = {
  surfaceLight: '#fafafa',
  pinkLight: '#FFCCF2',
  violet: '#977DFF',
  blue: '#0033FF',
  blueDeep: '#0600AB',
  indigoDeep: '#4c1d95',
} as const

/** Palette D: surface-alt, gray-light, surface-muted, indigo, violet-deep, dark */
export const mindful = {
  surfaceAlt: '#fafafa',
  grayLight: '#ececec',
  surfaceMuted: '#fafafa',
  indigo: '#6366f1',
  violetDeep: '#463699',
  dark: '#171717',
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
  primary: atlitude.violet,
  primaryHover: purple.indigoDeep,
  accent: atlitude.blue,
  accentMuted: atlitude.surfaceLight,
  surface: atlitude.surfaceLight,
  background: '#fafafa',
  highlight: jenny.amber,
  highlightHover: '#ea580c',
  success: '#059669',
  warning: '#ea580c',
  error: '#b91c1c',
  border: '#d4d4d4',
  primaryForeground: '#ffffff',
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
