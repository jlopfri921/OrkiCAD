"""Contract coverage for shared exact-parameter circle editing in Web and Tauri.

These checks are not a substitute for TypeScript compilation or browser UI
acceptance, and do not certify any independent OCCT projection.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "studio" / "frontend" / "src"


class CircularSketchContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.model = (SRC / "sketchEntities.ts").read_text(encoding="utf-8")
        cls.viewer = (SRC / "CircularSketchWorkspace.tsx").read_text(encoding="utf-8")
        cls.drawing = (SRC / "DrawingWorkspace.tsx").read_text(encoding="utf-8")
        cls.app = (SRC / "main.tsx").read_text(encoding="utf-8")

    def test_sketch_geometry_has_typed_circles_arcs_and_lines(self):
        for token in ("kind: 'circle'", "kind: 'arc'", "kind: 'line'",
                      "export type SketchEntity", "type SketchPoint",
                      "center: SketchPoint", "startRad", "endRad",
                      "export function arcLength("):
            self.assertIn(token, self.model)

    def test_circular_catalog_families_share_only_true_circle_outlines(self):
        for kind in ("'washer'", "'hollow_tube'", "'solid_shaft'", "'circular_plate'"):
            self.assertIn(kind, self.model)
        self.assertIn("circle', id: 'outer-circle'", self.model)
        self.assertIn("circle', id: 'inner-circle'", self.model)
        self.assertIn("circle', id: 'bolt-pattern-reference'", self.model)
        self.assertIn("id: 'hole-' + i", self.model)
        self.assertIn("2 * Math.PI * i / count", self.model)
        self.assertIn("pitch + hole / 2 >= radius", self.model)
        self.assertIn("hole >= 2 * pitch * Math.sin(Math.PI / count)", self.model)
        self.assertIn("return null", self.model)
        self.assertNotIn("shape: 'rectangle'", self.model)

    def test_open_ring_reuses_analytic_arc_and_radial_segment_model(self):
        ring = (SRC / "SplitRingWorkspace.tsx").read_text(encoding="utf-8")
        for token in ("export function radialRingSketch(", "kind: 'arc'",
                      "kind: 'line'", "ring-outer-arc", "ring-inner-arc",
                      "ring-cut-start", "ring-cut-end", "removedOuterArc / (2 * radius)"):
            self.assertIn(token, self.model)
        self.assertIn("import { radialRingSketch", ring)
        self.assertIn("const model = radialRingSketch(outerDiameter, innerRadius, gapArc)", ring)

    def test_sketch_contours_are_selectable_and_have_driving_dimensions(self):
        for token in ("drivingDimension(entity)", "onClick={() => focusEntity(entity)}",
                      "onKeyDown={e =>", "onChangeParameter(field, value)",
                      "setSelectedId(entity.id)", "sketch.editableParameters.map(input)",
                      "selectedId", "disabled={!editable}"):
            self.assertIn(token, self.viewer)
        for field in ("outer_radius", "outer_diameter", "inner_diameter",
                      "hole_diameter", "bolt_circle_radius", "hole_count"):
            self.assertIn(field, self.viewer + self.model)

    def test_2d_and_xy_plans_use_same_geometry_without_fake_rectangle(self):
        self.assertIn("import CircularSketchWorkspace", self.drawing)
        self.assertIn("const useCircularSketch = view === 'top'", self.drawing)
        self.assertIn("<CircularSketchWorkspace", self.drawing)
        self.assertIn("editable={mode === '2d'}", self.drawing)
        self.assertIn("onChangeParameter={onChangeParameter}", self.drawing)
        self.assertIn("onChangeParameter={updateParameter}", self.app)

    def test_sketch_does_not_claim_false_native_brep_identity(self):
        self.assertIn("not an OCCT B-rep", self.model)
        self.assertIn("Nominal XY plan, not an OCCT HLR projection.", self.viewer)
        self.assertIn("never guessed from STL", self.viewer)


if __name__ == "__main__":
    unittest.main()
