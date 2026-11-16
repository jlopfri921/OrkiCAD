/** Per-device AI preferences for OrkiCAD AI Studio.
 *
 * Browser origin storage is isolated per browser profile; Tauri uses its own
 * WebView origin. Only allowlisted provider/model identifiers are persisted.
 * API credentials are deliberately never written to browser localStorage,
 * sessionStorage, IndexedDB, project .okad files or diagnostic logs.
 */
export type AIProvider = 'ollama' | 'openai' | 'anthropic' | 'gemini'
export type AIModelPreferences = Partial<Record<AIProvider, string>>
export type AIPreferences = {
  provider: AIProvider
  models: AIModelPreferences
}

export const AI_PREFERENCES_KEY = 'orkicad-ai:studio:ai-preferences:v1'
const PROVIDERS: readonly AIProvider[] = ['ollama', 'openai', 'anthropic', 'gemini']
const MAX_MODEL_LENGTH = 160

export function isAIProvider(value: unknown): value is AIProvider {
  return typeof value === 'string' && PROVIDERS.some(provider => provider === value)
}

export function normalizeAIPreferences(value: unknown): AIPreferences {
  const fallback: AIPreferences = { provider: 'ollama', models: {} }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback
  const record = value as Record<string, unknown>
  const provider = isAIProvider(record.provider) ? record.provider : 'ollama'
  const models: AIModelPreferences = {}
  const raw = record.models
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const name of PROVIDERS) {
      const model = (raw as Record<string, unknown>)[name]
      if (typeof model === 'string' && model.length <= MAX_MODEL_LENGTH &&
          !/[\u0000-\u001f\u007f]/.test(model)) {
        models[name] = model
      }
    }
  }
  return { provider, models }
}

export function readAIPreferences(): AIPreferences {
  try {
    if (typeof window === 'undefined') return normalizeAIPreferences(null)
    const source = window.localStorage.getItem(AI_PREFERENCES_KEY)
    return source ? normalizeAIPreferences(JSON.parse(source)) : normalizeAIPreferences(null)
  } catch {
    // Disabled/private browsing or corrupt storage should never block CAD.
    return normalizeAIPreferences(null)
  }
}

export function writeAIPreferences(value: AIPreferences): void {
  try {
    if (typeof window === 'undefined') return
    const safe = normalizeAIPreferences(value)
    window.localStorage.setItem(AI_PREFERENCES_KEY, JSON.stringify(safe))
  } catch {
    // Storage can be refused by the runtime; preferences remain in memory.
  }
}
