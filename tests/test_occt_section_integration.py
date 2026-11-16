"""Real OCCT/OCP B-rep XZ section smoke test (optional native dependency).

This test performs a genuine OCCT boolean section, unlike source-contract
tests. It is skipped explicitly if the runtime lacks OCP.
"""
from __future__ import annotations

import unittest

try:
    import OCP  # noqa: F401
except ImportError:
    HAS_OCCT = False
else:
    HAS_OCCT = True

from orkicad_core.parts_catalog import validated_spec


@unittest.skipUnless(HAS_OCCT, "cadquery-ocp is not installed in this interpreter")
class OCCTSectionIntegrationTests(unittest.TestCase):
    def test_circular_plate_actual_section_has_outer_and_inner_boundaries(self):
        from orkicad_core.occt_section_worker import section_catalog_part
        spec = validated_spec({
            "type": "circular_plate", "outer_radius": 50, "thickness": 4,
            "hole_count": 5, "hole_diameter": 3, "bolt_circle_radius": 20,
        })
        result = section_catalog_part(spec)
        self.assertEqual(result["source"], "occt-brep")
        self.assertEqual(result["plane"]["name"], "XZ")
        self.assertEqual(result["plane"]["normal"], [0, 1, 0])
        self.assertEqual(result["units"], "mm")
        edges = result["segments"]
        self.assertEqual(len(edges), 8)
        vertices = {(round(x, 3), round(z, 3)) for edge in edges for x, z in edge}
        for expected in (
            (-50, 0), (-50, 4), (50, 0), (50, 4),
            (18.5, 0), (18.5, 4), (21.5, 0), (21.5, 4),
        ):
            self.assertIn(expected, vertices)
        # The Y=0 plane intersects just the one hole with angular index 0;
        # other pattern holes are off-plane and must not be fabricated.
        self.assertEqual(len(vertices), 8)

    def test_actual_analytic_annulus_and_shaft_sections(self):
        from orkicad_core.occt_section_worker import section_catalog_part
        for spec, expected_count in (
            ({"type": "solid_shaft", "diameter": 12, "length": 80}, 4),
            ({"type": "washer", "outer_diameter": 18, "inner_diameter": 6.5, "thickness": 2}, 8),
            ({"type": "hollow_tube", "outer_diameter": 30, "inner_diameter": 24, "length": 100}, 8),
        ):
            with self.subTest(part=spec["type"]):
                result = section_catalog_part(validated_spec(spec))
                self.assertEqual(result["plane"]["name"], "XZ")
                self.assertEqual(len(result["segments"]), expected_count)

    def test_unsupported_part_rejected_as_brep_section(self):
        from orkicad_core.occt_section_worker import section_catalog_part
        # Washer has been supported since the four-family milestone.
        # A machined block still requires its own genuine B-rep section.
        with self.assertRaisesRegex(ValueError, "circular_plate"):
            section_catalog_part({"type": "machined_block"})


if __name__ == "__main__":
    unittest.main()
