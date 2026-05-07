/**
 * Shared study-focused palette used across debug + study UI.
 * Keep colors driven by CSS tokens so the theme switch remains safe.
 */
export const CHART_COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-error)',
  'var(--color-accent)',
  'var(--color-highlight)',
] as const

export const STUDY_FOCUS_COLOR = 'var(--color-focus-area)' as const

