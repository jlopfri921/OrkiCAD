"""Unit tests for bounded feature-program CAD grammar without external CAD engines."""
from __future__ import annotations

import json
from pathlib import Path
import unittest

from orkicad_core.feature_program import validate_feature_model, generate_feature_scad
from orkicad_core.geometry import ParameterError, generate_scad
from orkicad_core.parts_catalog import PARTS, catalog_public, validated_spec


ROOT = Path(__file__).resolve().parents[1]


class FeatureProgramTests(unittest.TestCase):
    def setUp(self):
        # Deep-copy mutable example operations; do not mutate global catalog.
        self.spec = {"type": "feature_model", **json.loads(
            json.dumps(PARTS["feature_model"]["fields"])
        )}

    def test_default_feature_sequence_is_valid_and_shared(self):
        normalized = validated_spec(self.spec)
        self.assertEqual(len(normalized["operations"]), 4)
        self.assertEqual(normalized, validate_feature_model(self.spec))
        self.assertEqual(generate_scad(self.spec), generate_feature_scad(self.spec))
        source = generate_scad(self.spec)
        self.assertEqual(source.count("difference()"), 3)
        self.assertEqual(source.count("union()"), 1)
        self.assertIn("cube([100,60,12])", source)
        self.assertIn("translate([50,50,11.8])", source)
        self.assertEqual(
            catalog_public()["parts"]["feature_model"]["fields"][-1]["editor"],
            "feature_operations"
        )

    def test_invalid_ops_are_rejected(self):
        for replacement in (
            {"op": "exec", "shape": "box", "position": [1, 1, 1], "size": [2, 2, 2]},
            {"op": "cut", "shape": "python", "position": [1, 1, 1], "size": [2, 2, 2]},
            {"op": "cut", "shape": "box", "position": [1, 1, 1], "size": [2, 2, 2],
             "script": "arbitrary()"},
        ):
            with self.subTest(replacement=replacement):
                self.spec["operations"][0] = replacement
                with self.assertRaises(ParameterError):
                    validated_spec(self.spec)

    def test_excessive_operations_and_malformed_parameters_rejected(self):
        self.spec["operations"] *= 3
        with self.assertRaisesRegex(ParameterError, "1 to 8"):
            validated_spec(self.spec)
        self.spec["operations"] = [{"op": "cut", "shape": "box",
                                    "position": [0, 0, 0], "size": [1, 1, True]}]
        with self.assertRaises(ParameterError):
            validated_spec(self.spec)
        self.spec["operations"][0]["size"] = [1, 1, float("inf")]
        with self.assertRaises(ParameterError):
            validated_spec(self.spec)

    def test_unbounded_or_detached_solids_rejected(self):
        self.spec["operations"] = [{"op": "add", "shape": "box",
                                    "position": [200, 200, 200], "size": [5, 5, 5]}]
        with self.assertRaisesRegex(ParameterError, "overlap"):
            validated_spec(self.spec)
        self.spec["operations"][0]["position"] = [0, 0, 0]
        self.spec["operations"][0]["size"] = [600, 1, 1]
        with self.assertRaises(ParameterError):
            validated_spec(self.spec)

    def test_visual_editor_contains_feature_history_controls(self):
        script = ROOT / "comfyui/orkicad_nodes/web/parametric_editor.js"
        content = script.read_text(encoding="utf-8")
        self.assertIn("function featureEditor(", content)
        self.assertIn("function featureTemplate(", content)
        self.assertIn("MAX_FEATURES = 8", content)
        self.assertIn("t.addFeature", content)
        self.assertIn("t.removeFeature", content)
        self.assertIn("t.moveUp", content)
        self.assertIn("t.moveDown", content)
        self.assertIn('tripletField("position"', content)
        self.assertIn('tripletField("size"', content)
        self.assertIn('["radius", t.radius]', content)
        self.assertIn('"operations JSON (mm)"', content)
        self.assertIn("if (approvedWidget) approvedWidget.value = false", content)
        self.assertIn("node, current, overridesWidget, approvedWidget, t,", content)

    def test_saved_feature_program_still_validates_with_normal_core(self):
        spec = self.spec
        self.assertEqual(validated_spec(spec)["type"], "feature_model")
        # Malformed edits from either the visual form or raw JSON must fail.
        spec["operations"][0]["position"] = [1, "unsafe", 3]
        with self.assertRaises(ParameterError):
            validated_spec(spec)

    def test_comfyui_graph_and_manual_approval(self):
        path = ROOT / "comfyui/workflows/orkicad_ai_feature_program_stl_3mf_occt_step.json"
        wf = json.loads(path.read_text(encoding="utf-8"))
        types = {n["id"]: n["type"] for n in wf["nodes"]}
        self.assertEqual(types[1], "OrkiCADInterpretLocal")
        self.assertEqual(types[2], "OrkiCADReviewSpec")
        self.assertEqual(types[6], "OrkiCADExportOCCTSTEP")
        self.assertIn([5, 2, 0, 6, 0, "STRING"], wf["links"])
        self.assertFalse(wf["nodes"][1]["widgets_values"][1])


if __name__ == "__main__":
    unittest.main()
