import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Merge additional key/value pairs into en.json and vi.json.
 * Usage: node scripts/merge-locales.mjs path/to/patch.json
 * patch.json shape: { "en": { "key": "..." }, "vi": { "key": "..." } }
 */
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const localesDir = path.join(root, 'src', 'locales')
const patchPath = process.argv[2]
if (!patchPath) {
  console.error('Usage: node scripts/merge-locales.mjs <patch.json>')
  process.exit(1)
}

const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'))
const enPath = path.join(localesDir, 'en.json')
const viPath = path.join(localesDir, 'vi.json')
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'))

Object.assign(en, patch.en || {})
Object.assign(vi, patch.vi || {})

const enKeys = Object.keys(en)
const viKeys = Object.keys(vi)
const missingVi = enKeys.filter((k) => !(k in vi))
const missingEn = viKeys.filter((k) => !(k in en))
if (missingVi.length || missingEn.length) {
  console.error('Parity broken', { missingVi, missingEn })
  process.exit(1)
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n')
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2) + '\n')
console.log('Merged', Object.keys(patch.en || {}).length, 'keys. Total', enKeys.length)
