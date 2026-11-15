"""Cross-platform actual B-rep STEP acceptance tests (requires cadquery-ocp).

Run in a dedicated OCCT interpreter, e.g. `python -m unittest tests.test_occt_integration -v`.
When the dependency is absent, these tests are explicitly skipped.
"""
from __future__ import annotations

import os
from pathlib import Path
import sys
import unittest

from orkicad_core.parts_catalog import PARTS
from orkicad_core.occt_step import render_occt_step


try:
    from OCP.STEPControl import STEPControl_Reader
    from OCP.IFSelect import IFSelect_RetDone
    from OCP.BRepCheck import BRepCheck_Analyzer
    from OCP.TopExp import TopExp_Explorer
    from OCP.TopAbs import TopAbs_SOLID
except ImportError:
    HAS_OCCT = False
else:
    HAS_OCCT = True


@unittest.skipUnless(HAS_OCCT, "cadquery-ocp not installed")
class OCCTSTEPIntegrationTests(unittest.TestCase):
    def test_all_supported_part_families_have_readable_valid_step_solids(self):
        for kind in ("washer", "mounting_plate", "open_box", "box_lid", "machined_block", "corner_plate", "feature_model"):
            with self.subTest(kind=kind):
                spec = {"type": kind, **PARTS[kind]["fields"]}
                data = render_occt_step(spec, python_path=sys.executable)
                self.assertTrue(data.startswith(b"ISO-10303-21;"))
                self.assertGreater(len(data), 100)
                import tempfile
                with tempfile.TemporaryDirectory() as temp:
                    target = Path(temp) / "check.step"
                    target.write_bytes(data)
                    reader = STEPControl_Reader()
                    self.assertEqual(reader.ReadFile(str(target)), IFSelect_RetDone)
                    self.assertGreater(reader.TransferRoots(), 0)
                    shape = reader.OneShape()
                    self.assertTrue(BRepCheck_Analyzer(shape).IsValid())
                    it = TopExp_Explorer(shape, TopAbs_SOLID)
                    solids = 0
                    while it.More():
                        solids += 1
                        it.Next()
                    self.assertEqual(solids, 1)


    def test_round_vs_chamfer_step_geometry_is_distinct(self):
        from OCP.GProp import GProp_GProps
        from OCP.BRepGProp import BRepGProp
        import tempfile
        base = {"type": "corner_plate", **PARTS["corner_plate"]["fields"]}
        volumes = {}
        for style in ("round", "chamfer"):
            with self.subTest(style=style):
                spec = {**base, "corner_style": style}
                data = render_occt_step(spec, python_path=sys.executable)
                with tempfile.TemporaryDirectory() as temp:
                    target = Path(temp) / "corner.step"
                    target.write_bytes(data)
                    reader = STEPControl_Reader()
                    self.assertEqual(reader.ReadFile(str(target)), IFSelect_RetDone)
                    reader.TransferRoots()
                    shape = reader.OneShape()
                    self.assertTrue(BRepCheck_Analyzer(shape).IsValid())
                    props = GProp_GProps()
                    BRepGProp.VolumeProperties_s(shape, props)
                    volumes[style] = props.Mass()
        self.assertGreater(volumes["round"], volumes["chamfer"])


if __name__ == "__main__":
    unittest.main()
