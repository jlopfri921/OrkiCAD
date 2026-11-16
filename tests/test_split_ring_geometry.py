"""Acceptance: annular sector removed along the OUTER arc, with radial edges."""
import math
import re
import unittest

from orkicad_core.geometry import ParameterError, generate_scad
from orkicad_core.parts_catalog import validated_spec
from orkicad_core.split_ring_prompt import parse_split_ring, requests_radial_ring_cut


PROMPT = (
    "haz una pieza circular de 40 mm y una oquedad interna circular de "
    "10 mm de radio. Además debe tener el aro resultante un corte completo "
    "de 20 mm de distancia en el arco exterior o circunferencia exterior "
    "y las lineas de corte transversales de la sección son radios de la circunferencia."
)


class OpenRingTests(unittest.TestCase):
    def test_exact_user_request_is_split_ring_not_square(self):
        self.assertTrue(requests_radial_ring_cut(PROMPT))
        spec, assumptions = parse_split_ring(PROMPT)
        self.assertIsNotNone(spec)
        self.assertEqual(spec["type"], "split_ring")
        self.assertEqual(spec["outer_diameter"], 40)
        self.assertEqual(spec["inner_radius"], 10)
        self.assertEqual(spec["outer_arc_gap"], 20)
        self.assertEqual(spec["thickness"], 4)
        self.assertTrue(any("Espesor" in note for note in assumptions))

    def test_geometry_is_closed_annular_sector_with_two_radial_ends(self):
        spec, _ = parse_split_ring(PROMPT)
        scad = generate_scad(spec)
        self.assertTrue(scad.startswith("// Open ring"))
        self.assertIn("\nlinear_extrude", scad)
        self.assertIn("polygon(points=[", scad)
        self.assertNotIn("square(", scad)
        self.assertNotIn("cube(", scad)
        source = scad.split("polygon(points=[", 1)[1]
        coords = [
            (float(x), float(y))
            for x, y in re.findall(r"\[(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\]", source)
        ]
        n = len(coords)
        self.assertGreater(n, 180)
        outer_count = n // 2
        self.assertEqual(n % 2, 0)
        outer_start, outer_end = coords[0], coords[outer_count - 1]
        inner_end, inner_start = coords[outer_count], coords[-1]
        def dist(point):
            return math.hypot(*point)
        for p in (outer_start, outer_end):
            self.assertAlmostEqual(dist(p), 20, places=5)
        for p in (inner_start, inner_end):
            self.assertAlmostEqual(dist(p), 10, places=5)
        self.assertAlmostEqual(math.atan2(outer_start[1], outer_start[0]),
                               math.atan2(inner_start[1], inner_start[0]), places=5)
        self.assertAlmostEqual(math.atan2(outer_end[1], outer_end[0]),
                               math.atan2(inner_end[1], inner_end[0]), places=5)
        # Removed length, not chord: for R=20 and s=20, theta must be 1 radian.
        theta = 20 / 20
        self.assertAlmostEqual(math.atan2(outer_start[1], outer_start[0]), theta / 2, places=6)

    def test_invalid_ring_dimensions_rejected(self):
        base = dict(type="split_ring", outer_diameter=40, inner_radius=10,
                    outer_arc_gap=20, thickness=4)
        for bad in (dict(inner_radius=20), dict(inner_radius=22),
                    dict(outer_arc_gap=126), dict(outer_arc_gap=0)):
            with self.subTest(bad=bad), self.assertRaises(ParameterError):
                validated_spec({**base, **bad})

    def test_missing_dimensions_never_become_rectangle(self):
        partial = "Crea un anillo circular con un corte radial en el arco exterior"
        self.assertTrue(requests_radial_ring_cut(partial))
        spec, missing = parse_split_ring(partial)
        self.assertIsNone(spec)
        self.assertEqual(missing, ["missing_split_ring_dimensions"])

    def test_complete_explicit_dimensions_do_not_add_assumptions(self):
        full = PROMPT + " El espesor es de 6 mm."
        spec, assumptions = parse_split_ring(full)
        self.assertEqual(spec["thickness"], 6)
        self.assertEqual(assumptions, [])


if __name__ == "__main__":
    unittest.main()
