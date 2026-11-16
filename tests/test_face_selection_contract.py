"""Source-level CAD viewport -> inspector selection regression tests.

A user/browser acceptance run is still needed to validate Three.js hit testing.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1] / "studio/frontend/src"


class FaceSelectionContractTests(unittest.TestCase):
    def test_viewer_uses_raycaster_without_disabling_orbit(self):
        code = (ROOT / "STLViewer.tsx").read_text(encoding="utf-8")
        for marker in (
            "new THREE.Raycaster()",
            "new OrbitControls(camera, renderer.domElement)",
            "onPointerDown",
            "onPointerUp",
            "raycaster.intersectObject(mesh, false)",
            "hit.face.normal",
            "showSelectedFace",
            "onSelect.current?.(",
            "dragged",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, code)

    def test_same_web_desktop_editor_focuses_related_dimension(self):
        app = (ROOT / "main.tsx").read_text(encoding="utf-8")
        mapping = (ROOT / "selection.ts").read_text(encoding="utf-8")
        for marker in (
            "onFaceSelect={selectModelFace}",
            "fieldForSelectedFace(type, face, Object.keys(params))",
            "input.scrollIntoView(",
            "input.focus({ preventScroll: true })",
            "selectedDimension === name ? 'param-focused'",
        ):
            self.assertIn(marker, app)
        self.assertIn("feature_model", mapping)
        self.assertIn("mounting_plate", mapping)
        self.assertIn("return candidates.find", mapping)

    def test_does_not_falsely_claim_mesh_semantic_feature_identity(self):
        code = (ROOT / "selection.ts").read_text(encoding="utf-8")
        self.assertIn("STL knows triangles", code)
        self.assertIn("return candidates.find(key => available.includes(key)) ?? null", code)


if __name__ == "__main__":
    unittest.main()
