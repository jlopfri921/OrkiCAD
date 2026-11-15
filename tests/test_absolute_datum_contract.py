"""Source-level regression of absolute CAD datum planes and operation anchors."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1] / "studio/frontend/src"


class DatumPlaneContractTests(unittest.TestCase):
    def test_three_origin_planes_are_not_mesh_centroid(self):
        viewer = (ROOT / "STLViewer.tsx").read_text(encoding="utf-8")
        for expected in (
            "const worldCenter = worldBounds.getCenter",
            "geometry.center()",
            "datum.position.copy(worldCenter).multiplyScalar(-1)",
            "'XY · Z=0'",
            "'XZ · Y=0'",
            "'YZ · X=0'",
            "new THREE.AxesHelper",
            "datum.add(origin)",
            "datum.visible = showReferencePlanes",
            "references.current.visible = showReferencePlanes",
        ):
            with self.subTest(marker=expected):
                self.assertIn(expected, viewer)

    def test_viewport_shows_user_toggle_and_global_origin_explanation(self):
        app = (ROOT / "main.tsx").read_text(encoding="utf-8")
        for marker in (
            "setShowReferencePlanes",
            "showReferencePlanes={showReferencePlanes}",
            "className=\"datum-legend\"",
            "XY · Z=0",
            "XZ · Y=0",
            "YZ · X=0",
            "Origen absoluto",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, app)

    def test_comfyui_and_studio_use_identical_absolute_plane_schematic(self):
        root = ROOT.parents[3]
        canonical = (root / "shared/ui/feature_viewport.js").read_text(encoding="utf-8")
        for path in (
            root / "comfyui/orkicad_nodes/web/feature_viewport.js",
            root / "studio/frontend/src/feature_viewport.js",
        ):
            with self.subTest(path=path.name):
                self.assertEqual(path.read_text(encoding="utf-8"), canonical)
        for marker in ('name:"XY"', 'name:"XZ"', 'name:"YZ"',
                       'map([0,0,0])', 'originLabel.textContent="0,0,0"'):
            self.assertIn(marker, canonical)

    def test_operation_placement_preserves_global_origin(self):
        anchors = (ROOT / "featureAnchors.ts").read_text(encoding="utf-8")
        editor = (ROOT / "FeatureOperationsEditor.tsx").read_text(encoding="utf-8")
        self.assertIn("anchor === 'absolute-origin'", anchors)
        self.assertIn("position: [0, 0, 0]", anchors)
        self.assertIn("w / 2 - (feature.size?.[0] ?? 0) / 2", anchors)
        self.assertIn("feature.shape === 'box'", anchors)
        for marker in ("absolute-origin", "base-center", "top-center", "anchoredFeature("):
            self.assertIn(marker, editor)


if __name__ == "__main__":
    unittest.main()
