"""Verify OCCT section route connects actual CAD solid to shared Web/Tauri UI.

Source contract is separate from optional OCP integration test.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class OCCTSectionContractTests(unittest.TestCase):
    def test_section_route_is_shared_between_backend_and_tauri_bridge(self):
        backend = (ROOT / "core/orkicad_core/studio_server.py").read_text(encoding="utf-8")
        bridge = (ROOT / "studio/frontend/src-tauri/src/lib.rs").read_text(encoding="utf-8")
        for content in (backend, bridge):
            self.assertIn('"/api/occt/section"', content)
        self.assertIn("render_occt_section(validated_spec(spec))", backend)

    def test_sections_are_real_occt_edges_not_stl_projections(self):
        worker = (ROOT / "core/orkicad_core/occt_section_worker.py").read_text(encoding="utf-8")
        for value in ("BRepAlgoAPI_Section", "gp_Pln", "TopExp_Explorer",
                      "BRepAdaptor_Curve", "GeomAbs_Line", "make_shape",
                      '"source": "occt-brep"', '"units": "mm"'):
            self.assertIn(value, worker)
        self.assertNotIn("trimesh", worker)
        self.assertNotIn("STL", worker)

    def test_ui_is_explicit_about_fallback_and_prevents_old_sections(self):
        viewer = (ROOT / "studio/frontend/src/BrepSectionView.tsx").read_text(encoding="utf-8")
        drawing = (ROOT / "studio/frontend/src/DrawingWorkspace.tsx").read_text(encoding="utf-8")
        for value in ("/api/occt/section", "sequence.current === current",
                      "nominal preview", "OCCT B-rep", "parseSection"):
            self.assertIn(value, viewer)
        self.assertIn("part === 'circular_plate'", drawing)
        self.assertIn("<BrepSectionView", drawing)
        self.assertIn("fallback={<ProjectionView", drawing)

    def test_external_occt_subprocess_does_not_execute_untrusted_source(self):
        executor = (ROOT / "core/orkicad_core/occt_section.py").read_text(encoding="utf-8")
        self.assertIn("validated_spec(spec)", executor)
        self.assertIn("resolve_occt_python", executor)
        self.assertIn("subprocess.run(", executor)
        self.assertIn("timeout=timeout", executor)
        self.assertNotIn("shell=True", executor)


if __name__ == "__main__":
    unittest.main()
