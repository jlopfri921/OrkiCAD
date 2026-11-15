"""Static parity checks for the shared Web + Desktop Studio workspace."""
from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "studio" / "frontend"


class StudioWorkspaceContractTests(unittest.TestCase):
    def test_one_react_ui_contains_modern_cad_workbench(self):
        src = (WEB / "src/main.tsx").read_text(encoding="utf-8")
        for marker in (
            'className="studio-topbar"',
            'className="assistant-sidebar',
            'className="studio-center"',
            'className="properties-sidebar',
            'className="viewport-frame"',
            'className="output-bar"',
            'className="studio-statusbar"',
            'className="ai-prompt"',
            'onClick={interpretPrompt}',
            'onClick={() => exportFormat(\'step\')}',
            'onClick={() => exportFormat(\'3mf\')}',
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, src)

    def test_desktop_uses_same_react_source_and_private_transport(self):
        src = (WEB / "src/api.ts").read_text(encoding="utf-8")
        self.assertIn("invoke<DesktopReply>('studio_request'", src)
        self.assertIn("return fetch(path, options)", src)
        config = json.loads(
            (WEB / "src-tauri/tauri.conf.json").read_text(encoding="utf-8")
        )
        self.assertEqual(config["build"]["frontendDist"], "../dist")
        self.assertFalse(config["bundle"]["active"])
        shell = (WEB / "src-tauri/src/lib.rs").read_text(encoding="utf-8")
        self.assertIn('"/api/step"', shell)
        self.assertIn('"/api/3mf"', shell)
        self.assertIn('ORKICAD_STUDIO_TOKEN', shell)
        self.assertIn('ORKICAD_STUDIO_PORT', shell)
        self.assertIn(".no_proxy()", shell)

    def test_developer_icon_created_before_tauri_build(self):
        builder = (WEB / "src-tauri/build.rs").read_text(encoding="utf-8")
        self.assertIn('join("icons")', builder)
        self.assertIn('join("icon.ico")', builder)
        self.assertIn("create_windows_dev_icon()", builder)
        self.assertLess(builder.index("create_windows_dev_icon().expect"),
                        builder.index("tauri_build::build()"))

    def test_ollama_models_can_be_refreshed_when_worker_starts_late(self):
        code = (WEB / "src/main.tsx").read_text(encoding="utf-8")
        self.assertIn("async function refreshOllamaModels()", code)
        self.assertIn("onClick={refreshOllamaModels}", code)
        self.assertIn("apiFetch('/api/ollama/models')", code)

    def test_accessible_and_responsive_styling(self):
        css = (WEB / "src/style.css").read_text(encoding="utf-8")
        for marker in (
            "focus-visible", "prefers-reduced-motion",
            "@media(max-width:1200px)", "@media(max-width:760px)",
            ".viewport-frame", ".studio-main",
        ):
            self.assertIn(marker, css)


if __name__ == "__main__":
    unittest.main()
