"""Guard against editing a previously rendered mesh with new CAD parameters.

These source-level contracts complement the real browser/Tauri visual acceptance.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1] / "studio/frontend/src"


class StaleMeshSafetyTests(unittest.TestCase):
    def test_stale_preview_disables_face_picking_without_blocking_camera(self):
        viewer = (ROOT / "STLViewer.tsx").read_text(encoding="utf-8")
        app = (ROOT / "main.tsx").read_text(encoding="utf-8")
        self.assertIn("selectionEnabled?: boolean", viewer)
        self.assertIn("allowSelect.current = selectionEnabled", viewer)
        self.assertIn("if (!allowSelect.current)", viewer)
        self.assertIn("clearCurrentHighlight.current?.()", viewer)
        self.assertIn("selectionEnabled={previewReady}", app)
        self.assertIn("face selection paused", app)

    def test_previous_geometry_is_explicitly_labeled_during_rebuild(self):
        app = (ROOT / "main.tsx").read_text(encoding="utf-8")
        self.assertIn("{stl && !previewReady &&", app)
        self.assertIn("does not match current dimensions", app)
        self.assertIn("Vista anterior", app)

    def test_dimension_edit_cannot_target_stale_selection(self):
        app = (ROOT / "main.tsx").read_text(encoding="utf-8")
        self.assertIn("selectedFace && previewReady && selectedDimension", app)
        self.assertIn("disabled={!stl || !previewReady}", app)


if __name__ == "__main__":
    unittest.main()
