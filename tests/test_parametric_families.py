"""Regression tests for expanding the shared parametric library."""
import unittest

from orkicad_core.geometry import ParameterError, generate_scad
from orkicad_core.parts_catalog import PARTS, catalog_public, validated_spec


class NewParametricFamiliesTests(unittest.TestCase):
    def test_categories_are_server_driven(self):
        public = catalog_public()
        self.assertEqual(public["parts"]["solid_shaft"]["category"], "shafts")
        self.assertEqual(public["parts"]["hollow_tube"]["category"], "pipes")
        self.assertEqual(public["parts"]["angle_bracket"]["category"], "supports")
        self.assertEqual(set(public["parts"]), set(PARTS))

    def test_new_parts_have_valid_defaults(self):
        for kind in ("solid_shaft", "hollow_tube", "angle_bracket"):
            with self.subTest(kind=kind):
                spec = {"type": kind, **PARTS[kind]["fields"]}
                self.assertEqual(validated_spec(spec), spec)
                self.assertTrue(generate_scad(spec))

    def test_shaft_geometry_dimensions(self):
        scad = generate_scad({"type": "solid_shaft", "diameter": 16, "length": 120})
        self.assertIn("cylinder(h=120,d=16", scad)
        self.assertNotIn("difference()", scad)

    def test_hollow_tube_geometry_and_invalid_wall(self):
        spec = {"type": "hollow_tube", "outer_diameter": 30,
                "inner_diameter": 24, "length": 100}
        scad = generate_scad(spec)
        self.assertIn("difference()", scad)
        self.assertIn("cylinder(h=100,d=30", scad)
        self.assertIn("cylinder(h=100.2,d=24", scad)
        for inner in (30, 35):
            with self.assertRaises(ParameterError):
                validated_spec({**spec, "inner_diameter": inner})

    def test_angle_bracket_has_two_joined_legs(self):
        spec = {"type": "angle_bracket", "width": 40, "depth": 50,
                "height": 35, "thickness": 4}
        scad = generate_scad(spec)
        self.assertIn("union()", scad)
        self.assertIn("cube([40,50,4])", scad)
        self.assertIn("cube([40,4,35])", scad)
        with self.assertRaises(ParameterError):
            validated_spec({**spec, "thickness": 35})

    def test_native_step_shapes_when_occt_available(self):
        try:
            import OCP
        except ImportError:
            self.skipTest("OCP not installed")
        from orkicad_core.occt_worker import make_shape
        from OCP.BRepBndLib import BRepBndLib
        from OCP.Bnd import Bnd_Box
        samples = (
            ("solid_shaft", (16, 16, 120)),
            ("hollow_tube", (30, 30, 100)),
            ("angle_bracket", (40, 50, 35)),
        )
        for kind, expected in samples:
            with self.subTest(kind=kind):
                shape = make_shape({"type": kind, **PARTS[kind]["fields"]})
                bounds = Bnd_Box()
                BRepBndLib.Add_s(shape, bounds)
                x0, y0, z0, x1, y1, z1 = bounds.Get()
                # Expected extents derived from canonical catalog defaults
                if kind == "solid_shaft":
                    expected = (12, 12, 80)
                self.assertTrue(all(abs(actual - required) < 0.02 for actual, required
                                    in zip((x1-x0, y1-y0, z1-z0), expected)))


if __name__ == "__main__":
    unittest.main()
