import { useMemo, useState } from 'react'
import {
  AiBotIcon,
  AttachIcon,
  Badge,
  BellIcon,
  Breadcrumbs,
  Button,
  CalendarIcon,
  Card,
  ChatInputBar,
  CheckIcon,
  CloseIcon,
  DocumentIcon,
  MenuIcon,
  Modal,
  Input,
  Progress,
  SearchIcon,
  Select,
  SettingsIcon,
  StarIcon,
  Textarea,
  UserIcon,
} from '../components/common'
import { semantic } from '../theme/colors'
import { textColorOn, getHueFamily, HUE_FAMILY_ORDER, hexToHsl } from '../utils/colorUtils'
import { getCalendarDays, isSameDay, toDateKey } from '../utils/calendarUtils'
import { WEEKDAYS, buildFakeEvents, EVENT_STYLES } from '../mocks'
import { ThemeSwitch } from '../components/ThemeSwitch'
import { CHART_COLORS } from '../theme/studyPalette'

/* ─── Types ─── */
type ColorItem = { id: string; name: string; hex: string }

/* ─── Helpers ─── */
function normalizeHexForKey(hex: string): string {
  const h = hex.replace(/^#/, '').trim().toLowerCase()
  return h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h
}

/* ─── Palette data (only neutrals + semantic kept) ─── */
const NEUTRALS: { name: string; hex: string }[] = [
  { name: 'neutral-50', hex: '#fafafa' }, { name: 'neutral-100', hex: '#ececec' },
  { name: 'neutral-200', hex: '#d4d4d4' }, { name: 'neutral-300', hex: '#a3a3a3' },
  { name: 'neutral-400', hex: '#a3a3a3' }, { name: 'neutral-500', hex: '#737373' },
  { name: 'neutral-600', hex: '#525252' }, { name: 'neutral-700', hex: '#404040' },
  { name: 'neutral-800', hex: '#262626' }, { name: 'neutral-900', hex: '#171717' },
]

const SYSTEM_GREYS: { name: string; hex: string }[] = [
  { name: 'Pale Grey', hex: '#F4F6F9' },
  { name: 'Neutral Grey', hex: '#F8F8F9' },
  { name: 'Hover Grey', hex: '#F4F3FF' },
]

const ALERT_COLORS: { name: string; hex: string }[] = [
  { name: 'Static Blue', hex: '#5B93FF' },
  { name: 'Heart Rythm', hex: '#FF5555' },
  { name: 'Successful', hex: '#51CC56' },
]

const BRAND_COLORS = [
  { name: 'ashBlack', hex: '#212529' },
  { name: 'corporatePurple', hex: '#8942FE' },
  { name: 'lightYellow', hex: '#FFEBA2' },
] as const

const VIOLET_PALETTE = [
  { name: 'electricPurple', hex: '#b129ff' },
  { name: 'pureWhite', hex: '#ffffff' },
  { name: 'selectiveYellow', hex: '#ffba00' },
] as const

const BRAND_GUIDE_SPECIAL = [
  { name: 'cobalt', hex: '#4C00FF' },
  { name: 'poppy', hex: '#FF5252' },
  { name: 'white', hex: '#FFFFFF' },
] as const

const KEEP_PALETTE = [
  { name: 'pink-2', hex: '#ff1ac4' },
  { name: 'magenta', hex: '#b30085' },
  { name: 'blue-light', hex: '#4f99fc' },
] as const

function getUnifiedColorsByFamily(): Map<string, ColorItem[]> {
  const flat: ColorItem[] = []
  const seenHex = new Set<string>()
  const add = (name: string, hex: string) => {
    const key = normalizeHexForKey(hex)
    if (seenHex.has(key)) return
    seenHex.add(key)
    flat.push({ id: `${name}-${key}`, name, hex: hex.startsWith('#') ? hex : `#${hex}` })
  }
  Object.entries(semantic).forEach(([name, hex]) => add(name, hex))
  NEUTRALS.forEach(({ name, hex }) => add(name, hex))
  SYSTEM_GREYS.forEach(({ name, hex }) => add(name, hex))
  ALERT_COLORS.forEach(({ name, hex }) => add(name, hex))
  BRAND_COLORS.forEach(({ name, hex }) => add(name, hex))
  VIOLET_PALETTE.forEach(({ name, hex }) => add(name, hex))
  BRAND_GUIDE_SPECIAL.forEach(({ name, hex }) => add(name, hex))
  KEEP_PALETTE.forEach(({ name, hex }) => add(name, hex))

  const byFamily = new Map<string, ColorItem[]>()
  for (const family of HUE_FAMILY_ORDER) byFamily.set(family, [])
  for (const item of flat) {
    const family = getHueFamily(item.hex)
    const list = byFamily.get(family) ?? []
    list.push(item)
    byFamily.set(family, list)
  }
  byFamily.forEach((list) => {
    list.sort((a, b) => {
      const lA = hexToHsl(a.hex)?.l ?? 0
      const lB = hexToHsl(b.hex)?.l ?? 0
      return lB - lA
    })
  })
  return byFamily
}

const GRADIENT_NAMES = [
  'gradient-brand', 'gradient-atlitude-1', 'gradient-atlitude-2', 'gradient-atlitude-3', 'gradient-atlitude-4',
  'gradient-mindful-01', 'gradient-mindful-02', 'gradient-mindful-03', 'gradient-mindful-04', 'gradient-mindful-05',
] as const

/* ─── Small sub-components ─── */
function BigColorTile({ hex, name }: { hex: string; name: string }) {
  const tc = textColorOn(hex)
  const isLight = tc === 'black'
  return (
    <div
      className="relative min-h-[140px] sm:min-h-[160px] rounded-xl border-2 border-[var(--color-charcoal)] overflow-hidden shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
      style={{ backgroundColor: hex }}
    >
      <div className={`absolute inset-x-0 bottom-0 p-3 sm:p-4 ${isLight ? 'bg-black/20' : 'bg-white/20'} backdrop-blur-sm`}>
        <p className={`text-sm sm:text-base font-bold truncate ${isLight ? 'text-neutral-900' : 'text-white'} drop-shadow-sm`}>{name}</p>
        <p className={`text-xs sm:text-sm font-mono font-semibold mt-0.5 ${isLight ? 'text-neutral-800' : 'text-white/95'}`}>{hex}</p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); void navigator.clipboard.writeText(hex) }}
          className={`mt-2 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border-2 transition-colors ${isLight ? 'border-neutral-800 text-neutral-900 bg-white/90 hover:bg-white' : 'border-white text-white hover:bg-white/20'} dark:border-[var(--color-charcoal)] dark:bg-[var(--color-surface)] dark:text-neutral-900 dark:hover:bg-neutral-200`}
        >
          Copy hex
        </button>
      </div>
    </div>
  )
}

function SectionHeading({ id, title, description }: { id: string; title: string; description?: string }) {
  return (
    <section id={id} className="scroll-mt-6 sm:scroll-mt-8">
      <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-900 mb-1">{title}</h2>
      {description && <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-500 mb-3 sm:mb-4">{description}</p>}
    </section>
  )
}

/* ─── Main Page ─── */
export default function DebugComponents() {
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [chatDialogOpen, setChatDialogOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [chatValue, setChatValue] = useState('')
  const [demoTabIndex, setDemoTabIndex] = useState(0)
  const [accordionOpen, setAccordionOpen] = useState<number | null>(0)
  const [currentStep, setCurrentStep] = useState(1)
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date())
  const calendarDays = useMemo(() => getCalendarDays(calendarViewDate.getFullYear(), calendarViewDate.getMonth()), [calendarViewDate.getFullYear(), calendarViewDate.getMonth()])
  const today = useMemo(() => new Date(), [])
  const fakeEvents = useMemo(buildFakeEvents, [])
  const unifiedByFamily = useMemo(() => getUnifiedColorsByFamily(), [])

  return (
    <div className="min-h-screen bg-background w-full p-4 sm:p-6 lg:p-8 xl:p-10 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto space-y-8 sm:space-y-10 md:space-y-12">
        {/* ════════════════════════════════════════════════════════════
            1. LOGO & BRANDMARKS
        ════════════════════════════════════════════════════════════ */}
        <section id="logo-brandmarks" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Logo & Brandmarks" description="Single brandmarks, logo variants, and app icon sizes from the KTR design system." />
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Single Brandmarks</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
              {['Motivation', 'Unity', 'Activity', 'Strength', 'Health', 'Rising', 'Harmony', 'Interaction', 'Healing'].map((name) => (
                <div key={name} className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <span className="text-2xl text-primary">&#10038;</span>
                  </div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-900">{name}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Logo</h3>
            <div className="flex flex-wrap gap-6 items-center">
              <span className="text-2xl font-bold text-primary tracking-tight">KTR</span>
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-900 tracking-tight">KTR</span>
              <span className="text-2xl font-bold text-primary tracking-tight">KTR</span>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">App Icon Sizes</h3>
            <div className="flex flex-wrap gap-6 items-end">
              {[{ size: 20, label: 'Notifications' }, { size: 30, label: 'Settings' }, { size: 40, label: 'Spotlight' }, { size: 60, label: 'Default' }, { size: 84, label: 'Large' }].map(({ size, label }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className="rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center" style={{ width: size, height: size }}>
                    <span className="text-primary" style={{ fontSize: size * 0.4 }}>&#10038;</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-500">{size}px</span>
                  <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-600">{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            2. TYPOGRAPHY
        ════════════════════════════════════════════════════════════ */}
        <section id="typography" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Typography" description="Font family: Aeonik. 8pt baseline grid. Type scale with specs." />
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-6">Titles & Headlines</h3>
            <div className="space-y-6">
              {([
                { label: 'Title H1', size: '72px', weight: 'Bold', lh: '100%', ls: '-2%', className: 'text-[72px] font-bold leading-none tracking-tighter' },
                { label: 'Headline H2', size: '56px', weight: 'Bold', lh: '100%', ls: '-2%', className: 'text-[56px] font-bold leading-none tracking-tighter' },
                { label: 'Headline H3', size: '48px', weight: 'Bold', lh: '100%', ls: '0', className: 'text-[48px] font-bold leading-none' },
                { label: 'Headline H4', size: '32px', weight: 'Bold', lh: '100%', ls: '0', className: 'text-[32px] font-bold leading-none' },
                { label: 'Headline H5', size: '32px', weight: 'Medium', lh: '100%', ls: '0', className: 'text-[32px] font-medium leading-none' },
              ] as const).map((item) => (
                <div key={item.label} className="flex items-baseline gap-6 pb-4 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
                  <div className="shrink-0 w-28">
                    <p className="text-xs font-bold text-neutral-500 dark:text-neutral-500">{item.label}</p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">Size: {item.size}<br/>Weight: {item.weight}<br/>LH: {item.lh}<br/>LS: {item.ls}</p>
                  </div>
                  <p className={`text-neutral-900 dark:text-neutral-900 ${item.className}`}>Cardiac Rehab</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-6">Paragraphs & Body</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500">Pre-title</p>
                {(['Bold', 'Medium', 'Regular', 'Light'] as const).map((w) => (
                  <div key={w} className="flex items-center gap-4">
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 w-14 shrink-0">14px {w}</span>
                    <p className={`text-sm text-neutral-900 dark:text-neutral-900 ${w === 'Bold' ? 'font-bold' : w === 'Medium' ? 'font-medium' : w === 'Light' ? 'font-light' : 'font-normal'}`}>Cardiac Rehab</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500">Subtitle</p>
                {(['Bold', 'Medium', 'Regular'] as const).map((w) => (
                  <div key={w} className="flex items-center gap-4">
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 w-14 shrink-0">24px {w}</span>
                    <p className={`text-2xl text-neutral-900 dark:text-neutral-900 ${w === 'Bold' ? 'font-bold' : w === 'Medium' ? 'font-medium' : 'font-normal'}`}>Cardiac Rehab</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500">Body text</p>
                {(['Bold', 'Medium', 'Regular'] as const).map((w) => (
                  <div key={w} className="flex items-center gap-4">
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 w-14 shrink-0">12px {w}</span>
                    <p className={`text-xs text-neutral-900 dark:text-neutral-900 ${w === 'Bold' ? 'font-bold' : w === 'Medium' ? 'font-medium' : 'font-normal'}`}>Cardiac Rehab</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500">Small text</p>
                {(['Bold', 'Medium', 'Regular'] as const).map((w) => (
                  <div key={w} className="flex items-center gap-4">
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 w-14 shrink-0">11px {w}</span>
                    <p className={`text-[11px] text-neutral-900 dark:text-neutral-900 ${w === 'Bold' ? 'font-bold' : w === 'Medium' ? 'font-medium' : 'font-normal'}`}>Cardiac Rehab</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Text Styles</h3>
            <div className="flex flex-wrap gap-6">
              {[
                { label: 'Button text', className: 'text-sm font-medium uppercase tracking-wide' },
                { label: 'Caption', className: 'text-[10px] text-neutral-500 dark:text-neutral-500' },
                { label: 'Label (study)', className: 'label-study' },
                { label: 'Link', className: 'text-sm text-primary underline' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-1">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{s.label}</span>
                  <p className={`text-neutral-900 dark:text-neutral-900 ${s.className}`}>Sample</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            3. COLORS & THEME TOKENS
        ════════════════════════════════════════════════════════════ */}
        <section id="colors-tokens" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Theme Tokens — All Colors by Hue" description="Full palette by hue family. Big, vibrant swatches; copy hex from each tile." />

          {/* All colors by hue — big and vibrant only */}
          <Card className="w-full p-4 sm:p-6">
            <div className="space-y-10">
              {HUE_FAMILY_ORDER.map((family) => {
                const raw = unifiedByFamily.get(family) ?? []
                const items = family === 'neutral' ? raw.slice(0, 18) : raw
                if (items.length === 0) return null
                const label = family.charAt(0).toUpperCase() + family.slice(1)
                return (
                  <div key={family}>
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-900">{label}</h3>
                      <span className="text-sm font-semibold text-primary dark:text-neutral-600">{items.length} colors</span>
                      <div className="flex-1 h-px bg-[var(--color-charcoal)]" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                      {items.map((item) => (
                        <BigColorTile key={item.id} hex={item.hex} name={item.name} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* 10 Background gradients */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-3">Background Gradients (10)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {GRADIENT_NAMES.map((name) => (
                <div key={name} className="flex flex-col gap-2 transition-transform duration-200 hover:scale-[1.02]">
                  <div className="h-16 rounded-lg border border-[var(--color-charcoal)] transition-shadow duration-200 hover:shadow-md" style={{ background: `var(--${name})` }} />
                  <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-500 truncate">{name}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-500 mt-2">Flat brand: <code className="bg-[var(--color-charcoal)] px-1 rounded">bg-primary</code> / solid tokens.</p>
          </Card>

          {/* 10 Shadow variants */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-3">Shadow Variants (10)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <div key={n} className="rounded-lg border border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] p-4 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]" style={{ boxShadow: `var(--shadow-${n})` }}>
                  <span className="text-xs font-bold">shadow-{n}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            4. ELEVATION
        ════════════════════════════════════════════════════════════ */}
        <section id="elevation" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Elevation" description="Shadow depth levels: Default, Active, and Floating." />
          <Card>
            <div className="flex flex-wrap gap-8 justify-center py-4">
              {([
                { label: 'Default', shadow: 'shadow-none border border-[var(--color-charcoal)]' },
                { label: 'Active', shadow: 'shadow-md border border-[var(--color-charcoal)]' },
                { label: 'Floating', shadow: 'shadow-xl border border-[var(--color-charcoal)]' },
              ] as const).map((e) => (
                <div key={e.label} className={`w-40 h-28 rounded-xl bg-white dark:bg-[var(--color-surface)] flex items-center justify-center transition-shadow duration-200 ${e.shadow}`}>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-600">{e.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            ANIMATION & EFFECTS
        ════════════════════════════════════════════════════════════ */}
        <section id="animation-effects" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Animation & Effects" description="Transitions, hover, focus, active states, and utility animations." />
          <Card>
            {/* Hover & active */}
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-3">Hover & active</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-3">Hover and click the blocks below to see transitions.</p>
            <div className="flex flex-wrap gap-4">
              <button type="button" className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.97] active:shadow-sm">
                Button press
              </button>
              <button type="button" className="w-32 h-24 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-medium text-neutral-700 dark:text-neutral-600 transition-all duration-200 hover:bg-primary/20 hover:shadow-lg hover:scale-105 active:scale-100 active:bg-primary/30 active:shadow-sm">
                Hover me
              </button>
              <button type="button" className="w-32 h-24 rounded-xl border-2 border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] flex items-center justify-center text-sm font-medium text-neutral-700 dark:text-neutral-600 transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-5)] active:translate-y-0 active:shadow-[var(--shadow-2)]">
                Lift & press
              </button>
              <button type="button" className="w-32 h-24 rounded-xl bg-success/10 border border-success/30 flex items-center justify-center text-sm font-medium text-success transition-all duration-200 hover:bg-success/20 hover:border-success/50 active:scale-95 active:bg-success/30">
                Active (press)
              </button>
            </div>

            {/* Transitions */}
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-8 mb-3">Transitions</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-3">Utility classes: <code className="text-xs bg-neutral-100 dark:bg-[var(--color-surface)] px-1.5 py-0.5 rounded">transition-colors</code>, <code className="text-xs bg-neutral-100 dark:bg-[var(--color-surface)] px-1.5 py-0.5 rounded">transition-shadow</code>, <code className="text-xs bg-neutral-100 dark:bg-[var(--color-surface)] px-1.5 py-0.5 rounded">transition-transform</code>, <code className="text-xs bg-neutral-100 dark:bg-[var(--color-surface)] px-1.5 py-0.5 rounded">duration-150</code>, <code className="text-xs bg-neutral-100 dark:bg-[var(--color-surface)] px-1.5 py-0.5 rounded">duration-200</code></p>
            <div className="flex flex-wrap gap-3">
              <div className="w-20 h-14 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-medium transition-colors duration-300 hover:bg-primary hover:text-white">color</div>
              <div className="w-20 h-14 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-medium transition-shadow duration-300 hover:shadow-[var(--shadow-6)]">shadow</div>
              <div className="w-20 h-14 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-medium transition-transform duration-300 hover:scale-110">scale</div>
              <div className="w-20 h-14 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-medium transition-all duration-300 hover:rotate-6 hover:bg-warning/30">rotate</div>
            </div>

            {/* Focus states */}
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-8 mb-3">Focus states</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-3">Tab to focus: uses <code className="text-xs bg-neutral-100 dark:bg-[var(--color-surface)] px-1.5 py-0.5 rounded">focus-visible:ring-2</code> for keyboard-only focus rings.</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="px-4 py-2 rounded-lg border-2 border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Focus me</button>
              <input type="text" placeholder="Focus input" className="px-3 py-2 rounded-lg border-2 border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
              <a href="#animation-effects" className="px-4 py-2 rounded-lg text-primary underline-offset-2 transition-all duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Focus link</a>
            </div>

            {/* Entry animations */}
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-8 mb-3">Entry animations</h3>
            <div className="flex flex-wrap gap-4">
              <div className="w-24 h-24 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold animate-fade-in">Fade in</div>
              <div className="w-24 h-24 rounded-xl bg-success/20 flex items-center justify-center text-success font-bold animate-slide-up">Slide up</div>
              <div className="w-24 h-24 rounded-xl bg-warning/20 flex items-center justify-center text-warning font-bold animate-scale-in">Scale in</div>
            </div>

            {/* Transition duration & reduced motion */}
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-8 mb-3">Timing & reduced motion</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-500">Buttons/inputs use 150–200ms ease-out. All animations respect <code className="text-xs bg-neutral-100 dark:bg-[var(--color-surface)] px-1.5 py-0.5 rounded">prefers-reduced-motion</code>.</p>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            5. GRID SYSTEM
        ════════════════════════════════════════════════════════════ */}
        <section id="grid" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Grid System" description="12 columns, 80px width, 30px gutter, 100px margin. Canvas: 1440 x 960px." />
          <Card>
            <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-500 mb-3">
              <span>12C</span><span>80W</span><span>30G</span><span>100M</span><span className="ml-auto">1440 x 960px</span>
            </div>
            <div className="grid grid-cols-12 gap-[6px] h-48 rounded-lg overflow-hidden border border-[var(--color-charcoal)] bg-neutral-50 dark:bg-neutral-900 p-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-primary/10 dark:bg-primary/20 rounded-sm h-full" />
              ))}
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            6. SPACING SYSTEM
        ════════════════════════════════════════════════════════════ */}
        <section id="spacing" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Spacing System" description="8pt linear scale for elements, 4pt for icons and small text blocks." />
          <Card>
            <div className="space-y-3">
              {[4, 8, 12, 16, 24, 32, 40].map((px) => (
                <div key={px} className="flex items-center gap-4">
                  <span className="text-xs font-mono text-neutral-500 dark:text-neutral-500 w-10 text-right">{px}</span>
                  <div className="h-4 rounded-sm bg-primary/30 dark:bg-primary/40" style={{ width: px * 4 }} />
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            CALENDAR
        ════════════════════════════════════════════════════════════ */}
        <section id="calendar" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Calendar" description="Month grid with Prev/Next/Today and events. Uses shared calendarUtils and mocks." />
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-900">
                {calendarViewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => setCalendarViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))}>← Prev</Button>
                <Button variant="primary" size="sm" onClick={() => setCalendarViewDate(new Date(today.getFullYear(), today.getMonth()))}>Today</Button>
                <Button variant="secondary" size="sm" onClick={() => setCalendarViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))}>Next →</Button>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--color-charcoal)] overflow-hidden">
              {/* Weekday header */}
              <div className="grid grid-cols-7 border-b border-[var(--color-charcoal)] bg-neutral-100 dark:bg-[var(--color-surface)]">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-2 text-center text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-500">{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 bg-white dark:bg-[var(--color-surface)]">
                {calendarDays.map(({ date, isCurrentMonth }, i) => {
                  const key = toDateKey(date)
                  const isToday = isSameDay(date, today)
                  const events = fakeEvents[key] ?? []
                  return (
                    <div
                      key={i}
                      className={`min-h-[80px] p-1.5 flex flex-col border-r border-b border-neutral-200 dark:border-neutral-700 [&:nth-child(7n)]:border-r-0 transition-colors duration-150 ${!isCurrentMonth ? 'bg-neutral-50 dark:bg-[var(--color-surface)]/50' : 'hover:bg-neutral-100 dark:hover:bg-neutral-200/40'}`}
                    >
                      <span
                        className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-semibold shrink-0 ${isToday
                          ? 'bg-primary text-primary-foreground'
                          : isCurrentMonth
                            ? 'text-neutral-900 dark:text-neutral-900'
                            : 'text-neutral-400 dark:text-neutral-500'
                          }`}
                      >
                        {date.getDate()}
                      </span>
                      <div className="flex flex-col gap-0.5 mt-1 flex-1 min-h-0 overflow-hidden">
                        {events.slice(0, 2).map((ev, j) => (
                          <div
                            key={j}
                            className={`px-1.5 py-0.5 rounded text-[10px] leading-tight truncate ${EVENT_STYLES[ev.type]}`}
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {events.length > 2 && (
                          <span className="text-[9px] text-neutral-500 dark:text-neutral-500 font-medium">+{events.length - 2} more</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-neutral-600 dark:text-neutral-500">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-primary" /> Today
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-highlight" /> Deadline
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-accent-muted border border-accent/20" /> Class
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-success/20 border border-success/30" /> Meeting
              </span>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            CHARTS (color variants)
        ════════════════════════════════════════════════════════════ */}
        <section id="charts" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Charts" description="2×2 grid: each chart in its own card. Theme color variants." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            {/* Bar chart card */}
            <Card>
              <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Bar chart</h3>
              <div className="flex items-end gap-2 h-40">
                {[60, 85, 45, 90, 70, 55].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center h-full">
                    <div className="flex-1 min-h-0 w-full flex flex-col justify-end">
                      <div className="w-full rounded-t min-h-[8px] transition-all duration-300" style={{ height: `${h}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                    <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-500 mt-1">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}</span>
                  </div>
                ))}
              </div>
            </Card>
            {/* Line chart card */}
            <Card>
              <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Line chart</h3>
              <div className="h-40 relative">
                <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <polyline fill="none" stroke="var(--color-primary)" strokeWidth="2" points="0,60 50,45 100,70 150,30 200,50 250,20 300,40" />
                  <polyline fill="none" stroke="var(--color-success)" strokeWidth="2" points="0,70 50,55 100,50 150,60 200,45 250,55 300,35" />
                  <polyline fill="none" stroke="var(--color-warning)" strokeWidth="2" points="0,80 50,65 100,80 150,50 200,70 250,60 300,55" />
                </svg>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-primary" /> A</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-success" /> B</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-warning" /> C</span>
              </div>
            </Card>
            {/* Pie / Donut card */}
            <Card>
              <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Pie / Donut</h3>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative w-28 h-28 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                    {(() => {
                      const C = 2 * Math.PI * 16
                      const pcts = [30, 25, 20, 15, 10]
                      let offset = 0
                      return pcts.map((pct, i) => {
                        const dash = (pct / 100) * C
                        const o = -offset
                        offset += dash
                        return (
                          <circle key={i} cx="18" cy="18" r="16" fill="none" stroke={CHART_COLORS[i]} strokeWidth="4" strokeDasharray={`${dash} ${C}`} strokeDashoffset={o} />
                        )
                      })
                    })()}
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-neutral-900 dark:text-neutral-900">100%</span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  {['Primary', 'Success', 'Warning', 'Error', 'Blue'].map((label, i) => (
                    <span key={label} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: CHART_COLORS[i] }} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
            {/* Pareto chart card */}
            <Card>
              <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Pareto (bars + cumulative %)</h3>
              {(() => {
                const data = [40, 25, 15, 12, 8]
                const labels = ['A', 'B', 'C', 'D', 'E']
                const max = Math.max(...data)
                const total = data.reduce((a, b) => a + b, 0)
                let cumSum = 0
                const cumPcts = data.map((v) => { cumSum += v; return (cumSum / total) * 100 })
                return (
                  <div className="relative h-44">
                    <div className="flex items-end gap-3 h-36">
                      {data.map((v, i) => {
                        const pct = (v / max) * 100
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center h-full">
                            <div className="flex-1 min-h-0 w-full flex flex-col justify-end">
                              <div className="w-full rounded-t min-h-[4px] transition-all duration-300" style={{ height: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            </div>
                            <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-500 mt-1">{labels[i]}</span>
                          </div>
                        )
                      })}
                    </div>
                    <svg className="absolute inset-0 w-full h-36 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <polyline fill="none" stroke="var(--color-charcoal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={cumPcts.map((cp, i) => `${(i + 0.5) * (100 / data.length)},${100 - cp}`).join(' ')} />
                      {cumPcts.map((cp, i) => (
                        <circle key={i} cx={(i + 0.5) * (100 / data.length)} cy={100 - cp} r="2" fill="var(--color-charcoal)" />
                      ))}
                    </svg>
                    <div className="absolute right-0 top-0 h-36 flex flex-col justify-between text-[9px] text-neutral-400 dark:text-neutral-500 -mr-5">
                      <span>100%</span>
                      <span>50%</span>
                      <span>0%</span>
                    </div>
                  </div>
                )
              })()}
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-neutral-600 dark:text-neutral-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS[0] }} /> Bars</span>
                <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 rounded bg-[var(--color-charcoal)]" /> Cumulative %</span>
              </div>
            </Card>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            7. ICONS
        ════════════════════════════════════════════════════════════ */}
        <section id="icons" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Icons" description="Linear stroke icons. Sizes: 16px, 20px, 24px. Use in buttons, nav, and forms." />
          <Card>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {([
                { Icon: AiBotIcon, name: 'AiBotIcon' },
                { Icon: AttachIcon, name: 'AttachIcon' },
                { Icon: BellIcon, name: 'BellIcon' },
                { Icon: CalendarIcon, name: 'CalendarIcon' },
                { Icon: CheckIcon, name: 'CheckIcon' },
                { Icon: CloseIcon, name: 'CloseIcon' },
                { Icon: DocumentIcon, name: 'DocumentIcon' },
                { Icon: MenuIcon, name: 'MenuIcon' },
                { Icon: SearchIcon, name: 'SearchIcon' },
                { Icon: SettingsIcon, name: 'SettingsIcon' },
                { Icon: StarIcon, name: 'StarIcon' },
                { Icon: UserIcon, name: 'UserIcon' },
              ] as const).map(({ Icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-2 sm:gap-3 p-3 rounded-lg border border-[var(--color-charcoal)] transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Icon className="w-4 h-4 text-neutral-700 dark:text-neutral-600 shrink-0" />
                    <Icon className="w-5 h-5 text-neutral-700 dark:text-neutral-600 shrink-0" />
                    <Icon className="w-6 h-6 text-neutral-700 dark:text-neutral-600 shrink-0" />
                  </div>
                  <div className="flex gap-2 sm:gap-3 text-[10px] text-neutral-400 dark:text-neutral-500">
                    <span>16</span><span>20</span><span>24</span>
                  </div>
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-500 text-center break-all">{name}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            8. BUTTONS
        ════════════════════════════════════════════════════════════ */}
        <section id="buttons" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Buttons" description="48px height, 30px h-padding, 1.5px stroke (outlined). Full matrix: Default / With icon / Icon only." />

          {/* Default buttons */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Default</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="pr-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500 w-24" />
                    <th className="px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500">Contained</th>
                    <th className="px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500">Outlined</th>
                    <th className="px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500">Texted</th>
                    <th className="px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500">Split</th>
                  </tr>
                </thead>
                <tbody>
                  {(['Enabled', 'Disabled', 'Hover', 'Pressed', 'Processing'] as const).map((state) => (
                    <tr key={state} className="border-t border-neutral-100 dark:border-neutral-700">
                      <td className="pr-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-500">{state}</td>
                      <td className="px-4 py-3">
                        <button type="button" disabled={state === 'Disabled'} className={`px-[30px] h-12 rounded-lg text-sm font-medium uppercase tracking-wide transition-colors ${state === 'Disabled' ? 'bg-neutral-200 dark:bg-[var(--color-surface)] text-neutral-400 dark:text-neutral-600 cursor-not-allowed dark:border-[var(--color-charcoal)]' : state === 'Pressed' ? 'bg-primary-hover text-primary-foreground' : 'bg-primary text-primary-foreground hover:bg-primary-hover'}`}>
                          {state === 'Processing' ? '⟳ Processing' : state}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" disabled={state === 'Disabled'} className={`px-[30px] h-12 rounded-lg text-sm font-medium uppercase tracking-wide border-[1.5px] transition-colors ${state === 'Disabled' ? 'border-neutral-300 dark:border-[var(--color-charcoal)] text-neutral-400 dark:text-neutral-600 cursor-not-allowed' : state === 'Pressed' ? 'border-primary-hover text-primary-hover bg-primary/10 dark:bg-primary/25 dark:text-primary-foreground' : 'border-primary text-primary hover:bg-primary/10'}`}>
                          {state === 'Processing' ? '⟳ Processing' : state}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" disabled={state === 'Disabled'} className={`px-[30px] h-12 rounded-lg text-sm font-medium uppercase tracking-wide transition-colors ${state === 'Disabled' ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed' : state === 'Pressed' ? 'text-primary-hover bg-primary/10 dark:bg-primary/25 dark:text-primary-foreground' : 'text-primary hover:bg-primary/10'}`}>
                          {state === 'Processing' ? '⟳ Processing' : state}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex rounded-lg overflow-hidden">
                          <button type="button" disabled={state === 'Disabled'} className={`px-4 h-12 text-sm font-medium uppercase tracking-wide transition-colors ${state === 'Disabled' ? 'bg-neutral-200 dark:bg-[var(--color-surface)] text-neutral-400 dark:text-neutral-600 cursor-not-allowed dark:border-[var(--color-charcoal)]' : 'bg-primary text-primary-foreground hover:bg-primary-hover'}`}>
                          {state === 'Processing' ? '⟳' : state}
                          </button>
                          <button type="button" disabled={state === 'Disabled'} className={`px-2 h-12 text-sm border-l border-white/30 dark:border-neutral-600 transition-colors ${state === 'Disabled' ? 'bg-neutral-200 dark:bg-[var(--color-surface)] text-neutral-400 dark:text-neutral-600 cursor-not-allowed dark:border-[var(--color-charcoal)]' : 'bg-primary text-primary-foreground hover:bg-primary-hover'}`}>
                            ▾
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* With icon */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">With Icon</h3>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="inline-flex items-center gap-2 px-[24px] h-12 rounded-lg bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wide"><span>+</span> Enabled</button>
              <button type="button" className="inline-flex items-center gap-2 px-[24px] h-12 rounded-lg border-[1.5px] border-primary text-primary font-medium text-sm uppercase tracking-wide"><span>+</span> Outlined</button>
              <button type="button" className="inline-flex items-center gap-2 px-[24px] h-12 rounded-lg text-primary font-medium text-sm uppercase tracking-wide hover:bg-primary/10"><span>+</span> Texted</button>
              <button type="button" disabled className="inline-flex items-center gap-2 px-[24px] h-12 rounded-lg bg-neutral-200 dark:bg-[var(--color-surface)] text-neutral-400 dark:text-neutral-600 font-medium text-sm uppercase tracking-wide cursor-not-allowed border border-transparent dark:border-[var(--color-charcoal)]"><span>+</span> Disabled</button>
            </div>
          </Card>

          {/* Icon only */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Icon Only</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <button type="button" className="w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-lg">+</button>
              <button type="button" className="w-12 h-12 rounded-lg border-[1.5px] border-primary text-primary flex items-center justify-center text-lg">+</button>
              <button type="button" className="w-12 h-12 rounded-lg text-primary flex items-center justify-center text-lg hover:bg-primary/10">+</button>
              <button type="button" disabled className="w-12 h-12 rounded-lg bg-neutral-200 dark:bg-[var(--color-surface)] text-neutral-400 dark:text-neutral-600 flex items-center justify-center text-lg cursor-not-allowed border border-transparent dark:border-[var(--color-charcoal)]">+</button>
            </div>
          </Card>

          {/* App Button component variants */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">App Button Component</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-2">Variants</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-2">Sizes</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-600 mb-2">Disabled</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" disabled>Primary</Button>
                  <Button variant="secondary" disabled>Secondary</Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            9. CONTROLS
        ════════════════════════════════════════════════════════════ */}
        <section id="controls" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Controls" description="Checkbox, Radio, Switch, and Chips." />
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {/* Checkbox */}
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-3">Checkbox</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-900">
                    <span className="w-5 h-5 rounded border-2 border-border dark:border-neutral-500" />Unselected</label>
                  <label className="flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-900">
                    <span className="w-5 h-5 rounded border-2 border-primary bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">✓</span>Selected</label>
                  <label className="flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-900">
                    <span className="w-5 h-5 rounded border-2 border-primary bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">—</span>Indeterminate</label>
                  <label className="flex items-center gap-2 text-sm text-neutral-400 dark:text-neutral-500">
                    <span className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-600 opacity-50" />Inactive Unselected</label>
                  <label className="flex items-center gap-2 text-sm text-neutral-400 dark:text-neutral-500">
                    <span className="w-5 h-5 rounded border-2 border-primary/50 bg-primary/50 flex items-center justify-center text-primary-foreground/50 text-xs font-bold">✓</span>Inactive Selected</label>
                  <label className="flex items-center gap-2 text-sm text-neutral-400 dark:text-neutral-500">
                    <span className="w-5 h-5 rounded border-2 border-primary/50 bg-primary/50 flex items-center justify-center text-primary-foreground/50 text-xs font-bold">—</span>Inactive Indeterminate</label>
                </div>
              </div>
              {/* Radio */}
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-3">Radio button</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-900">
                    <span className="w-5 h-5 rounded-full border-2 border-border dark:border-neutral-500" />Unselected</label>
                  <label className="flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-900">
                    <span className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center"><span className="w-2.5 h-2.5 rounded-full bg-primary" /></span>Selected</label>
                  <label className="flex items-center gap-2 text-sm text-neutral-400 dark:text-neutral-500">
                    <span className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600 opacity-50" />Inactive Unselected</label>
                  <label className="flex items-center gap-2 text-sm text-neutral-400 dark:text-neutral-500">
                    <span className="w-5 h-5 rounded-full border-2 border-primary/50 flex items-center justify-center"><span className="w-2.5 h-2.5 rounded-full bg-primary/50" /></span>Inactive Selected</label>
                </div>
              </div>
              {/* Switch */}
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-3">Switch</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-900">
                    <span className="w-10 h-6 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center pl-1"><span className="w-4 h-4 rounded-full bg-white" /></span>Inactive</label>
                  <label className="flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-900">
                    <span className="w-10 h-6 rounded-full bg-primary flex items-center justify-end pr-1"><span className="w-4 h-4 rounded-full bg-white" /></span>Active</label>
                  <label className="flex items-center gap-2 text-sm text-neutral-400 dark:text-neutral-500">
                    <span className="w-10 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center pl-1 opacity-50"><span className="w-4 h-4 rounded-full bg-white" /></span>Inactive Disabled</label>
                  <label className="flex items-center gap-2 text-sm text-neutral-400 dark:text-neutral-500">
                    <span className="w-10 h-6 rounded-full bg-primary/50 flex items-center justify-end pr-1 opacity-50"><span className="w-4 h-4 rounded-full bg-white" /></span>Active Disabled</label>
                </div>
              </div>
              {/* Chips */}
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-3">Chips</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium">Primary <span>×</span></span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-success/15 text-success text-xs font-medium">Success <span>×</span></span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-error/15 text-error text-xs font-medium">Error <span>×</span></span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-warning/15 text-warning text-xs font-medium">Warning <span>×</span></span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-200 dark:bg-[var(--color-surface)] text-neutral-400 dark:text-neutral-600 text-xs font-medium border border-transparent dark:border-[var(--color-charcoal)]">Disabled <span>×</span></span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            DATE PICKER & DROPDOWN
        ════════════════════════════════════════════════════════════ */}
        <section id="date-dropdown" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Date Picker & Dropdown" description="Native date input, month/year picker, and dropdown/select controls." />
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Date picker */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Date picker (native)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-500 mb-1.5">Single date</label>
                    <input
                      type="date"
                      className="w-full h-11 px-3 rounded-lg border-2 border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-500 mb-1.5">Date & time</label>
                    <input
                      type="datetime-local"
                      className="w-full h-11 px-3 rounded-lg border-2 border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-500 mb-1.5">Month</label>
                      <select className="w-full h-11 px-3 rounded-lg border-2 border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                          <option key={m} value={i}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-500 mb-1.5">Year</label>
                      <select className="w-full h-11 px-3 rounded-lg border-2 border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                        {[2024, 2025, 2026, 2027, 2028].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              {/* Dropdown / Select */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Dropdown / Select</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-500 mb-1.5">Select component</label>
                    <Select
                      options={[
                        { value: '', label: 'Choose an option...' },
                        { value: 'opt-a', label: 'Option A' },
                        { value: 'opt-b', label: 'Option B' },
                        { value: 'opt-c', label: 'Option C' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-500 mb-1.5">Native select (styled)</label>
                    <select className="w-full h-11 px-3 rounded-lg border-2 border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="">Select an option...</option>
                      <option value="1">Option Alpha</option>
                      <option value="2">Option Beta</option>
                      <option value="3">Option Gamma</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-600 mb-1.5">Disabled select</label>
                    <select disabled className="w-full h-11 px-3 rounded-lg border-2 border-[var(--color-charcoal)] bg-neutral-100 dark:bg-[var(--color-surface)] text-neutral-400 dark:text-neutral-500 cursor-not-allowed">
                      <option>Disabled option</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            10. INPUT FIELDS
        ════════════════════════════════════════════════════════════ */}
        <section id="inputs" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Input Fields" description="56px height, 16px padding. 4 types x 5 states." />
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="pr-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500 text-left w-24" />
                    <th className="px-2 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500 text-left">Textarea</th>
                    <th className="px-2 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500 text-left">Text field</th>
                    <th className="px-2 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500 text-left">Select</th>
                    <th className="px-2 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500 text-left">Multi-select</th>
                  </tr>
                </thead>
                <tbody>
                  {(['Static', 'Filled', 'Disabled', 'Hover', 'Active'] as const).map((state) => (
                    <tr key={state} className="border-t border-neutral-100 dark:border-neutral-700 align-top">
                      <td className="pr-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-600">{state}</td>
                      <td className="px-2 py-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-600">Label{state === 'Static' ? '*' : ''}</span>
                          <textarea disabled={state === 'Disabled'} placeholder="Placeholder" defaultValue={state === 'Filled' ? 'Placeholder' : undefined}
                            className={`w-full min-h-[56px] px-4 py-3 text-sm rounded-lg border bg-white dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900 placeholder:text-neutral-500 dark:placeholder:text-neutral-500 resize-y
                              ${state === 'Disabled' ? 'opacity-90 bg-neutral-100 dark:bg-[var(--color-surface)] border-neutral-200 dark:border-[var(--color-charcoal)] dark:text-neutral-500 dark:placeholder:text-neutral-500' : state === 'Active' ? 'border-primary ring-2 ring-primary/30' : state === 'Hover' ? 'border-neutral-400 dark:border-neutral-500' : 'border-neutral-200 dark:border-neutral-600'}`} />
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-600">Label</span>
                          <input type="text" disabled={state === 'Disabled'} placeholder="Placeholder" defaultValue={state === 'Filled' ? 'Placeholder' : undefined}
                            className={`w-full h-14 px-4 text-sm rounded-lg border bg-white dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900 placeholder:text-neutral-500 dark:placeholder:text-neutral-500
                              ${state === 'Disabled' ? 'opacity-90 bg-neutral-100 dark:bg-[var(--color-surface)] border-neutral-200 dark:border-[var(--color-charcoal)] dark:text-neutral-500 dark:placeholder:text-neutral-500' : state === 'Active' ? 'border-primary ring-2 ring-primary/30' : state === 'Hover' ? 'border-neutral-400 dark:border-neutral-500' : 'border-neutral-200 dark:border-neutral-600'}`} />
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-600">Label</span>
                          <div className={`relative w-full h-14 rounded-lg border bg-white dark:bg-[var(--color-surface)]
                            ${state === 'Disabled' ? 'opacity-90 bg-neutral-100 dark:bg-[var(--color-surface)] border-neutral-200 dark:border-[var(--color-charcoal)] dark:text-neutral-500 dark:placeholder:text-neutral-500' : state === 'Active' ? 'border-primary ring-2 ring-primary/30' : state === 'Hover' ? 'border-neutral-400 dark:border-neutral-500' : 'border-neutral-200 dark:border-neutral-600'}`}>
                            <select disabled={state === 'Disabled'} className="w-full h-full px-4 pr-8 bg-transparent text-sm text-neutral-900 dark:text-neutral-900 appearance-none disabled:dark:text-neutral-500">
                              <option>Placeholder</option>
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-500 pointer-events-none">▾</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-600">Label</span>
                          <div className={`w-full min-h-[56px] px-4 py-3 rounded-lg border bg-white dark:bg-[var(--color-surface)] flex flex-wrap gap-1 items-center
                            ${state === 'Disabled' ? 'opacity-90 bg-neutral-100 dark:bg-[var(--color-surface)] border-neutral-200 dark:border-[var(--color-charcoal)] dark:text-neutral-500 dark:placeholder:text-neutral-500' : state === 'Active' ? 'border-primary ring-2 ring-primary/30' : state === 'Hover' ? 'border-neutral-400 dark:border-neutral-500' : 'border-neutral-200 dark:border-neutral-600'}`}>
                            {state === 'Filled' ? (
                              <>
                                {['Item', 'Item', 'Item'].map((t, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs">{t} <span>×</span></span>
                                ))}
                              </>
                            ) : (
                              <span className="text-sm text-neutral-500 dark:text-neutral-500">Placeholder</span>
                            )}
                            <span className="ml-auto text-neutral-500 dark:text-neutral-500">▾</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
          </Card>

          {/* App Input/Select/Textarea components */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">App Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
              <Input placeholder="Placeholder only" />
              <Input label="With label" placeholder="Placeholder" />
              <Input label="With error" error="This field is required." defaultValue="invalid" />
              <Input label="Disabled" disabled placeholder="Disabled" />
              </div>
              <div className="space-y-4">
                <Select label="Select option" options={[{ value: '', label: 'Choose…' }, { value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]} />
                <Select label="With error" options={[{ value: 'x', label: 'One' }]} error="Please select a value." />
              </div>
              <div className="space-y-4">
                <Textarea placeholder="Placeholder only" />
                <Textarea label="With label" placeholder="Enter description" />
                <Textarea label="With error" error="Description is required." />
              </div>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            11. ERROR & SEARCH
        ════════════════════════════════════════════════════════════ */}
        <section id="errors-search" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Error & Search" description="Error states for inputs. Search bar variants. Status messages." />
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Error States</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 dark:text-neutral-500">Label*</span>
                <input type="text" defaultValue="Placeholder" className="w-full h-14 px-4 text-sm rounded-lg border-2 border-error bg-white dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900" />
                <p className="text-xs text-error flex items-center gap-1"><span className="text-error">●</span> This is a message</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 dark:text-neutral-500">Label</span>
                <div className="relative">
                  <input type="text" defaultValue="Placeholder" className="w-full h-14 px-4 pr-10 text-sm rounded-lg border-2 border-error bg-white dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-error text-white flex items-center justify-center text-xs">!</span>
                </div>
                <p className="text-xs text-error flex items-center gap-1"><span>●</span> This is a message</p>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Search bar & Message</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">⌕</span>
                  <input type="search" placeholder="Search" className="w-full pl-9 pr-8 h-12 rounded-lg border border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 cursor-pointer">×</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">⌕</span>
                  <input type="search" placeholder="Search" defaultValue="Search" className="w-full pl-9 pr-8 h-12 rounded-lg border-2 border-primary bg-white dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900 text-sm focus:outline-none" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 cursor-pointer">×</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">⌕</span>
                  <input type="search" placeholder="Search" className="w-full pl-9 pr-8 h-12 rounded-lg border-2 border-error bg-white dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-error text-white flex items-center justify-center text-xs">!</span>
                </div>
                <div className="relative opacity-50">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">⌕</span>
                  <input type="search" disabled placeholder="Search" className="w-full pl-9 pr-8 h-12 rounded-lg border border-[var(--color-charcoal)] bg-neutral-100 dark:bg-[var(--color-surface)] text-neutral-400 dark:text-neutral-500 text-sm cursor-not-allowed dark:placeholder:text-neutral-500" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-2">Status Messages</p>
                <div className="rounded-lg px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-200 text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-200" /> Disable</div>
                <div className="rounded-lg px-4 py-2.5 bg-success/10 text-success text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> Success</div>
                <div className="rounded-lg px-4 py-2.5 bg-error/10 text-error text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-error" /> Error</div>
                <div className="rounded-lg px-4 py-2.5 bg-warning/10 text-warning text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-warning" /> Warning</div>
              </div>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            12. NAVIGATION
        ════════════════════════════════════════════════════════════ */}
        <section id="navigation" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Navigation" description="Pagination, Slider, Navigation buttons, Tabbar, and Header." />
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Pagination */}
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-3">Pagination</p>
                <div className="space-y-3">
                  {[false, true].map((filled, vi) => (
                    <div key={vi} className="flex items-center gap-1">
                      <button type="button" className="w-8 h-8 rounded text-neutral-500 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm">‹</button>
                      <button type="button" className={`w-8 h-8 rounded text-sm font-medium ${filled ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-primary text-primary-foreground'}`}>1</button>
                      {[2, 3].map((n) => <button key={n} type="button" className="w-8 h-8 rounded text-sm text-neutral-700 dark:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700">{n}</button>)}
                      <span className="text-neutral-400 text-sm px-1">…</span>
                      {[94, 95, 96].map((n) => <button key={n} type="button" className="w-8 h-8 rounded text-sm text-neutral-700 dark:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700">{n}</button>)}
                      <button type="button" className="w-8 h-8 rounded text-neutral-500 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm">›</button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Slider */}
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-3">Slider</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button type="button" className="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-600 flex items-center justify-center">‹</button>
                    <button type="button" className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">›</button>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-8 h-1 rounded-full bg-primary" />
                    <div className="w-8 h-1 rounded-full bg-primary" />
                    <div className="w-8 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-900">01 <span className="text-sm font-normal text-neutral-400">/ 03</span></p>
                </div>
              </div>
              {/* Nav buttons */}
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-3">Navigation buttons</p>
                <div className="flex items-center gap-4">
                  <button type="button" className="w-10 h-10 rounded-lg border border-[var(--color-charcoal)] text-neutral-500 dark:text-neutral-500 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700">‹</button>
                  <button type="button" className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">›</button>
                </div>
              </div>
              {/* Tabbar */}
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-3">Tabbar</p>
                <div className="space-y-3">
                  <div className="inline-flex rounded-full border border-[var(--color-charcoal)] p-1 gap-0">
                    <button type="button" className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/30">Selected Item</button>
                    {['Item', 'Item', 'Item'].map((t, i) => <button key={i} type="button" className="px-4 py-1.5 rounded-full text-neutral-600 dark:text-neutral-500 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700">{t}</button>)}
                  </div>
                  <div className="flex gap-2">
                    {['⊞', '⊟', '☰'].map((icon, i) => (
                      <button key={i} type="button" className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${i === 2 ? 'border-2 border-primary text-primary' : 'text-neutral-500 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}>{icon}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-3">Header</p>
            <div className="flex items-center gap-4 px-4 py-2 rounded-[var(--radius-card)] border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-[var(--color-surface)]/70 backdrop-blur-xl shadow-[var(--shadow-2)]">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-900">Section title</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">Subtitle</p>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">⌕</span>
                <input type="search" placeholder="Search..." className="pl-9 pr-4 h-10 rounded-lg border border-[var(--color-charcoal)] bg-neutral-50 dark:bg-neutral-100 text-sm text-neutral-900 dark:text-neutral-600 w-40" />
              </div>
              <button type="button" className="h-10 px-4 rounded-lg border border-[var(--color-charcoal)] text-sm text-neutral-700 dark:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-1.5">Filter ⊞</button>
              <button type="button" className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Action button</button>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            13. TABLE SYSTEM
        ════════════════════════════════════════════════════════════ */}
        <section id="table" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Table System" description="Row items, column headings, and search filter." />
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Row Item</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="pr-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500 text-left w-28" />
                    <th className="px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500 text-left">Default</th>
                    <th className="px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500 text-left">Hover</th>
                    <th className="px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500 text-left">Active</th>
                    <th className="px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-500 text-left">Static-Selected</th>
                  </tr>
                </thead>
                <tbody>
                  {(['Selectable', 'Inselectable', 'Selectable-1', 'Selectable-2', 'Chip'] as const).map((row) => (
                    <tr key={row} className="border-t border-neutral-100 dark:border-neutral-700">
                      <td className="pr-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-500">{row}</td>
                      {(['default', 'hover', 'active', 'selected'] as const).map((state) => (
                        <td key={state} className="px-4 py-3">
                          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm
                            ${state === 'hover' ? 'bg-primary/5 border-primary/20' : state === 'active' ? 'bg-primary/10 border-primary/30' : state === 'selected' ? 'bg-primary/5 border-primary/20' : 'border-neutral-200 dark:border-neutral-600 bg-white dark:bg-[var(--color-surface)]'}`}>
                            {row !== 'Inselectable' && (
                              <span className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center text-[10px]
                                ${(state === 'active' || state === 'selected') ? 'border-primary bg-primary text-primary-foreground' : 'border-neutral-300 dark:border-neutral-500'}`}>
                                {(state === 'active' || state === 'selected') && '✓'}
                              </span>
                            )}
                            {(row === 'Selectable-1' || row === 'Selectable-2') && <span className="text-neutral-400">›</span>}
                            <span className="text-neutral-900 dark:text-neutral-900">Default</span>
                            {row === 'Chip' && <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-medium ${state === 'active' || state === 'selected' ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>Primary</span>}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Column Heading</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-600">Selectable</p>
                  {['Default', 'Hover', 'Sorted'].map((s) => (
                    <div key={s} className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent ${s === 'Hover' ? 'bg-primary/5 border-primary/20 dark:border-primary/25' : 'bg-neutral-50 dark:bg-[var(--color-surface)] dark:border-[var(--color-charcoal)]'}`}>
                      <span className="w-4 h-4 rounded border-2 border-neutral-300 dark:border-neutral-500 shrink-0" />
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-900">Label</span>
                      <span className="ml-auto text-neutral-500 dark:text-neutral-500 text-xs">{s === 'Sorted' ? '↕' : '↕'}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-600">Inselectable</p>
                  {['Default', 'Hover', 'Sorted'].map((s) => (
                    <div key={s} className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent ${s === 'Hover' ? 'bg-primary/5 border-primary/20 dark:border-primary/25' : 'bg-neutral-50 dark:bg-[var(--color-surface)] dark:border-[var(--color-charcoal)]'}`}>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-900">Label</span>
                      <span className="ml-auto text-neutral-500 dark:text-neutral-500 text-xs">{s === 'Sorted' ? '↕' : '↕'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card>
              <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Search Filter</h3>
              <div className="space-y-3 max-w-xs">
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)]">
                  <span className="text-sm text-neutral-500 dark:text-neutral-500 flex-1">Select</span>
                  <span className="text-neutral-400">▾</span>
                  <span className="w-7 h-7 rounded bg-primary/10 text-primary flex items-center justify-center text-xs">▼</span>
                </div>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg border-2 border-primary bg-white dark:bg-[var(--color-surface)]">
                  <span className="text-sm text-neutral-900 dark:text-neutral-900 flex-1">Select</span>
                  <span className="text-neutral-400">▾</span>
                  <span className="w-7 h-7 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">▼</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            14. SIDEBAR
        ════════════════════════════════════════════════════════════ */}
        <section id="sidebar" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Sidebar" description="5 sidebar variants: expanded, compact, dark, collapsed, icon-only." />
          <Card>
            <div className="flex flex-wrap gap-4 items-start">
              {/* Expanded light */}
              <div className="w-56 rounded-[var(--radius-card)] border border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-2)]">
                <div className="px-4 py-3 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-700">
                  <span className="text-primary text-lg">✦</span>
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-900">KTR</span>
                </div>
                <div className="p-3">
                  <div className="h-9 px-3 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center text-neutral-400 text-xs mb-3">⌕ Search</div>
                  {['Home', 'Calendar', 'Cardio Session', 'Vitals', 'Reporting'].map((item, i) => (
                    <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${i === 4 ? 'bg-primary/10 text-primary font-medium' : 'text-neutral-700 dark:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}>
                      <span className="w-4 h-4 rounded bg-neutral-200 dark:bg-neutral-600 shrink-0" />
                      {item}
                      <span className="ml-auto text-neutral-400 text-xs">▾</span>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2 border-t border-neutral-100 dark:border-neutral-700 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-600" />
                  <div className="text-xs"><p className="font-medium text-neutral-900 dark:text-neutral-900">Dr. Easin Arafat</p><p className="text-neutral-400 dark:text-neutral-500">Admin</p></div>
                </div>
              </div>

              {/* Dark with active */}
              <div className="w-56 rounded-[var(--radius-card)] border border-neutral-700 dark:border-neutral-600 bg-neutral-900 dark:bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-2)]">
                <div className="px-4 py-3 flex items-center gap-2 border-b border-neutral-700 dark:border-neutral-600">
                  <span className="text-primary text-lg">✦</span>
                  <span className="text-sm font-bold text-white">KTR</span>
                </div>
                <div className="p-3">
                  <div className="h-9 px-3 rounded-lg bg-primary/20 flex items-center text-primary/60 text-xs mb-3">⌕ Search</div>
                  {['Home', 'Calendar', 'Cardio Session', 'Vitals', 'Reporting'].map((item, i) => (
                    <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${i === 4 ? 'bg-primary text-primary-foreground font-medium' : 'text-neutral-300 hover:bg-neutral-800'}`}>
                      <span className="w-4 h-4 rounded bg-neutral-700 shrink-0" />
                      {item}
                      <span className="ml-auto text-neutral-500 dark:text-neutral-500 text-xs">▾</span>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2 border-t border-neutral-700 dark:border-neutral-600 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-700 dark:bg-neutral-600" />
                  <div className="text-xs"><p className="font-medium text-white">Dr. Easin Arafat</p><p className="text-neutral-500 dark:text-neutral-500">Admin</p></div>
                </div>
              </div>

              {/* Icon only */}
              <div className="w-16 rounded-[var(--radius-card)] border border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] overflow-hidden flex flex-col items-center py-3 gap-3 shadow-[var(--shadow-2)]">
                <span className="text-primary text-lg">✦</span>
                <div className="h-px w-8 bg-neutral-200 dark:bg-neutral-600" />
                {['S', 'G', 'C', 'H', 'T', 'U'].map((icon, i) => (
                  <div key={i} className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm ${i === 4 ? 'bg-primary/10 text-primary' : 'text-neutral-500 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}>{icon}</div>
                ))}
                <div className="mt-auto w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-600" />
              </div>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            15. UPLOAD & VIEW
        ════════════════════════════════════════════════════════════ */}
        <section id="upload-view" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Upload & View" description="Drop area, uploading progress, uploaded file view." />
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Drop area */}
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-3">Drop area</p>
                <div className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-primary/40 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 min-h-[160px]">
                  <span className="text-primary text-2xl">↑</span>
                  <p className="text-sm font-medium text-primary">Drop or drag file</p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-500">doc, pdf, xsl</p>
                  <p className="text-[10px] text-neutral-400">max size: 5mb</p>
                </div>
                <div className="mt-3 flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-error/40 bg-error/5 min-h-[120px]">
                  <p className="text-sm font-medium text-error">Wrong file format.</p>
                  <p className="text-sm text-error">Please try again</p>
                  <p className="text-[10px] text-neutral-400">doc, pdf, xsl &middot; max size: 5mb</p>
                </div>
              </div>
              {/* Uploading */}
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-3">Uploading progress</p>
                <div className="space-y-4">
                  <div className="rounded-lg border border-[var(--color-charcoal)] p-3 bg-white dark:bg-[var(--color-surface)]">
                    <p className="text-xs font-medium text-primary mb-1">Uploading...</p>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 truncate flex-1">BS40-5BP_National_Insurance_Number-001</p>
                      <span className="text-[10px] text-neutral-400 shrink-0">120kb</span>
                      <button type="button" className="text-neutral-400 hover:text-neutral-600 text-xs">×</button>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full w-3/5" />
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-charcoal)] p-3 bg-white dark:bg-[var(--color-surface)]">
                    <p className="text-xs font-medium text-primary mb-1">Uploading...</p>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 flex-1">3 of 76 files</p>
                      <span className="text-[10px] text-neutral-400 shrink-0">2 of 5mb</span>
                      <button type="button" className="text-neutral-400 hover:text-neutral-600 text-xs">×</button>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full w-2/5" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Uploaded files */}
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-3">Uploaded file view</p>
                <div className="space-y-3">
                  {[
                    { name: 'BS40-5BP_National_Insurance.doc', size: '120kb', color: 'bg-blue-500' },
                    { name: 'BS40-5BP_Patients_Management.2023.doc', size: '120kb', color: 'bg-green-500' },
                    { name: 'BS40-5BP_National_Insurance.doc', size: '120kb', color: 'bg-neutral-500' },
                  ].map((file, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-[var(--color-charcoal)] p-3 bg-white dark:bg-[var(--color-surface)]">
                      <div className={`w-10 h-10 rounded-lg ${file.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>DOC</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-900 truncate">{file.name}</p>
                        <p className="text-[10px] text-neutral-400">{file.size}</p>
                      </div>
                      <button type="button" className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-600 shrink-0">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            16. POPUP DIALOG
        ════════════════════════════════════════════════════════════ */}
        <section id="dialog-popup" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Popup Dialog" description="Modal component in various sizes and use cases." />
          <Card>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => setModalOpen(true)}>Info Dialog</Button>
              <Button variant="secondary" onClick={() => setConfirmModalOpen(true)}>Confirm Dialog</Button>
              <Button variant="secondary" onClick={() => setFormModalOpen(true)}>Form Dialog</Button>
            </div>
          </Card>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Information" size="max-w-md">
            <p className="text-neutral-700 dark:text-neutral-600">This is an informational dialog. It uses the Modal component with default max-w-md sizing.</p>
            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={() => setModalOpen(false)}>Got it</Button>
            </div>
          </Modal>
          <Modal open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirm Action" size="max-w-sm">
            <p className="text-neutral-700 dark:text-neutral-600">Are you sure you want to proceed? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setConfirmModalOpen(false)}>Confirm</Button>
            </div>
          </Modal>
          <Modal open={formModalOpen} onClose={() => setFormModalOpen(false)} title="Create Item" size="max-w-lg">
            <div className="space-y-4">
              <Input label="Name" placeholder="Enter name" />
              <Textarea label="Description" placeholder="Enter description" />
              <Select label="Category" options={[{ value: '', label: 'Select...' }, { value: 'a', label: 'Category A' }, { value: 'b', label: 'Category B' }]} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setFormModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setFormModalOpen(false)}>Create</Button>
            </div>
          </Modal>
        </section>

        {/* ════════════════════════════════════════════════════════════
            17. CHAT BOX & MESSAGES
        ════════════════════════════════════════════════════════════ */}
        <section id="chat-messages" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Chat Box & Messages" description="Inline chat panel and popup dialog mode." />

          {/* Inline chat preview */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Inline Chat Panel</h3>
            <div className="rounded-xl border-2 border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] overflow-hidden max-w-xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-[var(--color-charcoal)]">
                <AiBotIcon className="w-7 h-7" />
                <h4 className="text-sm font-semibold uppercase tracking-wide text-accent dark:text-primary">Conversation</h4>
              </div>
              <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                {/* Assistant message */}
                <div className="flex gap-2 max-w-[85%]">
                  <span className="w-7 h-7 rounded-full bg-accent-muted dark:bg-primary/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <AiBotIcon className="w-6 h-6" />
                  </span>
                  <div className="rounded-xl px-3 py-2 border-2 bg-neutral-100 dark:bg-[var(--color-surface)] border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-900 text-xs">
                    <p className="text-sm leading-relaxed">Hello! How can I help you today?</p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-600 mt-1">10:30 AM</p>
                  </div>
                </div>
                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-[85%]">
                    <div className="rounded-xl px-3 py-2 border-2 bg-accent-muted dark:bg-primary/20 border-primary/20 dark:border-primary/30 text-neutral-900 dark:text-neutral-900">
                      <p className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-500 mb-0.5">You &middot; 10:31 AM</p>
                      <p className="text-sm leading-relaxed">Can you explain gradient descent?</p>
                    </div>
                  </div>
                </div>
                {/* Assistant reply */}
                <div className="flex gap-2 max-w-[85%]">
                  <span className="w-7 h-7 rounded-full bg-accent-muted dark:bg-primary/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <AiBotIcon className="w-6 h-6" />
                  </span>
                  <div className="rounded-xl px-3 py-2 border-2 bg-neutral-100 dark:bg-[var(--color-surface)] border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-900 text-xs">
                    <p className="text-sm leading-relaxed">Gradient descent is an optimization algorithm used to minimize the loss function in machine learning models...</p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-600 mt-1">10:31 AM</p>
                  </div>
                </div>
              </div>
              <div className="p-3 border-t-2 border-[var(--color-charcoal)]">
                <ChatInputBar value="" onChange={() => {}} onSend={() => {}} onFileChange={() => {}} placeholder="Type your question..." />
              </div>
            </div>
          </Card>

          {/* Chat popup button */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Chat Popup Dialog</h3>
            <Button variant="primary" onClick={() => setChatDialogOpen(true)}>Open Chat Popup</Button>
          </Card>

          {/* Chat popup modal */}
          {chatDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setChatDialogOpen(false)}>
              <div className="bg-white dark:bg-[var(--color-surface)] rounded-2xl border-2 border-[var(--color-charcoal)] shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[var(--color-charcoal)] bg-neutral-50 dark:bg-[var(--color-surface)]">
                  <div className="flex items-center gap-2">
                    <AiBotIcon className="w-8 h-8" />
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-900 uppercase tracking-wide">Together AI — Chat</h2>
                  </div>
                  <button type="button" onClick={() => setChatDialogOpen(false)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-900" aria-label="Close">
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                  <div className="flex gap-2 max-w-[90%]">
                    <span className="w-7 h-7 rounded-full bg-accent-muted dark:bg-primary/20 flex-shrink-0 flex items-center justify-center">
                      <AiBotIcon className="w-6 h-6" />
                    </span>
                    <div className="rounded-xl px-3 py-2 border-2 bg-neutral-100 dark:bg-[var(--color-surface)] border-neutral-200 dark:border-neutral-600 text-xs text-neutral-600 dark:text-neutral-900">
                      <p className="text-sm leading-relaxed">Welcome! Ask me anything about your studies.</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[90%] rounded-xl px-3 py-2 border-2 bg-accent-muted dark:bg-primary/20 border-primary/20 dark:border-primary/30 text-neutral-900 dark:text-neutral-900">
                      <p className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-500 mb-0.5">You</p>
                      <p className="text-sm leading-relaxed">What topics should I study for the exam?</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t-2 border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)]">
                  <ChatInputBar value={chatValue} onChange={(e) => setChatValue(e.target.value)} onSend={() => {}} onFileChange={() => {}} placeholder="Ask anything..." />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════════
            18. QUIZ POPUP
        ════════════════════════════════════════════════════════════ */}
        <section id="quiz-popup" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Quiz Popup" description="QuizletQuizModal: quiz-in-progress and results views." />
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Quiz In-Progress Preview</h3>
            <div className="rounded-xl border-2 border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] p-6 max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-900">Question 1 / 5</span>
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-accent-muted dark:bg-primary/20 text-accent dark:text-primary text-[11px] font-semibold">Time 01:30</span>
                  <button type="button" className="px-3 py-1.5 rounded-lg bg-error/10 border border-error/50 text-error text-xs font-medium">Exit</button>
                </div>
              </div>
              <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-neutral-700 dark:bg-neutral-300 rounded-full w-1/5" />
              </div>
              <p className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-3">Topic: Neural Networks</p>
              <p className="text-base font-bold text-neutral-900 dark:text-neutral-900 leading-snug mb-6">&quot;Compare Gradient Descent and Adam optimizer&quot;</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="lg" className="flex-1">Adam is faster</Button>
                <Button variant="secondary" size="lg" className="flex-1">GD is simpler</Button>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Results Preview</h3>
            <div className="rounded-xl border-2 border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] p-6 max-w-2xl">
              <h4 className="text-lg font-bold uppercase text-neutral-900 dark:text-neutral-900 text-center mb-8">Analysis results</h4>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="rounded-xl border border-[var(--color-charcoal)] bg-neutral-50/50 dark:bg-neutral-200/50 p-6">
                  <p className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-600 mb-3">Questions you got wrong</p>
                  <div className="flex gap-3">
                    <span className="w-1 rounded-full bg-highlight shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-900">Compare Gradient Descent and Adam</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-600 mt-0.5">Wrong in questions 2 &amp; 4</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--color-charcoal)] bg-neutral-50/50 dark:bg-neutral-200/50 p-6">
                  <p className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-600 mb-3">Suggested topics</p>
                  {[{ t: 'Optimization algorithms', p: 45 }, { t: 'Optimization algorithms', p: 62 }, { t: 'Optimization algorithms', p: 78 }].map((s, i) => (
                    <div key={i} className="mb-2 last:mb-0">
                      <p className="text-xs text-neutral-900 dark:text-neutral-900 mb-1">{s.t}</p>
                      <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${s.p}%` }} />
                      </div>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{s.p}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center gap-12 py-6 border-t border-neutral-200 dark:border-neutral-600">
                <div className="text-center"><p className="text-xl font-bold text-neutral-900 dark:text-neutral-900">3/5</p><p className="text-[10px] text-neutral-500 dark:text-neutral-500 uppercase mt-1">Score</p></div>
                <div className="w-px h-10 bg-neutral-200 dark:bg-neutral-600" />
                <div className="text-center"><p className="text-xl font-bold text-neutral-900 dark:text-neutral-900">03</p><p className="text-[10px] text-neutral-500 dark:text-neutral-500 uppercase mt-1">Correct</p></div>
                <div className="w-px h-10 bg-neutral-200 dark:bg-neutral-600" />
                <div className="text-center"><p className="text-xl font-bold text-neutral-900 dark:text-neutral-900">01:30</p><p className="text-[10px] text-neutral-500 dark:text-neutral-500 uppercase mt-1">Time spent</p></div>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-4">Live Quiz Modal</h3>
            <Button variant="primary" onClick={() => setQuizOpen(true)}>Open Quiz</Button>
          </Card>
          {quizOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setQuizOpen(false)}>
              <div className="bg-white dark:bg-[var(--color-surface)] rounded-2xl border-2 border-[var(--color-charcoal)] shadow-xl w-full max-w-3xl min-h-[34rem] max-h-[95vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between gap-5 px-10 py-5 border-b border-neutral-200 dark:border-neutral-600">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-900">Question 1 / 3</span>
                  <div className="flex items-center gap-4">
                    <span className="px-4 py-2 rounded-lg bg-accent-muted dark:bg-primary/20 text-accent dark:text-primary text-[11px] font-semibold">Time 00:00</span>
                    <Button variant="secondary" size="sm" className="!bg-error/10 !border-error/50 !text-error hover:!bg-error/20" onClick={() => setQuizOpen(false)}>Exit</Button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto px-10 py-10">
                    <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden mb-10">
                      <div className="h-full bg-neutral-700 dark:bg-neutral-300 rounded-full w-1/3" />
                    </div>
                    <p className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-4">Topic: Design Systems</p>
                    <p className="text-base font-bold text-neutral-900 dark:text-neutral-900 leading-snug max-w-xl mx-auto">&quot;What color space avoids muddy gradient interpolation?&quot;</p>
                  </div>
                  <div className="shrink-0 flex gap-5 justify-center px-10 py-6 border-t border-neutral-200 dark:border-neutral-600">
                    <Button variant="secondary" size="lg" className="flex-1 max-w-xs">sRGB</Button>
                    <Button variant="primary" size="lg" className="flex-1 max-w-xs">oklch</Button>
                  </div>
                </div>
                <div className="shrink-0 flex justify-end px-10 py-5 border-t border-neutral-200 dark:border-neutral-600">
                  <Button variant="primary" size="sm" onClick={() => setQuizOpen(false)}>Next</Button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════════
            ALERTS & NOTIFICATIONS
        ════════════════════════════════════════════════════════════ */}
        <section id="alerts" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Alerts & Notifications" description="Success, warning, error, info with dismiss, icon, title+description." />
          <Card>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg border border-[var(--color-charcoal)] bg-success/10 border-success/40">
                <span className="text-success text-lg shrink-0">✓</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-900">Success</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-500 mt-0.5">Your changes have been saved.</p>
                </div>
                <button type="button" className="ml-auto text-neutral-500 hover:text-neutral-700" aria-label="Dismiss">×</button>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border border-[var(--color-charcoal)] bg-warning/10 border-warning/40">
                <span className="text-warning text-lg shrink-0">!</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-900">Warning</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-500 mt-0.5">Please review before continuing.</p>
                </div>
                <button type="button" className="ml-auto text-neutral-500 hover:text-neutral-700" aria-label="Dismiss">×</button>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border border-[var(--color-charcoal)] bg-error/10 border-error/40">
                <span className="text-error text-lg shrink-0">✕</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-900">Error</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-500 mt-0.5">Something went wrong. Try again.</p>
                </div>
                <button type="button" className="ml-auto text-neutral-500 hover:text-neutral-700" aria-label="Dismiss">×</button>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border border-[var(--color-charcoal)] bg-blue/10 border-blue/40">
                <span className="text-blue text-lg shrink-0">i</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-900">Info</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-500 mt-0.5">New feature available in settings.</p>
                </div>
                <button type="button" className="ml-auto text-neutral-500 hover:text-neutral-700" aria-label="Dismiss">×</button>
              </div>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            TOAST MESSAGES
        ════════════════════════════════════════════════════════════ */}
        <section id="toast" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Toast Messages" description="Snackbar-style toasts: success, error, warning, info, with action and with icon. Use for short-lived feedback." />
          <Card>
            <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-4">Toast variants (inline preview). In app, render fixed bottom or top with transition.</p>
            <div className="space-y-3 max-w-lg">
              {/* Success toast */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] shadow-[var(--shadow-5)]">
                <CheckIcon className="w-5 h-5 text-success shrink-0" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-900 flex-1">Saved successfully</span>
                <button type="button" className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-900 p-1" aria-label="Close"><CloseIcon className="w-4 h-4" /></button>
              </div>
              {/* Error toast */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-error/50 bg-error/10 shadow-[var(--shadow-5)]">
                <CloseIcon className="w-5 h-5 text-error shrink-0" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-900 flex-1">Failed to save. Try again.</span>
                <button type="button" className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-900 p-1" aria-label="Close"><CloseIcon className="w-4 h-4" /></button>
              </div>
              {/* Warning toast */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-warning/50 bg-warning/10 shadow-[var(--shadow-5)]">
                <span className="w-5 h-5 rounded-full border-2 border-warning flex items-center justify-center text-[10px] font-bold text-warning shrink-0">!</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-900 flex-1">Session expires in 5 min</span>
                <button type="button" className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-900 p-1" aria-label="Close"><CloseIcon className="w-4 h-4" /></button>
              </div>
              {/* Info toast */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-blue/50 bg-blue/10 shadow-[var(--shadow-5)]">
                <span className="w-5 h-5 rounded-full border-2 border-blue flex items-center justify-center text-[10px] font-bold text-blue shrink-0">i</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-900 flex-1">New update available</span>
                <button type="button" className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-900 p-1" aria-label="Close"><CloseIcon className="w-4 h-4" /></button>
              </div>
              {/* Toast with action */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] shadow-[var(--shadow-5)]">
                <CheckIcon className="w-5 h-5 text-success shrink-0" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-900 flex-1">Item removed</span>
                <button type="button" className="text-sm font-semibold text-primary hover:underline shrink-0">Undo</button>
                <button type="button" className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-900 p-1" aria-label="Close"><CloseIcon className="w-4 h-4" /></button>
              </div>
              {/* Minimal toast (icon + text only) */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-charcoal)] bg-neutral-100 dark:bg-[var(--color-surface)] shadow-[var(--shadow-3)] w-fit">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full shrink-0" />
                <span className="text-sm text-neutral-700 dark:text-neutral-600">Loading…</span>
              </div>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            AVATARS
        ════════════════════════════════════════════════════════════ */}
        <section id="avatars" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Avatars" description="Sizes 24–64px, initials fallback, status indicator, group overlap." />
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-3">Sizes</h3>
            <div className="flex flex-wrap items-end gap-6">
              {[24, 32, 40, 48, 64].map((size) => (
                <div key={size} className="flex flex-col items-center gap-1">
                  <div className="rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-[var(--color-charcoal)]" style={{ width: size, height: size, fontSize: size * 0.4 }}>JD</div>
                  <span className="text-[10px] text-neutral-500">{size}px</span>
                </div>
              ))}
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Status</h3>
            <div className="flex flex-wrap gap-6">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center text-sm font-bold border border-[var(--color-charcoal)]">AB</div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-white dark:border-neutral-800" title="Online" />
              </div>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center text-sm font-bold border border-[var(--color-charcoal)]">CD</div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-neutral-400 border-2 border-white dark:border-neutral-800" title="Offline" />
              </div>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center text-sm font-bold border border-[var(--color-charcoal)]">EF</div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-warning border-2 border-white dark:border-neutral-800" title="Busy" />
              </div>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Group</h3>
            <div className="flex -space-x-2">
              {['JD', 'AB', 'CD', 'EF'].map((initials, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary border-2 border-white dark:border-neutral-800 border-[var(--color-charcoal)]" title={initials}>{initials}</div>
              ))}
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            TABS
        ════════════════════════════════════════════════════════════ */}
        <section id="tabs" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Tabs" description="Underline, pill, segmented, vertical, and icon tabs." />
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-3">Underline</h3>
            <div className="border-b border-[var(--color-charcoal)] mb-4 overflow-x-auto">
              <div className="flex gap-4 sm:gap-6 min-w-0">
                {['Overview', 'Details', 'Settings'].map((tab, i) => (
                  <button key={tab} type="button" onClick={() => setDemoTabIndex(i)} className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${demoTabIndex === i ? 'border-primary text-primary' : 'border-transparent text-neutral-600 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-900'}`} style={{ marginBottom: -1 }}>{tab}</button>
                ))}
              </div>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-500">Content: {['Overview', 'Details', 'Settings'][demoTabIndex]}</p>

            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Pill</h3>
            <div className="flex flex-wrap gap-2 p-1 rounded-lg bg-neutral-100 dark:bg-[var(--color-surface)] border border-[var(--color-charcoal)] w-fit">
              {['All', 'Active', 'Archived'].map((tab, i) => (
                <button key={tab} type="button" onClick={() => setDemoTabIndex(i)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${demoTabIndex === i ? 'bg-white dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900 shadow-sm border border-[var(--color-charcoal)]' : 'text-neutral-600 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-900'}`}>{tab}</button>
              ))}
            </div>

            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Segmented</h3>
            <div className="inline-flex rounded-lg border border-[var(--color-charcoal)] overflow-hidden flex-wrap sm:flex-nowrap">
              {['List', 'Grid', 'Map'].map((tab, i) => (
                <button key={tab} type="button" onClick={() => setDemoTabIndex(i)} className={`px-4 py-2 text-sm font-medium ${i > 0 ? 'border-l border-[var(--color-charcoal)]' : ''} ${demoTabIndex === i ? 'bg-primary text-primary-foreground' : 'bg-white dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}>{tab}</button>
              ))}
            </div>

            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Vertical tabs</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex sm:flex-col gap-1 border-b sm:border-b-0 sm:border-r border-[var(--color-charcoal)] pb-2 sm:pb-0 sm:pr-2 sm:w-40">
                {['Profile', 'Security', 'Billing'].map((tab, i) => (
                  <button key={tab} type="button" onClick={() => setDemoTabIndex(i)} className={`px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${demoTabIndex === i ? 'bg-primary/15 text-primary dark:bg-primary/20' : 'text-neutral-600 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}>{tab}</button>
                ))}
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-500 flex-1">Selected: {['Profile', 'Security', 'Billing'][demoTabIndex]}</p>
            </div>

            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Icon tabs</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: <DocumentIcon className="w-4 h-4" />, label: 'Docs' },
                { icon: <CalendarIcon className="w-4 h-4" />, label: 'Calendar' },
                { icon: <UserIcon className="w-4 h-4" />, label: 'Profile' },
                { icon: <SettingsIcon className="w-4 h-4" />, label: 'Settings' },
              ].map(({ icon, label }, i) => (
                <button key={label} type="button" onClick={() => setDemoTabIndex(i % 3)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${demoTabIndex === i % 3 ? 'bg-primary text-primary-foreground' : 'border border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] text-neutral-700 dark:text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}>{icon}{label}</button>
              ))}
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            TOOLTIPS
        ════════════════════════════════════════════════════════════ */}
        <section id="tooltips" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Tooltips" description="Top, bottom, left, right. Dark and light." />
          <Card>
            <div className="flex flex-wrap gap-8 justify-center py-8">
              <div className="relative group">
                <span className="px-3 py-2 rounded-lg bg-neutral-900 dark:bg-black text-white text-xs font-medium whitespace-nowrap absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Top tooltip</span>
                <span className="px-4 py-2 rounded-lg border border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] text-sm">Hover (top)</span>
              </div>
              <div className="relative group">
                <span className="px-3 py-2 rounded-lg bg-neutral-900 dark:bg-black text-white text-xs font-medium whitespace-nowrap absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Bottom tooltip</span>
                <span className="px-4 py-2 rounded-lg border border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] text-sm">Hover (bottom)</span>
              </div>
              <div className="relative group">
                <span className="px-3 py-2 rounded-lg bg-neutral-900 dark:bg-black text-white text-xs font-medium whitespace-nowrap absolute right-full top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Left</span>
                <span className="px-4 py-2 rounded-lg border border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] text-sm">Hover (left)</span>
              </div>
              <div className="relative group">
                <span className="px-3 py-2 rounded-lg bg-neutral-900 dark:bg-black text-white text-xs font-medium whitespace-nowrap absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Right</span>
                <span className="px-4 py-2 rounded-lg border border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] text-sm">Hover (right)</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 text-center mt-2">Light tooltip variant:</p>
            <div className="flex justify-center pt-2">
              <div className="relative group">
                <span className="px-3 py-2 rounded-lg bg-white dark:bg-[var(--color-surface)] border border-[var(--color-charcoal)] text-neutral-900 dark:text-neutral-900 text-xs font-medium shadow-lg whitespace-nowrap absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Light tooltip</span>
                <span className="px-4 py-2 rounded-lg border border-[var(--color-charcoal)] bg-neutral-100 dark:bg-[var(--color-surface)] text-sm">Hover</span>
              </div>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            TAGS / LABELS
        ════════════════════════════════════════════════════════════ */}
        <section id="tags" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Tags & Labels" description="Dot + text, filled, outline, with count, removable. Use for filters and categories." />
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-3">With dot (default)</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-[var(--color-charcoal)] bg-neutral-50 dark:bg-[var(--color-surface)]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Primary
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-[var(--color-charcoal)] bg-success/10">
                <span className="w-1.5 h-1.5 rounded-full bg-success" /> Success
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-[var(--color-charcoal)] bg-warning/10">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" /> Warning
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-[var(--color-charcoal)] bg-error/10">
                <span className="w-1.5 h-1.5 rounded-full bg-error" /> Error
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-[var(--color-charcoal)] bg-neutral-50 dark:bg-[var(--color-surface)]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Removable
                <button type="button" className="ml-0.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-600" aria-label="Remove">×</button>
              </span>
            </div>

            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Filled (solid background)</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground">Primary</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-success text-white">Success</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-warning text-neutral-900">Warning</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-error text-white">Error</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue text-white">Info</span>
            </div>

            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">With count / number</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-[var(--color-charcoal)] bg-neutral-50 dark:bg-[var(--color-surface)]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> In progress <span className="font-bold text-neutral-700 dark:text-neutral-600">12</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30">Tasks <span className="font-bold">5</span></span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-success/15 text-success border border-success/30">Done <span className="font-bold">28</span></span>
            </div>

            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">With icon</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-[var(--color-charcoal)] bg-neutral-50 dark:bg-[var(--color-surface)]">
                <CalendarIcon className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-500" /> Event
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-[var(--color-charcoal)] bg-success/10">
                <CheckIcon className="w-3.5 h-3.5 text-success" /> Completed
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-[var(--color-charcoal)] bg-warning/10">
                <StarIcon className="w-3.5 h-3.5 text-warning" /> Featured
              </span>
            </div>

            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Sizes</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border border-[var(--color-charcoal)] bg-neutral-50 dark:bg-[var(--color-surface)]">Small</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-[var(--color-charcoal)] bg-neutral-50 dark:bg-[var(--color-surface)]">Default</span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-[var(--color-charcoal)] bg-neutral-50 dark:bg-[var(--color-surface)]">Large</span>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            SKELETON LOADERS
        ════════════════════════════════════════════════════════════ */}
        <section id="skeletons" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Skeleton Loaders" description="Card, list, avatar+text, table row. animate-pulse." />
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-3">Card skeleton</h3>
            <div className="rounded-lg border border-[var(--color-charcoal)] p-4 space-y-3">
              <div className="h-24 rounded-lg bg-neutral-200 dark:bg-neutral-500 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-500 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-500 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">List skeleton</h3>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-neutral-200 dark:bg-neutral-500 animate-pulse" />
              ))}
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Avatar + text</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-500 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-500 animate-pulse" />
                <div className="h-3 w-48 rounded bg-neutral-200 dark:bg-neutral-500 animate-pulse" />
              </div>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Table row</h3>
            <div className="flex gap-4 border-b border-[var(--color-charcoal)] pb-3">
              <div className="h-4 w-8 rounded bg-neutral-200 dark:bg-neutral-500 animate-pulse shrink-0" />
              <div className="h-4 flex-1 rounded bg-neutral-200 dark:bg-neutral-500 animate-pulse" />
              <div className="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-500 animate-pulse shrink-0" />
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            LOADING STATES
        ════════════════════════════════════════════════════════════ */}
        <section id="loading-states" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Loading States" description="Button loading, input loading, card loading, page loading, inline spinner." />
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-3">Button loading</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" loading>Loading</Button>
              <Button variant="secondary" loading>Saving</Button>
              <Button variant="ghost" loading>Submit</Button>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Input loading</h3>
            <div className="max-w-sm">
              <div className="relative">
                <Input label="Email" placeholder="you@example.com" disabled className="dark:placeholder:text-neutral-500" />
                <div className="absolute right-3 top-[2.25rem] flex items-center justify-center pointer-events-none">
                  <svg className="animate-spin w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="42 24" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Card loading (skeleton)</h3>
            <div className="rounded-lg border border-[var(--color-charcoal)] p-4 space-y-3 max-w-xs">
              <div className="h-20 rounded-lg bg-neutral-200 dark:bg-neutral-500 animate-pulse" />
              <div className="h-4 w-[80%] rounded bg-neutral-200 dark:bg-neutral-500 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-500 animate-pulse" />
              <div className="h-8 w-24 rounded-lg bg-neutral-200 dark:bg-neutral-500 animate-pulse mt-2" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Inline spinner (sizes)</h3>
            <div className="flex flex-wrap items-center gap-6">
              <svg className="animate-spin w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="42 24" strokeLinecap="round" /></svg>
              <svg className="animate-spin w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="42 24" strokeLinecap="round" /></svg>
              <svg className="animate-spin w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="42 24" strokeLinecap="round" /></svg>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Page loading (overlay)</h3>
            <div className="relative h-32 rounded-lg border border-[var(--color-charcoal)] bg-neutral-50 dark:bg-[var(--color-surface)] overflow-hidden">
              <div className="absolute inset-0 bg-white/80 dark:bg-black/70 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin w-10 h-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="42 24" strokeLinecap="round" /></svg>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-900">Loading…</span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            ACCORDION / COLLAPSIBLE
        ════════════════════════════════════════════════════════════ */}
        <section id="accordion" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Accordion & Collapsible" description="Expand/collapse. Single or multiple open." />
          <Card>
            <div className="space-y-1 border border-[var(--color-charcoal)] rounded-lg overflow-hidden">
              {['Section A', 'Section B', 'Section C'].map((title, i) => (
                <div key={title}>
                  <button type="button" onClick={() => setAccordionOpen(accordionOpen === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-neutral-900 dark:text-neutral-900 bg-neutral-50 dark:bg-[var(--color-surface)] hover:bg-neutral-100 dark:hover:bg-neutral-700 border-b border-[var(--color-charcoal)] last:border-b-0 transition-colors duration-150">
                    {title}
                    <span className="text-neutral-500 transition-transform duration-200 inline-block">{accordionOpen === i ? '−' : '+'}</span>
                  </button>
                  {accordionOpen === i && (
                    <div className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-500 bg-white dark:bg-[var(--color-surface)] border-b border-[var(--color-charcoal)] last:border-b-0 animate-fade-in">
                      Content for {title}. Single-open mode.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            19. CARDS
        ════════════════════════════════════════════════════════════ */}
        <section id="cards" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Cards" description="Image, footer, horizontal, hoverable variants with charcoal border." />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>Plain card with no heading.</Card>
            <Card heading="Card with heading">Content under the heading.</Card>
            <Card className="overflow-hidden p-0">
              <div className="h-24 bg-primary" />
              <div className="p-4">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/20 text-primary mb-2">Badge</span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-900">Card with image</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-500 mt-1">Placeholder gradient as image area.</p>
              </div>
            </Card>
            <Card className="flex flex-col">
              <p className="flex-1 text-sm text-neutral-700 dark:text-neutral-600">Card with footer actions.</p>
              <div className="flex gap-2 pt-4 mt-4 border-t border-[var(--color-charcoal)]">
                <Button variant="secondary" size="sm">Cancel</Button>
                <Button variant="primary" size="sm">Save</Button>
              </div>
            </Card>
            <Card className="flex flex-row items-center gap-4 p-4 md:p-6">
              <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-2xl text-primary">&#10038;</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-900">Horizontal card</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-500">Layout with icon and text side by side.</p>
              </div>
            </Card>
            <Card className="transition-shadow duration-200 hover:shadow-[var(--shadow-6)] cursor-pointer">Hoverable card (shadow on hover).</Card>
          </div>

          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-900 mt-8 mb-2">App card variants</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-4">Room, Team, Member, Subscription, Package, Stats, Task, Note, Event, Flashcard, Pack, Upgrade.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Room card */}
            <Card className="p-4 flex flex-col gap-2 hover:shadow-[var(--shadow-4)] transition-shadow cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-lg">&#10038;</div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-900 truncate">Focus Room</h3>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-500">3 online · 12 max</p>
                </div>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-500">Deep work, cameras on.</p>
              <Button variant="primary" size="sm" className="w-full mt-auto">Join</Button>
            </Card>

            {/* Team card */}
            <Card className="p-4 flex flex-col overflow-hidden">
              <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-neutral-700 text-white w-fit">Study</span>
              <div className="w-full aspect-[4/3] max-h-[80px] rounded-md border-2 border-dashed border-[var(--color-charcoal)] bg-neutral-50 dark:bg-neutral-700 flex items-center justify-center text-[9px] text-neutral-400 mt-2">[Image]</div>
              <p className="mt-2 text-xs font-bold text-neutral-900 dark:text-neutral-900">Team Alpha</p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-500">Sprint 2 · Design</p>
              <div className="mt-2 flex items-center gap-1">
                <div className="flex -space-x-1.5">
                  {[1, 2, 3].map((i) => <div key={i} className="w-5 h-5 rounded-full bg-neutral-400 border-2 border-white dark:border-neutral-800" />)}
                </div>
                <span className="text-[9px] font-semibold text-neutral-500 uppercase">5 members</span>
              </div>
            </Card>

            {/* Member card */}
            <Card className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">JD</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-900 truncate">Jane Doe</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-500">Designer · Active</p>
                <div className="flex gap-1 mt-1">
                  <Badge variant="outline" className="!py-0.5 !text-[9px]">React</Badge>
                  <Badge variant="outline" className="!py-0.5 !text-[9px]">UI</Badge>
                </div>
              </div>
            </Card>

            {/* Subscription card */}
            <Card className="p-4 flex flex-col border-2 border-primary/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-primary">Pro</span>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-900">$9.99/mo</p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-500 mt-0.5">Billing renews Dec 15</p>
              <Button variant="secondary" size="sm" className="w-full mt-3">Manage</Button>
            </Card>

            {/* Package card (Shop) */}
            <Card className="p-4 flex flex-col relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-neutral-900 dark:bg-neutral-700 px-2 py-0.5">
                <span className="text-[9px] font-bold uppercase text-white">Popular</span>
              </div>
              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-700 flex items-center justify-center text-primary text-lg">★</div>
                <h3 className="mt-2 text-sm font-bold text-neutral-900 dark:text-neutral-900">Starter Pack</h3>
                <p className="text-base font-bold text-neutral-900 dark:text-neutral-900">1,000 Coins</p>
                <p className="text-xs text-neutral-500">$4.99</p>
              </div>
              <Button variant="primary" size="sm" className="w-full mt-3">Buy</Button>
            </Card>

            {/* Stats / KPI card */}
            <Card className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-highlight/20 flex items-center justify-center text-highlight shrink-0">
                <span className="text-xl font-bold text-primary" aria-hidden>!</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">Current streak</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-900">15 Days</p>
              </div>
            </Card>

            {/* Task card */}
            <Card className="p-4 flex items-center gap-3">
              <div className="w-5 h-5 rounded border-2 border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-900">Review PR #42</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-500">Due tomorrow</p>
              </div>
            </Card>

            {/* Note card */}
            <Card className="p-4 flex flex-col">
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-1">Quick note</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-600 line-clamp-3">Meeting notes: action items for Q1. Follow up with design on tokens.</p>
              <p className="text-[10px] text-neutral-400 mt-2">2 min ago</p>
            </Card>

            {/* Event card */}
            <Card className="p-4 flex gap-3 border-l-4 border-primary">
              <div className="text-center shrink-0">
                <p className="text-[10px] font-bold uppercase text-neutral-500">Wed</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-900 leading-none">14</p>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-900">Team standup</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-500">9:00 AM · 30 min</p>
              </div>
            </Card>

            {/* Flashcard / Quizlet card */}
            <Card className="p-4 flex flex-col gap-2 border-2 border-neutral-200 dark:border-neutral-600">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/20 text-primary w-fit">Quizlet</span>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-900">Design Systems</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500">12 cards</p>
              <div className="flex gap-2 mt-auto">
                <Button variant="secondary" size="sm" className="flex-1">Flashcards</Button>
                <Button variant="primary" size="sm" className="flex-1">Do quiz</Button>
              </div>
            </Card>

            {/* Upgrade / CTA card */}
            <Card className="p-4 bg-primary/15 border border-primary/40">
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-900">Unlock all features</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-500 mt-1">Get Pro for unlimited rooms and analytics.</p>
              <Button variant="primary" size="sm" className="w-full mt-3">Upgrade</Button>
            </Card>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            20. BADGES
        ════════════════════════════════════════════════════════════ */}
        <section id="badges" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Badges" description="All 8 variants: default, highlight, primary, outline, success, warning, error, info." />
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-3">All variants</h3>
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">Default</Badge>
              <Badge variant="highlight">Highlight</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            21. PROGRESS
        ════════════════════════════════════════════════════════════ */}
        <section id="progress" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Progress" description="Bar thickness (sm/md/lg), variants including info, showPercentage, stepper." />
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-3">Variants</h3>
            <div className="space-y-4 max-w-md mb-6">
              <Progress value={65} variant="default" showPercentage />
              <Progress value={65} variant="success" showPercentage />
              <Progress value={65} variant="warning" showPercentage />
              <Progress value={65} variant="error" showPercentage />
              <Progress value={65} variant="info" showPercentage />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-3">Sizes (thicker bars)</h3>
            <div className="space-y-4 max-w-md mb-6">
              <Progress value={70} size="sm" />
              <Progress value={70} size="md" />
              <Progress value={70} size="lg" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-3">Stepper (Step 1 → Step 2 → Step 3)</h3>
            <div className="max-w-xl mb-6">
              <div className="flex items-center">
                {[1, 2, 3].map((step) => {
                  const completed = step < currentStep
                  const active = step === currentStep
                  return (
                    <span key={step} className="contents">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 ${completed ? 'bg-primary text-primary-foreground border-primary' : active ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/30' : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-500 border-[var(--color-charcoal)]'}`}>{step}</div>
                        <span className={`text-xs font-medium mt-2 ${active ? 'text-primary' : 'text-neutral-600 dark:text-neutral-500'}`}>Step {step}</span>
                      </div>
                      {step < 3 && <div className="flex-1 min-w-[32px] max-w-[80px] h-1 rounded-full mx-1 bg-neutral-200 dark:bg-neutral-600" style={{ width: 48 }}><div className={`h-full rounded-full transition-[width] duration-300 ${completed ? 'w-full bg-primary' : 'w-0'}`} /></div>}
                    </span>
                  )
                })}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" size="sm" onClick={() => setCurrentStep((s) => Math.max(1, s - 1))} disabled={currentStep <= 1}>Previous</Button>
                <Button variant="primary" size="sm" onClick={() => setCurrentStep((s) => Math.min(3, s + 1))} disabled={currentStep >= 3}>Next</Button>
              </div>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-3">With label</h3>
            <div className="space-y-6 max-w-md">
              <Progress value={75} max={100} label="LEVEL 14" />
              <Progress value={2450} max={3000} label="XP" caption="2,450 / 3,000 XP" />
            </div>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            22. BREADCRUMBS
        ════════════════════════════════════════════════════════════ */}
        <section id="breadcrumbs" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Breadcrumbs" description="Separator (chevron/slash/dot), maxItems collapse." />
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mb-3">Separators</h3>
            <div className="space-y-3">
              <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Profile', href: '/profile' }, { label: 'Account' }]} separator="chevron" /><br></br>
              <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Profile', href: '/profile' }, { label: 'Account' }]} separator="slash" /><br></br>
              <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Profile', href: '/profile' }, { label: 'Account' }]} separator="dot" /><br></br>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-900 mt-6 mb-3">Collapsed (maxItems=3)</h3>
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Products', href: '/products' },
                { label: 'Category', href: '/category' },
                { label: 'Item' },
              ]}
              maxItems={3}
            />
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            23. MODALS (demo of base modal component)
        ════════════════════════════════════════════════════════════ */}
        <section id="modals" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Modals" description="Base Modal component." />
          <Card>
            <p className="text-neutral-600 dark:text-neutral-500 mb-3">See Popup Dialog section above for interactive demos.</p>
            <Button variant="primary" onClick={() => setModalOpen(true)}>Open modal</Button>
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            24. CHAT INPUT
        ════════════════════════════════════════════════════════════ */}
        <section id="chat-input" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="ChatInputBar" description="Used in study rooms, AI support, and focus room." />
          <Card>
            <ChatInputBar value={chatValue} onChange={(e) => setChatValue(e.target.value)} onSend={() => {}} onFileChange={() => {}} placeholder="Type a message…" />
          </Card>
        </section>

        {/* ════════════════════════════════════════════════════════════
            25. DIVIDERS & LINKS
        ════════════════════════════════════════════════════════════ */}
        <section id="dividers-links" className="scroll-mt-8 space-y-6">
          <SectionHeading id="" title="Dividers & Links" />
          <Card>
            <div className="space-y-4">
              <p className="text-neutral-700 dark:text-neutral-600">Content above divider.</p>
              <hr className="border-border" />
              <p className="text-neutral-700 dark:text-neutral-600">Content below divider. Use <code className="text-sm bg-neutral-100 dark:bg-[var(--color-surface)] text-neutral-900 dark:text-neutral-900 px-1 rounded border border-[var(--color-charcoal)]">border-border</code> for hr.</p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a href="#dividers-links" className="text-primary underline hover:no-underline">Primary link</a>
                <a href="#dividers-links" className="text-accent dark:text-primary underline hover:no-underline">Accent link</a>
                <span className="text-error">Error text</span>
                <span className="text-success">Success text</span>
                <span className="text-highlight">Highlight text</span>
              </div>
            </div>
          </Card>
        </section>
      </div>
      {/* Floating theme toggle (debug only) */}
      <div className="fixed bottom-6 right-6 z-50 shadow-[var(--shadow-6)] rounded-xl ring-2 ring-[var(--color-charcoal)]/10 dark:ring-neutral-600/30">
        <ThemeSwitch />
      </div>
    </div>
  )
}
