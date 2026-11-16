"""Source-level contract for offline bilingual Studio learning UI and branding.

Run additionally with npm run build to compile TypeScript/React.
"""
from pathlib import Path
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "studio" / "frontend"


class StudioPromptGuideBrandingTests(unittest.TestCase):
    def test_example_library_is_bilingual_and_multi_level(self):
        guide = (FRONTEND / "src" / "PromptGuide.tsx").read_text(encoding="utf-8")
        self.assertIn("language: Language", guide)
        self.assertIn("const EXAMPLES:", guide)
        self.assertEqual(guide.count("level: 'basic'"), 3)
        self.assertEqual(guide.count("level: 'intermediate'"), 3)
        self.assertEqual(guide.count("level: 'advanced'"), 3)
        self.assertIn("selected.prompt[language]", guide)
        self.assertIn("setSelectedId(", guide)
        self.assertIn("onInsert(selected.prompt[language])", guide)
        self.assertIn("TIPS[language].map(", guide)
        self.assertIn("navigator.clipboard.writeText", guide)

    def test_examples_reference_registered_part_families(self):
        from orkicad_core.parts_catalog import PARTS
        guide = (FRONTEND / "src" / "PromptGuide.tsx").read_text(encoding="utf-8")
        for family in (
            "washer", "solid_shaft", "circular_plate", "mounting_plate",
            "open_box", "metric_screw", "corner_plate", "machined_block",
            "feature_model",
        ):
            self.assertIn(family, PARTS)
            self.assertIn(family, guide)

    def test_ui_displays_package_version_and_real_png(self):
        main = (FRONTEND / "src" / "main.tsx").read_text(encoding="utf-8")
        self.assertIn("import appPackage from '../package.json'", main)
        self.assertIn("v{appPackage.version}", main)
        self.assertIn('src="/logo_OrkiCAD-AI.png"', main)
        self.assertIn("<PromptGuide language={language}", main)
        self.assertTrue((ROOT / "logo_OrkiCAD-AI.png").is_file())

    def test_brand_asset_build_step_and_cross_client_version(self):
        package = json.loads((FRONTEND / "package.json").read_text(encoding="utf-8"))
        tauri = json.loads((FRONTEND / "src-tauri" / "tauri.conf.json").read_text(encoding="utf-8"))
        self.assertEqual(package["version"], tauri["version"])
        self.assertIn("node scripts/check-version.mjs", package["scripts"]["predev"])
        self.assertIn("node scripts/prepare-branding.mjs", package["scripts"]["predev"])
        self.assertIn("node scripts/check-version.mjs", package["scripts"]["prebuild"])
        self.assertIn("node scripts/prepare-branding.mjs", package["scripts"]["prebuild"])
        script = (FRONTEND / "scripts" / "prepare-branding.mjs").read_text(encoding="utf-8")
        self.assertIn("logo_OrkiCAD-AI.png", script)
        self.assertIn("copyFileSync", script)

    def test_about_dialog_and_version_guard(self):
        main = (FRONTEND / "src" / "main.tsx").read_text(encoding="utf-8")
        about = (FRONTEND / "src" / "AboutDialog.tsx").read_text(encoding="utf-8")
        package = json.loads((FRONTEND / "package.json").read_text(encoding="utf-8"))
        tauri = json.loads((FRONTEND / "src-tauri" / "tauri.conf.json").read_text(encoding="utf-8"))
        changelog = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
        guard = (FRONTEND / "scripts" / "check-version.mjs").read_text(encoding="utf-8")
        self.assertIn("AboutDialog", main)
        self.assertIn("Acerca de OrkiCAD AI", about)
        self.assertIn("Jorge López Frías", about)
        self.assertIn("OCCT / Open CASCADE", about)
        self.assertIn("Licencia propia del proyecto: pendiente", about)
        self.assertIn("COMFYUI", (ROOT / "docs" / "COMFYUI_PARITY.md").read_text(encoding="utf-8").upper())
        self.assertEqual(tauri["productName"], "OrkiCAD AI Studio")
        self.assertEqual(tauri["app"]["windows"][0]["title"], "OrkiCAD AI Studio")
        self.assertIn(f'Development build v{package["version"]}', changelog)
        self.assertIn("OrkiCAD AI version mismatch", guard)

    def test_technical_font_identity_remains_offline(self):
        css = (FRONTEND / "src" / "style.css").read_text(encoding="utf-8")
        self.assertIn("Bahnschrift", css)
        self.assertIn("Cascadia Code", css)
        self.assertIn("--font-technical", css)
        self.assertNotIn("@import url(", css)


if __name__ == "__main__":
    unittest.main()
