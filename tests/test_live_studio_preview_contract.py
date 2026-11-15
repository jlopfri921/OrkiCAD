"""Guard interactive Web/Desktop CAD preview wiring and stale-response safety.

These source contract tests complement the React build. A browser-side
acceptance test is still required to prove real OpenSCAD responsiveness.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1] / "studio/frontend/src"


class LivePreviewContractTests(unittest.TestCase):
    def test_live_stl_uses_shared_web_desktop_api(self):
        code = (ROOT / "main.tsx").read_text(encoding="utf-8")
        for marker in (
            "const [livePreview, setLivePreview] = useState(true)",
            "const [previewPhase, setPreviewPhase]",
            "const [previewReady, setPreviewReady] = useState(false)",
            "useEffect(() => {",
            "previewAbort.current?.abort()",
            "controller.abort()",
            "serial !== previewSerial.current",
            "await apiFetch('/api/stl'",
            "requestedManual ? 0 : 650",
            "setPreviewPhase('ready')",
            "setPreviewPhase('error')",
            "showReferencePlanes={showReferencePlanes}",
            "cameraCommand={cameraCommand}",
            "type=\"checkbox\" checked={livePreview}",
            "onClick={renderSTL}",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, code)

    def test_mesh_is_not_blank_during_regeneration(self):
        code = (ROOT / "main.tsx").read_text(encoding="utf-8")
        update_start = code.index("  function updateParameter(")
        update_end = code.index("  function changeType(", update_start)
        update = code[update_start:update_end]
        self.assertNotIn("setStl(null)", update)
        self.assertIn("setPreviewReady(false)", update)
        self.assertIn("previewSerial.current += 1", update)

    def test_export_cannot_save_outdated_mesh(self):
        code = (ROOT / "main.tsx").read_text(encoding="utf-8")
        self.assertIn("if (!stl || !previewReady)", code)
        self.assertIn("if (stl && previewReady) openSave('stl')", code)
        self.assertIn("disabled={!stl || !previewReady}", code)

    def test_camera_state_survives_mesh_update(self):
        code = (ROOT / "STLViewer.tsx").read_text(encoding="utf-8")
        for marker in (
            "const lastCamera = useRef<",
            "lastCamera.current = {",
            "const previousCamera = lastCamera.current",
            "camera.position.copy(controls.target).addScaledVector(direction, distance)",
        ):
            self.assertIn(marker, code)

    def test_in_canvas_sliders_and_compact_inspector(self):
        code = (ROOT / "main.tsx").read_text(encoding="utf-8")
        self.assertIn("type=\"range\"", code)
        self.assertIn("canonicalNumber(Number(event.target.value)", code)
        self.assertIn("inspector-section-toggle", code)
        self.assertIn("expandedInspector === group", code)
        self.assertIn("camera-toolbar-group", code)


if __name__ == "__main__":
    unittest.main()
