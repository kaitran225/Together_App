import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, '..', 'FE', 'dist')
const dest = join(root, 'www')

if (!existsSync(src)) {
  console.error('FE/dist not found. Run the FE build first (npm run build:web).')
  process.exit(1)
}

rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true })
console.log(`Copied FE/dist -> Mobile/www`)
