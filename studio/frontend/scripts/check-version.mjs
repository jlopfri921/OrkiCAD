/**
 * OrkiCAD AI single-version guard for Web and Desktop development builds.
 * npm run dev/build must fail rather than silently displaying a mismatched version.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = resolve(frontend, '..', '..')
const readJson = path => JSON.parse(readFileSync(path, 'utf8'))

const frontendVersion = readJson(resolve(frontend, 'package.json')).version
const tauri = readJson(resolve(frontend, 'src-tauri', 'tauri.conf.json'))
const core = readFileSync(resolve(root, 'pyproject.toml'), 'utf8')
const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8')

const projectBlock = core.match(/\[project\]([\s\S]*?)(?=\n\[|$)/)?.[1] || ''
const coreVersion = projectBlock.match(/^version\s*=\s*"([^"]+)"/m)?.[1]
if (!frontendVersion || frontendVersion !== tauri.version || frontendVersion !== coreVersion) {
  throw new Error(
    'OrkiCAD AI version mismatch: Web=' + frontendVersion +
    ', Desktop=' + tauri.version + ', Core=' + coreVersion +
    '. Update all version metadata together.'
  )
}
if (!changelog.includes('Development build v' + frontendVersion)) {
  throw new Error('CHANGELOG.md must document Development build v' + frontendVersion)
}
if (tauri.productName !== 'OrkiCAD AI Studio' ||
    tauri.app?.windows?.[0]?.title !== 'OrkiCAD AI Studio') {
  throw new Error('Desktop product and window title must use the official name OrkiCAD AI.')
}
console.log('OrkiCAD AI v' + frontendVersion + ' · DEV · version metadata synchronized.')
