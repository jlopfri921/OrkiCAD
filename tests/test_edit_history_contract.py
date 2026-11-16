"""Source-level contract for the first shared CAD edit undo/redo history.

TypeScript compilation in Web/Tauri CI is the runtime type safety gate;
this checks that undo/redo is connected to actual state and stale-view safety.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
FRONT = ROOT / "studio" / "frontend" / "src"


class CadEditHistoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.history = (FRONT / "editHistory.ts").read_text(encoding="utf-8")
        cls.main = (FRONT / "main.tsx").read_text(encoding="utf-8")
        cls.css = (FRONT / "style.css").read_text(encoding="utf-8")

    def test_history_is_bounded_immutable_and_clears_redo_on_new_edit(self):
        for marker in (
            "export const MAX_UNDO_STEPS = 50",
            "structuredClone(value.params)",
            "export function commitEdit",
            "export function undoEdit",
            "export function redoEdit",
            "future: []",
            "past: history.past.slice(0, -1)",
            "future: [copySnapshot(history.present), ...history.future]",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, self.history)

    def test_a_single_snapshot_drives_every_cad_workspace(self):
        for marker in (
            "const type = editHistory.present.type",
            "const params = editHistory.present.params",
            "setEditHistory(previous => commitEdit(previous",
            "setEditHistory(previous => undoEdit(previous))",
            "setEditHistory(previous => redoEdit(previous))",
            "setEditHistory(createEditHistory(saved.type as PartType",
            "onClick={undoChange}",
            "onClick={redoChange}",
            "Deshacer cambio CAD",
            "Rehacer cambio CAD",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, self.main)

    def test_history_changes_invalidate_3d_mesh_and_ai_proposal(self):
        self.assertIn("function resetPreviewForEdit(clearMesh = false)", self.main)
        for marker in ("previewSerial.current += 1", "previewAbort.current?.abort()",
                       "if (clearMesh) setStl(null)", "setPreviewReady(false)",
                       "setSelectedFace(null)", "setSelectedDimension(null)"):
            self.assertIn(marker, self.main)
        self.assertIn("resetPreviewForEdit(true)", self.main)
        self.assertIn("setAiNote('')", self.main)
        self.assertIn("setReviewApproved(false)", self.main)

    def test_shortcuts_ignore_text_fields(self):
        for marker in ("event.ctrlKey", "event.metaKey", "event.altKey",
                       "element.isContentEditable",
                       "element.closest('input, textarea, select",
                       "event.preventDefault()", "window.addEventListener('keydown', onKey)"):
            self.assertIn(marker, self.main)

    def test_design_revision_files_are_not_misrepresented_as_persistent_history(self):
        self.assertTrue((ROOT / "docs" / "EDIT_HISTORY.md").exists())
        self.assertIn("Native .okad schema v1 currently persists only the latest snapshot", self.history)
        self.assertIn(".studio-history-action", self.css)


if __name__ == "__main__":
    unittest.main()
