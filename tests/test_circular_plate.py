"""Circular outline and bolt-circle regression tests for all OrkiCAD clients."""
import math
import re
import unittest

from orkicad_core.geometry import ParameterError, generate_scad
from orkicad_core.parts_catalog import PARTS, catalog_public, validated_spec
from orkicad_core.ai_interpreter import AIError, validate_prompt_shape
from orkicad_core.circular_prompt import parse_explicit_circular_plate


SPEC = {
    "type": "circular_plate",
    "outer_radius": 50,
    "thickness": 4,
    "hole_count": 5,
    "hole_diameter": 3,
    "bolt_circle_radius": 20,
}
SPANISH_PROMPT = (
    "Diseña una placa circular sin esquinas de 50 mm de radio, "
    "5 orificios de 3 mm en matriz circular a 20 mm del centro y 4 mm de grosor"
)


class CircularPlateTests(unittest.TestCase):
    def test_catalog_has_portable_radial_pattern_schema(self):
        self.assertEqual(validated_spec(SPEC), SPEC)
        self.assertEqual(PARTS["circular_plate"]["fields"]["hole_count"], 5)
        self.assertIn("circular_plate", catalog_public()["parts"])

    def test_genuine_disk_not_square_with_inner_circle(self):
        source = generate_scad(SPEC)
        self.assertIn("cylinder(h=4,r=50,$fn=192);", source)
        self.assertNotIn("cube(", source)
        self.assertNotIn("square(", source)
        self.assertEqual(source.count("cylinder("), 6)
        self.assertEqual(source.count("d=3"), 5)

    def test_five_hole_centers_follow_exact_20mm_pitch_circle(self):
        source = generate_scad(SPEC)
        matches = re.findall(r"translate\(\[([^,]+),([^,]+),-0\.1\]\)", source)
        self.assertEqual(len(matches), 5)
        coords = [(float(x), float(y)) for x, y in matches]
        for x, y in coords:
            self.assertAlmostEqual(math.hypot(x, y), 20, places=7)
        angles = sorted((math.degrees(math.atan2(y, x)) % 360) for x, y in coords)
        for a, b in zip(angles, angles[1:] + [angles[0] + 360]):
            self.assertAlmostEqual(b - a, 72, places=6)

    def test_reject_holes_outside_disk_or_overlapping(self):
        for values in (
            {"bolt_circle_radius": 49},
            {"hole_diameter": 40},
            {"hole_count": 0},
            {"hole_count": 5.5},
            {"hole_count": 65},
            {"hole_count": True},
        ):
            with self.subTest(values=values):
                with self.assertRaises(ParameterError):
                    validated_spec({**SPEC, **values})

    def test_exact_user_prompt_creates_disk_without_ai_guesswork(self):
        raw = (
            "diseña una placa circular y por tanto sin esquinas, no quiero una pieza "
            "cuadrada, tiene que ser un circulo de 50 mm de radio y con un cinco "
            "orificios circulares de 3 mm de diametro que formen una matriz "
            "circular a 20 mm del centro de la circunferencia principal el "
            "centro de estos orificios. la placa tiene 4 mm de grosor"
        )
        self.assertEqual(parse_explicit_circular_plate(raw), SPEC)
        self.assertNotIn("cube(", generate_scad(parse_explicit_circular_plate(raw)))

    def test_incomplete_prompt_never_invents_drilling_pattern(self):
        self.assertIsNone(parse_explicit_circular_plate(
            "Diseña una placa circular de 50 mm de radio y 4 mm de grosor"
        ))

    def test_spanish_intent_refuses_rectangle_from_ai(self):
        self.assertEqual(validate_prompt_shape(SPANISH_PROMPT, SPEC), SPEC)
        with self.assertRaisesRegex(AIError, "circular plate"):
            validate_prompt_shape(SPANISH_PROMPT, {
                "type": "mounting_plate",
                "width": 100, "depth": 100, "thickness": 4,
                "hole_diameter": 3, "hole_inset": 20,
            })

    def test_ordinary_rectangular_plate_with_circle_is_not_rejected(self):
        request = "Diseña una placa cuadrada con un círculo dibujado dentro"
        spec = {"type": "mounting_plate"}
        self.assertEqual(validate_prompt_shape(request, spec), spec)

    def test_studio_never_displays_old_square_for_new_circular_family(self):
        from pathlib import Path
        root = Path(__file__).resolve().parents[1]
        main = (root / "studio/frontend/src/main.tsx").read_text(encoding="utf-8")
        # Both AI acceptance and part picker clear the previously displayed
        # mesh. Old shapes can still be retained for edits within one family.
        for marker in (
            "setStl(null)",
            "setShowCircularPlan(nextType === 'circular_plate')",
            "setShowCircularPlan(next === 'circular_plate')",
            "body.parts.circular_plate",
            "El servidor CAD es una versión anterior",
            "<CircularPlatePlan",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, main)
        viewer = (root / "studio/frontend/src/STLViewer.tsx").read_text(encoding="utf-8")
        self.assertIn("opacity: 0,", viewer)
        diagram = (root / "studio/frontend/src/CircularPlatePlan.tsx").read_text(
            encoding="utf-8"
        )
        self.assertIn("2 * Math.PI * i / holeCount", diagram)

    def test_native_occt_shape_when_ocp_installed(self):
        try:
            import OCP
        except ImportError:
            self.skipTest("OCP runtime not installed in active test interpreter")
        from orkicad_core.occt_worker import make_shape
        from OCP.Bnd import Bnd_Box
        from OCP.BRepBndLib import BRepBndLib
        from OCP.TopExp import TopExp_Explorer
        from OCP.TopAbs import TopAbs_FACE
        shape = make_shape(SPEC)
        bounds = Bnd_Box()
        BRepBndLib.Add_s(shape, bounds)
        xmin, ymin, zmin, xmax, ymax, zmax = bounds.Get()
        for value, expected in zip((xmin, ymin, zmin, xmax, ymax, zmax),
                                   (-50, -50, 0, 50, 50, 4)):
            self.assertAlmostEqual(value, expected, delta=0.01)
        faces = TopExp_Explorer(shape, TopAbs_FACE)
        count = 0
        while faces.More():
            count += 1
            faces.Next()
        self.assertGreaterEqual(count, 7)


if __name__ == "__main__":
    unittest.main()
