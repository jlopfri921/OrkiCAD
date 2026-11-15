import json
import tempfile
import unittest
from pathlib import Path

from orkicad_core.inspect_mesh import main


class MeshInspectorTests(unittest.TestCase):
    def test_missing_stl_returns_failure_report(self):
        with tempfile.TemporaryDirectory() as tmp:
            report = Path(tmp) / "report.json"
            code = main([str(Path(tmp) / "missing.stl"), "--json", str(report)])
            self.assertEqual(code, 1)
            data = json.loads(report.read_text(encoding="utf-8"))
            self.assertFalse(data["all_passed"])
            self.assertEqual(data["schema"], "orkicad.mesh-report.v1")

    def test_box_stl_if_mesh_deps_present(self):
        try:
            import trimesh
            import networkx
        except ImportError:
            self.skipTest("Install the optional mesh extra")
        with tempfile.TemporaryDirectory() as tmp:
            stl = Path(tmp) / "box.stl"
            report = Path(tmp) / "report.json"
            trimesh.creation.box(extents=(10, 15, 3)).export(str(stl))
            self.assertEqual(main([str(stl), "--json", str(report)]), 0)
            data = json.loads(report.read_text(encoding="utf-8"))
            self.assertTrue(data["all_passed"])
            self.assertEqual(data["files"][0]["dimensions_mm"], [10.0, 15.0, 3.0])
            self.assertEqual(data["files"][0]["components"], 1)


if __name__ == "__main__":
    unittest.main()
