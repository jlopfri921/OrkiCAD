"""Protect one shared feature viewport implementation across all three clients."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class SharedUIParityTests(unittest.TestCase):
    def test_framework_neutral_viewport_identical_for_clients(self):
        canonical = (ROOT / "shared/ui/feature_viewport.js").read_bytes()
        self.assertTrue(canonical)
        for child in (
            "studio/frontend/src/feature_viewport.js",
            "comfyui/orkicad_nodes/web/feature_viewport.js",
        ):
            with self.subTest(client=child):
                self.assertEqual((ROOT / child).read_bytes(), canonical)

    def test_no_comfyui_dependency_in_shared_viewer(self):
        viewer = (ROOT / "shared/ui/feature_viewport.js").read_text(
            encoding="utf-8"
        )
        self.assertIn("export function createFeatureViewport", viewer)
        self.assertNotIn("../../scripts/app.js", viewer)
        self.assertNotIn("from 'three'", viewer)


if __name__ == "__main__":
    unittest.main()
