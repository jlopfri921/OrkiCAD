/**
 * Reuse the version-controlled official OrkiCAD logo for Vite and Tauri.
 * No network requests, external CDN, font files, or duplicate PNG in git.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const logoSource = resolve(frontendDir, '..', '..', 'logo_OrkiCAD-AI.png')
const logoDestination = resolve(frontendDir, 'public', 'logo_OrkiCAD-AI.png')

if (!existsSync(logoSource)) {
  throw new Error('Official logo not found in repository root: ' + logoSource)
}

mkdirSync(dirname(logoDestination), { recursive: true })
copyFileSync(logoSource, logoDestination)
console.log('OrkiCAD official logo prepared for offline Web/Desktop.')
