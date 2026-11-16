"""Regressions for the first parametric straight bevel gear.

No BOSL2 or OCCT runtime required for source-level tests.
"""
import math
import unittest

from orkicad_core.bevel_gears import straight_bevel_dimensions
from orkicad_core.geometry import ParameterError, generate_scad
from orkicad_core.parts_catalog import PARTS, catalog_public, validated_spec


BASE = {
    "type": "bevel_gear_straight",
    "module": 2,
    "teeth": 20,
    "mate_teeth": 20,
    "shaft_angle": 90,
    "face_width": 8,
    "pressure_angle": 20,
    "bore_diameter": 8,
    "backlash": 0.1,
}


class StraightBevelTests(unittest.TestCase):
    def test_catalog_exposes_real_part_and_nested_category(self):
        entry = catalog_public()["parts"]["bevel_gear_straight"]
        self.assertEqual(entry["category"], "transmission")
        self.assertEqual(entry["subcategory"], "bevel")
        self.assertEqual(validated_spec(BASE), BASE)
        self.assertIn("spur_gear", PARTS)

    def test_miter_pair_pitch_cones_are_45_degrees(self):
        result = straight_bevel_dimensions(BASE)
        self.assertAlmostEqual(result["pitch_cone_angle"], 45, places=7)
        self.assertAlmostEqual(result["mate_pitch_cone_angle"], 45, places=7)
        self.assertAlmostEqual(result["outer_pitch_diameter"], 40, places=7)
        self.assertAlmostEqual(result["outer_cone_distance"], 20 * math.sqrt(2), places=6)

    def test_unequal_teeth_use_complementary_cone_angles(self):
        spec = {**BASE, "mate_teeth": 30}
        result = straight_bevel_dimensions(spec)
        self.assertAlmostEqual(result["pitch_cone_angle"] + result["mate_pitch_cone_angle"], 90)
        self.assertLess(result["pitch_cone_angle"], 45)

    def test_generates_bosl2_bevel_not_fake_wedges(self):
        source = generate_scad(BASE)
        self.assertIn("include <BOSL2/gears.scad>", source)
        self.assertIn("bevel_gear(", source)
        self.assertIn("mate_teeth=20", source)
        self.assertIn("shaft_angle=90", source)
        self.assertIn("spiral=0", source)
        self.assertNotIn("cube(", source)
        self.assertNotIn("polyhedron(", source)

    def test_invalid_types_and_geometry_are_rejected(self):
        bad = (
            {"teeth": True},
            {"mate_teeth": 12.5},
            {"shaft_angle": 0},
            {"shaft_angle": 180},
            {"module": float("nan")},
            {"pressure_angle": 27},
            {"face_width": 15},
            {"bore_diameter": 40},
            {"backlash": -0.1},
            {"backlash": float("inf")},
        )
        for changes in bad:
            with self.subTest(changes=changes):
                with self.assertRaises(ParameterError):
                    validated_spec({**BASE, **changes})


if __name__ == "__main__":
    unittest.main()
