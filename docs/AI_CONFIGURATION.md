# OrkiCAD AI Studio — AI configuration, per-client preferences and account roadmap

**Status (2026-11-16):** Collapsible panel + provider/model preference storage implemented in source branch, not yet accepted after Web and Tauri GUI tests. Authenticated per-user storage is a separate security milestone: [issue #12](https://github.com/jlopfri921/orkicad-ai/issues/12).

## Immediate behavior — Web and Desktop only

- **Configuración de IA / AI configuration** is a native closed-by-default `details` accordion on the left; users may expand it whenever necessary. The **Generate/Interpret** action and prompt remain visible when settings are collapsed.
- The selected provider (Ollama, OpenAI, Anthropic or Gemini) and **model ID per provider** persist locally using an allowlisted, schema-versioned browser `localStorage` item `orkicad-ai:studio:ai-preferences:v1`.
- The browser profile and the desktop Tauri WebView profile use independent local storage. This is **client profile storage**, not an account or a cross-device synchronization mechanism.
- If storage is unavailable, inaccessible or corrupt, the app continues with local Ollama defaults rather than blocking CAD.
- The Ollama installed-model list is refreshable but must not automatically overwrite an explicitly saved/manual model selection. Users can select other models in the UI.
- Cloud API keys are intentionally **temporary**. They are never written to the preference item, a project `.okad` file or a ComfyUI workflow, and are cleared after an AI request or provider switch.

## Security limitation and required future design

Two people using **the same browser profile** may see one another's saved **provider/model choices**. At present that is not an access-control mechanism, and this stage makes **no claim that user accounts or keys are isolated**. A future multiuser Web deployment must **not** rely on this storage as a user profile repository.

The next stage requires actual login and server-verified identities; database rows scoped by authenticated user; secure backend-only vault for secrets; logout/session cleanup; authorization and quota rules; and cross-account access tests. For a single-machine desktop app, SQLite can be considered for non-secret preferences if profiles and filesystem permissions are properly separated; for a concurrently served multiuser Web app, a managed PostgreSQL database is more suitable. User passwords and cloud credentials must never be stored in plaintext preference rows. Server-side profile isolation must replace or explicitly migrate the current per-client defaults.

**These account, database and credential-vault features apply to Studio Web and Desktop only.** ComfyUI remains a headless optional adapter, with independently configured node inputs/workflows. Do **not** propagate the Studio profile database, cloud API keys or accordion into ComfyUI.

## Visual identity

The shared Web/Desktop app header displays the official OrkiCAD AI logo in a **rounded rectangle** with discreet border, shaded background and shadow. The Windows Tauri packaging script applies an equivalent rounded/bordered frame to the generated installer icon. The official original logo image remains unchanged; its presentation is styled.

## Acceptance

1. Expand and collapse the AI settings using pointer and keyboard; defaults collapsed on reload.
2. Select Ollama and one locally installed model; reload browser; same ID is restored even if refresh/model enumeration finishes late.
3. Switch to a cloud provider; set a model ID; switch back; each provider retains its own model; reload and verify.
4. Cloud API key input clears after request/switch and is absent from persisted storage, model preferences, `.okad` files and logged API diagnostics.
5. Use another browser profile or Tauri installation: settings do not automatically transfer. **Do not interpret separate browser storage as multiuser login security.**
6. Confirm provider model choice remains accessible without a permanently expanded sidebar, including narrower windows.
7. Check official logo rounded corners and border in Web and Desktop, and round border of installed Windows icon when the package is built.
