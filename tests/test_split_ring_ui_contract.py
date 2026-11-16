"""Source contract for editability and truthful rendering of open-ring sketch."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class SplitRingUIContract(unittest.TestCase):
    def test_shared_studio_routes_circular_opening_to_specialized_sketch(self):
        app = (ROOT / "studio/frontend/src/main.tsx").read_text(encoding="utf-8")
        for token in ("import SplitRingWorkspace", "type === 'split_ring'",
                      "onChangeParameter={updateParameter}", "setAiNote([t.reviewDimensions"):
            self.assertIn(token, app)

    def test_two_concentric_arcs_and_radial_endpoints_not_rectangular_fallback(self):
        sketch = (ROOT / "studio/frontend/src/SplitRingWorkspace.tsx").read_text(encoding="utf-8")
        for token in ("gapArc / outer", "Math.cos(a)", "Math.sin(a)",
                      "A ${ro} ${ro}", "A ${ri} ${ri}",
                      "L ${p(ri, end)}", "Δθ", "outer_arc_gap"):
            self.assertIn(token, sketch)
        self.assertNotIn("rect x={left}", sketch)

    def test_drawing_is_parameter_editable_and_unsupported_views_honest(self):
        sketch = (ROOT / "studio/frontend/src/SplitRingWorkspace.tsx").read_text(encoding="utf-8")
        for token in ("onChangeParameter(key, next)", "type=\"number\"",
                      "onClick={() => setProjection(item)}",
                      "requiere proyección B-rep", "No mostramos un rectángulo falso"):
            self.assertIn(token, sketch)

    def test_interpreter_refuses_rectangular_substitute_on_partial_prompt(self):
        server = (ROOT / "core/orkicad_core/studio_server.py").read_text(encoding="utf-8")
        self.assertIn("ring_spec or parse_explicit_circular_plate", server)
        self.assertIn("requests_radial_ring_cut", server)
        self.assertIn("No rectangle will be substituted.", server)
        self.assertIn('"assumptions": ring_assumptions', server)


if __name__ == "__main__":
    unittest.main()
