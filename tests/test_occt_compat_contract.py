"""The OCCT worker must support older and newer cadquery-ocp downcast APIs.

Source-level contract only. Actual STEP round-trip is run by
test_occt_integration.py with a supported installed OCP runtime.
"""
from pathlib import Path
import unittest


class OCCTCompatibilityContract(unittest.TestCase):
    def test_edge_downcast_handles_both_ocp_versions(self):
        root = Path(__file__).resolve().parents[1]
        worker = (root / "core/orkicad_core/occt_worker.py").read_text(encoding="utf-8")
        self.assertIn('getattr(TopoDS, "Edge_s", None)', worker)
        self.assertIn('getattr(TopoDS, "Edge", None)', worker)
        self.assertIn('edge = downcast_edge(edges.Current())', worker)
        self.assertNotIn('edge = TopoDS.Edge_s(edges.Current())', worker)

    def test_windows_occt_verifier_avoids_nested_python_quotes(self):
        root = Path(__file__).resolve().parents[1]
        powershell = (root / "scripts/verify-studio.ps1").read_text(encoding="utf-8")
        self.assertIn("& $python -c 'import OCP'", powershell)
        self.assertNotIn('print("OCCT/OCP Python module available")', powershell)

    def test_unavailable_binding_fails_explicitly(self):
        worker = (Path(__file__).resolve().parents[1]
                  / "core/orkicad_core/occt_worker.py").read_text(encoding="utf-8")
        self.assertIn('raise RuntimeError("OCP TopoDS edge conversion is unavailable")', worker)


if __name__ == "__main__":
    unittest.main()
