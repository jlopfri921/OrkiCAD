"""First geometry tests; OpenSCAD execution tested separately on target system."""
import json
import tempfile
import unittest
from pathlib import Path

from orkicad_core.cli import main
from orkicad_core.geometry import ParameterError, generate_scad


class GeometryTests(unittest.TestCase):
    def test_washer(self):
        src = generate_scad({
            "type": "washer", "outer_diameter": 18,
            "inner_diameter": 6.5, "thickness": 2,
        })
        self.assertIn("difference()", src)
        self.assertIn("d=18", src)
        self.assertIn("d=6.5", src)

    def test_plate(self):
        src = generate_scad({
            "type": "mounting_plate", "width": 80, "depth": 50,
            "thickness": 5, "hole_diameter": 5, "hole_inset": 10,
        })
        self.assertEqual(src.count("cylinder("), 4)
        self.assertIn("cube([80,50,5])", src)

    def test_box(self):
        src = generate_scad({
            "type": "open_box", "width": 60, "depth": 40,
            "height": 25, "wall": 2,
        })
        self.assertIn("cube([56,36,25])", src)

    def test_invalid_dimensions(self):
        for spec in (
            {"type": "washer", "outer_diameter": 8, "inner_diameter": 9, "thickness": 2},
            {"type": "open_box", "width": 20, "depth": 20, "height": 4, "wall": 3},
            {"type": "washer", "outer_diameter": True, "inner_diameter": 3, "thickness": 1},
            {"type": "washer", "outer_diameter": float("nan"), "inner_diameter": 3, "thickness": 1},
            {"type": "unknown"},
        ):
            with self.subTest(spec=spec):
                with self.assertRaises(ParameterError):
                    generate_scad(spec)

    def test_cli_scad(self):
        with tempfile.TemporaryDirectory() as tmp:
            spec = Path(tmp) / "spec.json"
            out = Path(tmp) / "result.scad"
            spec.write_text(json.dumps({
                "type": "washer", "outer_diameter": 20,
                "inner_diameter": 8, "thickness": 1.5,
            }), encoding="utf-8")
            self.assertEqual(main([str(spec), "-o", str(out)]), 0)
            self.assertTrue(out.is_file())


if __name__ == "__main__":
    unittest.main()
