"""Source contracts for the initial 2D / 3D / technical drawing workspaces.

A TypeScript build and Windows UI acceptance are still required separately.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1] / "studio/frontend/src"


class ThreeWorkspacesContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.main = (ROOT / "main.tsx").read_text(encoding="utf-8")
        cls.drawing = (ROOT / "DrawingWorkspace.tsx").read_text(encoding="utf-8")
        cls.css = (ROOT / "style.css").read_text(encoding="utf-8")

    def test_three_tabs_share_active_part_and_ai_prompt(self):
        for value in ('2d', '3d', 'drawings'):
            self.assertIn(f"'{value}'", self.main)
        self.assertIn("setWorkspace(next)", self.main)
        self.assertIn("workspace === '3d' ? <>", self.main)
        self.assertIn("mode={workspace} part={type} parameters={params}", self.main)
        self.assertIn('id="cad-ai-prompt"', self.main)
        self.assertIn("parametric-catalog", self.main)

    def test_dimension_switch_is_shared_between_workspaces(self):
        self.assertIn("const [showDimensions, setShowDimensions] = useState(true)", self.main)
        self.assertIn("onToggleDimensions={setShowDimensions}", self.main)
        self.assertIn("Cotas nominales", self.main)
        self.assertIn("Valores del diseño, no medidos del STL", self.main)
        self.assertIn("Nominal dimensions", self.drawing)

    def test_orthographic_views_and_safe_section_constraints(self):
        self.assertIn("'top' | 'front' | 'side' | 'section'", self.drawing)
        self.assertIn("Planta XY", self.drawing)
        self.assertIn("Alzado XZ", self.drawing)
        self.assertIn("Perfil YZ", self.drawing)
        self.assertIn("Sección XZ", self.drawing)
        self.assertIn("if (isSection && !supportedSection)", self.drawing)
        self.assertIn("no se mostrará una sección inventada", self.drawing)
        self.assertIn("No approximate section is presented", self.drawing)

    def test_geometry_preservation_and_invalid_dimension_warnings(self):
        for part in ("washer", "solid_shaft", "hollow_tube",
                     "circular_plate", "mounting_plate", "open_box",
                     "angle_bracket", "corner_plate", "machined_block"):
            self.assertIn(f"part === '{part}'", self.drawing)
        self.assertIn("explainPrimitiveIssue", self.drawing)
        self.assertIn("holeDiameter < 2 * boltCircleRadius * Math.sin(Math.PI / count)", self.drawing)
        self.assertIn("Los taladros se solapan", self.drawing)
        self.assertIn("Unknown shapes never turn into boxes", self.drawing)

    def test_supported_nominal_sections_use_real_catalog_constraints(self):
        for marker in ("v.shape === 'disk'", "v.shape === 'circular_plate'",
                       "v.shape === 'mounting'", "v.shape === 'corner_plate'",
                       "v.shape === 'machined_block'", "v.shape === 'box'",
                       "v.shape === 'angle_bracket'"):
            self.assertIn(marker, self.drawing)
        self.assertIn("radialHoleSlices", self.drawing)
        self.assertIn("v.depth / 2 > v.wall", self.drawing)
        self.assertIn("v.pocketCutDepth * scale", self.drawing)
        self.assertIn("no se mostrará una sección inventada", self.drawing)
        self.assertIn("No sustituye a una sección B-rep verificada", self.drawing)

    def test_simplified_projections_have_real_profile_shapes(self):
        self.assertIn("angleBracket && !isTop && projection === 'side'", self.drawing)
        self.assertIn("cornerPlate && isTop && v.cornerSize", self.drawing)
        self.assertIn("machinedBlock && v.pocketWidth", self.drawing)
        self.assertIn("machinedBlock && v.holeDiameter", self.drawing)
        self.assertIn("A ${radius} ${radius}", self.drawing)

    def test_workspaces_are_responsive(self):
        self.assertIn(".cad-workspace-tabs", self.css)
        self.assertIn(".cad-drawing-canvas", self.css)
        self.assertIn(".cad-3d-dimension-hud", self.css)
        self.assertIn("@media(max-width:830px)", self.css)


if __name__ == "__main__":
    unittest.main()
