"""BOSL2 syntax generation tests (OpenSCAD rendering remains an integration test)."""
import unittest

from orkicad_core.geometry import ParameterError, generate_scad


class MechanicalTests(unittest.TestCase):
    def test_m6_socket_screw(self):
        scad = generate_scad({
            "type": "metric_screw", "diameter": 6, "pitch": 1,
            "length": 30, "head": "socket", "drive": "hex"
        })
        self.assertIn("include <BOSL2/screws.scad>", scad)
        self.assertIn('screw(spec="M6x1", length=30, head="socket", drive="hex")', scad)

    def test_m6_hex_nut(self):
        scad = generate_scad({
            "type": "metric_nut", "diameter": 6, "pitch": 1,
            "shape": "hex", "thickness": "normal"
        })
        self.assertIn('nut(spec="M6x1", shape="hex", thickness="normal")', scad)

    def test_gear(self):
        scad = generate_scad({
            "type": "spur_gear", "module": 2, "teeth": 24,
            "thickness": 8, "shaft_diameter": 8
        })
        self.assertIn("include <BOSL2/gears.scad>", scad)
        self.assertIn("spur_gear(mod=2, teeth=24, thickness=8, shaft_diam=8", scad)

    def test_no_injection(self):
        bad = [
            {"type": "metric_screw", "diameter": "6); sphere(100);", "length": 30},
            {"type": "metric_screw", "diameter": 6, "length": 30,
             "head": 'socket"); sphere(100); //'},
            {"type": "metric_screw", "diameter": 6, "length": -1},
            {"type": "metric_nut", "diameter": 6, "shape": "octagon"},
            {"type": "metric_nut", "diameter": 6, "thickness": "huge"},
            {"type": "spur_gear", "module": 2, "teeth": 24.4,
             "thickness": 8, "shaft_diameter": 8},
            {"type": "spur_gear", "module": 2, "teeth": 12,
             "thickness": 8, "shaft_diameter": 30},
        ]
        for spec in bad:
            with self.subTest(spec=spec), self.assertRaises(ParameterError):
                generate_scad(spec)


if __name__ == "__main__":
    unittest.main()
