import { invoke } from '@tauri-apps/api/core'

export type ExportFormat = 'stl' | 'scad' | '3mf' | 'step'

const MIME: Record<ExportFormat, string> = {
  stl: 'model/stl', scad: 'text/plain', '3mf': 'model/3mf',
  step: 'application/step',
}

export function normalizeExportName(raw: string, format: ExportFormat): string {
  const name = raw.trim().replace(/\.(stl|scad|3mf|step|stp)$/i, '')
  if (!name || name === '.' || name === '..' || name.length > 100 ||
      /[\\/:*?"<>|\u0000-\u001f]/.test(name) || /[. ]$/.test(name)) {
    throw new Error('Nombre no válido: escribe un nombre de archivo sin rutas.')
  }
  return name + '.' + format
}

export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

interface WebSaveHandle {
  createWritable: () => Promise<{
    write: (file: Blob) => Promise<void>
    close: () => Promise<void>
    abort: () => Promise<void>
  }>
}
type PickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string
    types: Array<{ description: string; accept: Record<string, string[]> }>
    excludeAcceptAllOption: boolean
  }) => Promise<WebSaveHandle>
}

function fallbackBrowserDownload(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

function blobBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo generado.'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('No se pudo convertir el archivo generado.'))
      } else {
        resolve(result.slice(result.indexOf(',') + 1))
      }
    }
    reader.readAsDataURL(blob)
  })
}

/** Save is triggered from an explicit user click in Studio.
 * The browser's native picker opens before CAD generation to preserve
 * user activation. Older browsers control destination in download settings.
 */
export async function saveExport(
  format: ExportFormat, suggestedName: string, produce: () => Promise<Blob>,
): Promise<'saved' | 'cancelled' | 'browser-download'> {
  const filename = normalizeExportName(suggestedName, format)
  if (isDesktop()) {
    const blob = await produce()
    if (!blob.size) throw new Error('El archivo generado está vacío.')
    const dataBase64 = await blobBase64(blob)
    const path = await invoke<string | null>('save_export_file', {
      filename, format, dataBase64,
    })
    return path ? 'saved' : 'cancelled'
  }
  const webWindow = window as PickerWindow
  if (typeof webWindow.showSaveFilePicker === 'function') {
    let handle: WebSaveHandle
    try {
      handle = await webWindow.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: format.toUpperCase() + ' · OrkiCAD AI Studio',
          accept: { [MIME[format]]: ['.' + format] },
        }],
        excludeAcceptAllOption: true,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled'
      }
      throw error
    }
    const blob = await produce()
    if (!blob.size) throw new Error('El archivo generado está vacío.')
    const stream = await handle.createWritable()
    try {
      await stream.write(blob)
      await stream.close()
    } catch (error) {
      await stream.abort().catch(() => undefined)
      throw error
    }
    return 'saved'
  }
  const blob = await produce()
  if (!blob.size) throw new Error('El archivo generado está vacío.')
  fallbackBrowserDownload(blob, filename)
  return 'browser-download'
}
