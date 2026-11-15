# Security policy

OrkiCAD AI is a planning-stage project; no supported production release exists.

Please **do not** disclose exploitable security details publicly. Report security concerns privately to repository maintainers through GitHub's private vulnerability reporting if enabled; otherwise contact the maintainer using an appropriate private channel.

## Security design targets

- Do not store cloud API keys in source files, workflow JSON, logs or Git history.
- No arbitrary execution of language-model output as Python, OpenSCAD, shell or operating-system commands.
- Validate all numerical CAD parameters and file paths; use sandboxed engine processes and execution timeouts.
- Keep cloud inference off by default; show users which data will leave the system.
- Never expose local Ollama, ComfyUI, CAD subprocess endpoints or filesystem operations without authentication and access control.
- Depend on explicit allowlisted engines and pinned compatible versions.
