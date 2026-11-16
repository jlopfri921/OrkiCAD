"""Source contract: Studio-only safe AI preferences and rounded Web/Tauri identity."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "studio/frontend/src"


class AIPreferencesContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.main = (SRC / "main.tsx").read_text(encoding="utf-8")
        cls.prefs = (SRC / "aiPreferences.ts").read_text(encoding="utf-8")
        cls.style = (SRC / "style.css").read_text(encoding="utf-8")
        cls.icon = (ROOT / "studio/build_brand_icon.py").read_text(encoding="utf-8")

    def test_settings_are_collapsed_by_default(self):
        self.assertIn('<details className="ai-settings-accordion">', self.main)
        self.assertIn('className="ai-settings-summary"', self.main)
        self.assertIn('className="ai-settings-fields"', self.main)
        self.assertIn("ai-settings-accordion[open]", self.style)
        self.assertNotIn('<details open className="ai-settings-accordion"', self.main)

    def test_provider_and_per_provider_models_restored(self):
        self.assertIn("useState(readAIPreferences)", self.main)
        self.assertIn("writeAIPreferences({ provider: aiProvider", self.main)
        self.assertIn("modelsByProvider.current[selected]", self.main)
        self.assertIn("aiProviderRef.current === 'ollama'", self.main)
        self.assertIn("orkicad-ai:studio:ai-preferences:v1", self.prefs)
        self.assertIn("normalizeAIPreferences", self.prefs)
        self.assertIn("window.localStorage.setItem(AI_PREFERENCES_KEY, JSON.stringify(safe))", self.prefs)

    def test_no_cloud_secrets_saved_and_studio_only_boundary(self):
        self.assertNotIn("apiKey", self.prefs)
        self.assertNotIn("api_key", self.prefs)
        self.assertNotIn("sessionStorage", self.main)
        self.assertIn("setApiKey('')", self.main)
        roadmap = (ROOT / "docs/AI_CONFIGURATION.md").read_text(encoding="utf-8")
        self.assertIn("not an account", roadmap)
        self.assertIn("ComfyUI", roadmap)

    def test_rounded_framed_logo(self):
        self.assertIn("border-radius:13px", self.style)
        self.assertIn("studio-brand-logo", self.style)
        self.assertIn("draw.rounded_rectangle", self.icon)
        self.assertIn('outline="#819da9"', self.icon)


if __name__ == "__main__":
    unittest.main()
