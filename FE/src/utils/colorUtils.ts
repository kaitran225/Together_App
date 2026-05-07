/**
 * Color utilities for the color detail page: hex/RGB/HSL conversion and variant generation.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Hsl {
  h: number
  s: number
  l: number
}

export interface ColorVariant {
  hex: string
  rgb: Rgb
  usage?: string
}

const USAGE_HINTS = [
  'Background',
  'Surface alt',
  'Border / divider',
  'Muted text',
  'Body text',
  'Primary (mid)',
  'Primary hover',
  'Button / CTA',
  'Text on light',
  'Text / dark',
]

/** Normalize hex to #RRGGBB (3 or 6 digits). */
function normalizeHex(hex: string): string | null {
  const cleaned = hex.replace(/^#/, '').trim()
  if (/^[0-9A-Fa-f]{6}$/.test(cleaned)) return '#' + cleaned
  if (/^[0-9A-Fa-f]{3}$/.test(cleaned)) {
    const r = cleaned[0] + cleaned[0]
    const g = cleaned[1] + cleaned[1]
    const b = cleaned[2] + cleaned[2]
    return '#' + r + g + b
  }
  return null
}

export function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeHex(hex)
  if (!normalized) return null
  const n = parseInt(normalized.slice(1), 16)
  return {
    r: (n >> 16) & 0xff,
    g: (n >> 8) & 0xff,
    b: n & 0xff,
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')
  return '#' + toHex(r) + toHex(g) + toHex(b)
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      default:
        h = ((r - g) / d + 4) / 6
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  h = h / 360
  s = s / 100
  l = l / 100
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return { r: r * 255, g: g * 255, b: b * 255 }
}

export function hexToHsl(hex: string): Hsl | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return rgbToHsl(rgb.r, rgb.g, rgb.b)
}

/** Hue family for grouping palettes. Order for display: neutral, red, orange, yellow, green, cyan, blue, purple, pink. */
export type HueFamily =
  | 'neutral' | 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'pink'

export const HUE_FAMILY_ORDER: HueFamily[] = [
  'neutral', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink',
]

export function getHueFamily(hex: string): HueFamily {
  const hsl = hexToHsl(hex)
  if (!hsl) return 'neutral'
  const { h, s, l } = hsl
  if (s < 12 || l >= 98 || l <= 5) return 'neutral'
  if (h < 15 || h >= 345) return 'red'
  if (h >= 15 && h < 45) return 'orange'
  if (h >= 45 && h < 70) return 'yellow'
  if (h >= 70 && h < 160) return 'green'
  if (h >= 160 && h < 195) return 'cyan'
  if (h >= 195 && h < 255) return 'blue'
  if (h >= 255 && h < 330) return 'purple'
  if (h >= 330 && h < 345) return 'pink'
  return 'neutral'
}

export function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

/**
 * Generate N color variants from a base hex by varying lightness (HSL) from light to dark.
 * H and S are fixed from the base color; L steps from 95% down to 5%.
 */
export function generateVariants(baseHex: string, count: number): ColorVariant[] {
  const hsl = hexToHsl(baseHex)
  if (!hsl) return []
  const result: ColorVariant[] = []
  const minL = 5
  const maxL = 95
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const l = maxL - t * (maxL - minL)
    const hex = hslToHex(hsl.h, hsl.s, l)
    const rgb = hexToRgb(hex)!
    result.push({
      hex,
      rgb,
      usage: USAGE_HINTS[i % USAGE_HINTS.length],
    })
  }
  return result
}

/** Format RGB for display. */
export function formatRgb(rgb: Rgb): string {
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`
}

/** Relative luminance (0–1). Use to choose text color on background. */
function relativeLuminance(rgb: Rgb): number {
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const x = c / 255
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/** Return 'white' or 'black' for readable text on the given hex background. */
export function textColorOn(hex: string): 'white' | 'black' {
  const rgb = hexToRgb(hex)
  if (!rgb) return 'black'
  return relativeLuminance(rgb) > 0.4 ? 'black' : 'white'
}

/**
 * Parse a CSS color value to #RRGGBB. Supports #hex, rgb(r,g,b), rgba(r,g,b,a).
 * For rgba, blends onto white and returns opaque hex so you can copy a single hex to remove/replace.
 */
export function cssColorToHex(cssValue: string): string | null {
  const v = cssValue.trim()
  if (!v) return null
  const hexNorm = normalizeHex(v)
  if (hexNorm) return hexNorm
  const rgbMatch = v.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)/)
  if (rgbMatch) {
    let r = Number(rgbMatch[1])
    let g = Number(rgbMatch[2])
    let b = Number(rgbMatch[3])
    const a = v.includes('rgba') ? parseFloat(v.replace(/^.*,\s*([\d.]+)\s*\)/, '$1')) : 1
    if (a < 1) {
      r = Math.round(r * a + 255 * (1 - a))
      g = Math.round(g * a + 255 * (1 - a))
      b = Math.round(b * a + 255 * (1 - a))
    }
    return rgbToHex(r, g, b)
  }
  return null
}
