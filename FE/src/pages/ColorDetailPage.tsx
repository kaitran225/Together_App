import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/common'
import { jenny, purple, atlitude, mindful, gradientsAtlitude, gradientsMindful } from '../theme/colors'
import { generateVariants, hexToRgb, formatRgb, textColorOn } from '../utils/colorUtils'

const BASE_PRESETS: { label: string; hex: string }[] = [
  { label: 'Primary (ATLITUDE 3)', hex: '#977DFF' },
  { label: 'Accent (ATLITUDE 4)', hex: '#0033FF' },
  { label: 'Indigo', hex: '#4b0082' },
  { label: 'Midnight blue', hex: '#171717' },
  { label: 'Marigold (Jenny)', hex: '#F8A258' },
]

const YOUR_EIGHT_COLORS: { hex: string; role: string }[] = [
  { hex: '#f7f7f7', role: 'Background' },
  { hex: '#85b8fd', role: 'Accent (light)' },
  { hex: '#ffffff', role: 'Surface / white' },
  { hex: '#ffc757', role: 'Highlight / CTA' },
  { hex: '#4b0082', role: 'Primary' },
  { hex: '#171717', role: 'Text / dark' },
  { hex: '#fafafa', role: 'Surface alt' },
  { hex: '#171717', role: 'Primary dark' },
]

const PALETTE_A: { hex: string; role: string }[] = [
  { hex: '#f7f7f7', role: 'Background' },
  { hex: '#ffffff', role: 'Surface' },
  { hex: '#fafafa', role: 'Surface alt' },
  { hex: '#4b0082', role: 'Primary' },
  { hex: '#171717', role: 'Primary dark' },
  { hex: '#85b8fd', role: 'Accent (light)' },
  { hex: '#ffc757', role: 'Highlight' },
  { hex: '#171717', role: 'Text / dark' },
]

const PALETTE_B: { hex: string; role: string }[] = [
  { hex: '#f7f7f7', role: 'Background' },
  { hex: '#ffffff', role: 'Surface' },
  { hex: '#fafafa', role: 'Surface alt' },
  { hex: '#171717', role: 'Primary' },
  { hex: '#4b0082', role: 'Primary hover / accent' },
  { hex: '#85b8fd', role: 'Accent light' },
  { hex: '#ffc757', role: 'Highlight' },
  { hex: '#171717', role: 'Text' },
]

const PALETTE_C: { hex: string; role: string }[] = [
  { hex: '#f7f7f7', role: 'Background' },
  { hex: '#ffffff', role: 'Surface' },
  { hex: '#4b0082', role: 'Primary' },
  { hex: '#171717', role: 'Primary dark / text' },
  { hex: '#fafafa', role: 'Accent (soft)' },
  { hex: '#ffc757', role: 'Highlight' },
]

function Swatch({ hex, label, showRgb = false }: { hex: string; label?: string; showRgb?: boolean }) {
  const textColor = textColorOn(hex)
  const rgb = hexToRgb(hex)
  return (
    <div className="flex flex-col">
      <div
        className="w-full min-h-[3rem] rounded-lg border border-neutral-300 flex items-center justify-center p-2"
        style={{ backgroundColor: hex }}
      >
        <span className={`text-xs font-mono font-semibold ${textColor === 'white' ? 'text-white' : 'text-neutral-900'}`}>
          {hex}
        </span>
      </div>
      {label && <p className="text-xs text-neutral-600 mt-1 truncate" title={label}>{label}</p>}
      {showRgb && rgb && <p className="text-[10px] text-neutral-500 font-mono">{formatRgb(rgb)}</p>}
    </div>
  )
}

function GradientStrip({ gradient, label }: { gradient: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="w-full h-24 rounded-lg border border-neutral-300"
        style={{ background: gradient }}
      />
      <p className="text-xs text-neutral-600 truncate">{label}</p>
    </div>
  )
}

export default function ColorDetailPage() {
  const [baseHex, setBaseHex] = useState('#977DFF')
  const variants = generateVariants(baseHex, 10)
  const baseRgb = hexToRgb(baseHex)

  const appPalettes = [
    { name: 'Jenny Henderson', colors: Object.entries(jenny).map(([name, hex]) => ({ name, hex })) },
    { name: 'Purple set', colors: Object.entries(purple).map(([name, hex]) => ({ name, hex })) },
    { name: 'ATLITUDE', colors: Object.entries(atlitude).map(([name, hex]) => ({ name, hex })) },
    { name: 'MINDFULPALETTES', colors: Object.entries(mindful).map(([name, hex]) => ({ name, hex })) },
  ]

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="pb-6 border-b border-border">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Link to="/debug" className="text-sm text-primary underline hover:no-underline">Components</Link>
            <span className="text-neutral-400">/</span>
            <h1 className="text-2xl font-bold text-neutral-900">Color detail</h1>
          </div>
          <p className="text-neutral-600">One base color → 10 variants, app palettes, gradients, and recommended combinations.</p>
        </header>

        <section>
          <Card heading="Base color → 10 variants">
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Preset</label>
                  <select
                    className="border border-border rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white"
                    value={BASE_PRESETS.some((p) => p.hex.toLowerCase() === baseHex.toLowerCase()) ? baseHex : 'custom'}
                    onChange={(e) => e.target.value !== 'custom' && setBaseHex(e.target.value)}
                  >
                    <option value="custom">Custom</option>
                    {BASE_PRESETS.map((p) => (
                      <option key={p.hex} value={p.hex}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Or enter hex</label>
                  <input
                    type="text"
                    className="border border-border rounded-lg px-3 py-2 text-sm font-mono text-neutral-900 bg-white w-28"
                    value={baseHex}
                    onChange={(e) => setBaseHex(e.target.value.replace(/^#/, '').trim() ? '#' + e.target.value.replace(/^#/, '').trim() : baseHex)}
                  />
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div
                  className="w-24 h-24 rounded-xl border-2 border-neutral-300 shrink-0"
                  style={{ backgroundColor: baseHex }}
                />
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-neutral-900">{baseHex}</p>
                  {baseRgb && <p className="text-xs text-neutral-500 font-mono">RGB {formatRgb(baseRgb)}</p>}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500 mb-2">10 variants (light → dark)</p>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {variants.map((v) => (
                    <div key={v.hex} className="flex flex-col">
                      <div
                        className="w-full min-h-[2.5rem] rounded-lg border border-neutral-300 flex flex-col items-center justify-center p-1"
                        style={{ backgroundColor: v.hex }}
                      >
                        <span className={`text-[10px] font-mono font-semibold ${textColorOn(v.hex) === 'white' ? 'text-white' : 'text-neutral-900'}`}>
                          {v.hex.slice(1)}
                        </span>
                        {v.usage && (
                          <span className={`text-[9px] mt-0.5 ${textColorOn(v.hex) === 'white' ? 'text-white/90' : 'text-neutral-600'}`}>
                            {v.usage}
                          </span>
                        )}
                      </div>
                      {baseRgb && (
                        <p className="text-[9px] text-neutral-500 font-mono mt-0.5 truncate w-full text-center">
                          {formatRgb(v.rgb)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <Card heading="App palettes (reference)">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {appPalettes.map((palette) => (
                <div key={palette.name}>
                  <h4 className="text-sm font-bold text-neutral-900 mb-2">{palette.name}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {palette.colors.map(({ name, hex }) => (
                      <Swatch key={name} hex={hex} label={name} showRgb />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section>
          <Card heading="Gradients">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {Object.entries(gradientsAtlitude).map(([key, gradient]) => (
                <GradientStrip key={key} gradient={gradient} label={`ATLITUDE ${key}`} />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {Object.entries(gradientsMindful).map(([key, gradient]) => (
                <GradientStrip key={key} gradient={gradient} label={`MINDFUL ${key}`} />
              ))}
            </div>
          </Card>
        </section>

        <section>
          <Card heading="Your 8 colors (suggested roles)">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {YOUR_EIGHT_COLORS.map(({ hex, role }) => (
                <Swatch key={hex} hex={hex} label={role} showRgb />
              ))}
            </div>
          </Card>
        </section>

        <section>
          <Card heading="Recommended combinations">
            <p className="text-sm text-neutral-600 mb-4">Harmonious palettes inspired by Purple set, ATLITUDE, and Jenny Henderson.</p>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-neutral-900 mb-2">Palette A — Indigo focus</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PALETTE_A.map(({ hex, role }) => (
                    <Swatch key={hex} hex={hex} label={role} showRgb />
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 mb-2">Palette B — Midnight blue focus</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PALETTE_B.map(({ hex, role }) => (
                    <Swatch key={hex} hex={hex} label={role} showRgb />
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 mb-2">Palette C — Reduced to 6</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PALETTE_C.map(({ hex, role }) => (
                    <Swatch key={hex} hex={hex} label={role} showRgb />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}
