import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'src')
const raw = fs.readFileSync(path.join(srcDir, 'contexts', 'LanguageContext.tsx'), 'utf8')
const src = raw.replace(/\r\n/g, '\n')

const enMatch = src.match(/en:\s*\{([\s\S]*?)\n  \},\n  vi:/)
const viMatch = src.match(/vi:\s*\{([\s\S]*?)\n  \},\n\}/)
if (!enMatch || !viMatch) {
  console.error('Could not parse translations blocks', !!enMatch, !!viMatch)
  process.exit(1)
}

function parseBlock(block) {
  const obj = {}
  const re = /'([^']+)':\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/g
  let m
  while ((m = re.exec(block))) {
    const value = m[2] ?? m[3] ?? ''
    obj[m[1]] = value.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n')
  }
  return obj
}

const en = parseBlock(enMatch[1])
const vi = parseBlock(viMatch[1])
const outDir = path.join(srcDir, 'locales')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'en.json'), JSON.stringify(en, null, 2) + '\n')
fs.writeFileSync(path.join(outDir, 'vi.json'), JSON.stringify(vi, null, 2) + '\n')
console.log('en', Object.keys(en).length, 'vi', Object.keys(vi).length)
