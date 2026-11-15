"""Regression tests for shared catalog, closures and the ComfyUI adapter.

No ComfyUI installation or OpenSCAD executable is needed for these unit tests.
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch

from orkicad_core.geometry import ParameterError, generate_scad
from orkicad_core.parts_catalog import PARTS, catalog_public, validated_spec


REPO = Path(__file__).resolve().parents[1]
COMFY_NODE_FILE = REPO / "comfyui" / "orkicad_nodes" / "__init__.py"


def load_nodes():
    module_spec = importlib.util.spec_from_file_location("orkicad_test_nodes", COMFY_NODE_FILE)
    module = importlib.util.module_from_spec(module_spec)
    assert module_spec.loader
    module_spec.loader.exec_module(module)
    return module


class CatalogTests(unittest.TestCase):
    def test_all_catalog_defaults_are_valid_scad(self):
        for part_type, info in PARTS.items():
            with self.subTest(part_type=part_type):
                scad = generate_scad({"type": part_type, **info["fields"]})
                self.assertTrue(scad.strip())

    def test_catalog_fields_have_metadata(self):
        exposed = catalog_public()
        self.assertEqual(set(exposed["parts"]), set(PARTS))
        for part_type, details in exposed["parts"].items():
            fields = details["fields"]
            self.assertEqual([f["key"] for f in fields], list(PARTS[part_type]["fields"]))

    def test_lid_geometry(self):
        scad = generate_scad({"type": "box_lid", **PARTS["box_lid"]["fields"]})
        self.assertIn("union()", scad)
        self.assertIn("cube([64,44,3])", scad)

    def test_bottle_cap_shape(self):
        scad = generate_scad({"type": "bottle_cap", **PARTS["bottle_cap"]["fields"]})
        self.assertIn("linear_extrude", scad)
        self.assertIn("twist=", scad)

    def test_invalid_cap_rejected(self):
        spec = {"type": "bottle_cap", **PARTS["bottle_cap"]["fields"]}
        spec["thread_depth"] = spec["wall"] + 1
        with self.assertRaises(ParameterError):
            generate_scad(spec)

    def test_reject_bad_type(self):
        with self.assertRaises(ParameterError):
            validated_spec({"type": "unavailable"})

    def test_validated_spec_ignores_extra_keys(self):
        proposal = {"type": "washer", **PARTS["washer"]["fields"], "unsafe_code": "do not execute"}
        self.assertNotIn("unsafe_code", validated_spec(proposal))


class ComfyNodeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.nodes = load_nodes()

    def test_nodes_registered(self):
        self.assertEqual(set(self.nodes.NODE_CLASS_MAPPINGS), {
            "OrkiCADPartSpec", "OrkiCADGenerateSCAD",
            "OrkiCADRenderSTL", "OrkiCADInterpretLocal",
            "OrkiCADReviewSpec", "OrkiCADSavedDesign",
        })

    def test_part_to_scad(self):
        spec_json, = self.nodes.OrkiCADPartSpec().create(
            "box_lid", '{"box_width": 80, "box_depth": 50}'
        )
        scad, = self.nodes.OrkiCADGenerateSCAD().generate(spec_json)
        self.assertIn("cube([84,54,3])", scad)

    def test_part_unknown_fields_rejected(self):
        with self.assertRaises(ValueError):
            self.nodes.OrkiCADPartSpec().create("washer", '{"system_command":"danger"}')

    def test_render_node_rejects_path_traversal(self):
        with self.assertRaises(ValueError):
            self.nodes.OrkiCADRenderSTL().render(
                json.dumps({"type": "washer", **PARTS["washer"]["fields"]}), "../escape"
            )

    def test_ai_workflow_connects_to_render(self):
        path = REPO / "comfyui" / "workflows" / "orkicad_ollama_text_to_stl.json"
        workflow = json.loads(path.read_text(encoding="utf-8"))
        node_types = {n["id"]: n["type"] for n in workflow["nodes"]}
        self.assertIn("OrkiCADInterpretLocal", node_types.values())
        self.assertIn("OrkiCADRenderSTL", node_types.values())
        self.assertEqual(len(workflow["links"]), 2)
        for edge in workflow["links"]:
            self.assertIn(edge[1], node_types)
            self.assertIn(edge[3], node_types)
            self.assertEqual(edge[5], "STRING")
        for node in workflow["nodes"]:
            self.assertIn(node["type"], self.nodes.NODE_CLASS_MAPPINGS)

    def test_ai_node_rejects_invalid_prompt_without_network(self):
        with self.assertRaises(ValueError):
            self.nodes.OrkiCADInterpretLocal().interpret("", "qwen3-coder:30b")

    def test_review_gate_rejects_unapproved(self):
        original, = self.nodes.OrkiCADPartSpec().create("box_lid", "{}")
        with self.assertRaisesRegex(ValueError, "manual approval"):
            self.nodes.OrkiCADReviewSpec().review(original, "{}", False)

    def test_review_gate_accepts_valid_overrides(self):
        original, = self.nodes.OrkiCADPartSpec().create("box_lid", "{}")
        result, summary = self.nodes.OrkiCADReviewSpec().review(
            original, '{"box_width": 80, "box_depth": 50}', True
        )
        self.assertEqual(json.loads(result)["box_width"], 80)
        self.assertIn('"box_depth": 50', summary)

    def test_review_gate_rejects_unknown_field(self):
        original, = self.nodes.OrkiCADPartSpec().create("washer", "{}")
        with self.assertRaisesRegex(ValueError, "Unknown override fields"):
            self.nodes.OrkiCADReviewSpec().review(original, '{"malicious": 1}', True)

    def test_ai_node_communicates_proposed_parameters_to_ui(self):
        proposal = {"type": "washer", **PARTS["washer"]["fields"]}
        with patch("orkicad_core.ai_interpreter.interpret", return_value=proposal):
            result = self.nodes.OrkiCADInterpretLocal().interpret(
                "Make a washer with a 6.5 mm hole", "local-test-model"
            )
        self.assertEqual(json.loads(result["result"][0]), proposal)
        self.assertEqual(json.loads(result["ui"]["proposed_spec"][0]), proposal)

    def test_visual_editor_assets_registered(self):
        self.assertEqual(self.nodes.WEB_DIRECTORY, "./web")
        script = REPO / "comfyui" / "orkicad_nodes" / "web" / "parametric_editor.js"
        content = script.read_text(encoding="utf-8")
        self.assertIn("app.registerExtension", content)
        self.assertIn("OrkiCADReviewSpec", content)
        self.assertIn('addDOMWidget', content)
        self.assertIn('MM_PER_INCH = 25.4', content)
        self.assertIn("overrides_json", content)
        self.assertIn("OrkiCADSavedDesign", content)

    def test_saved_design_edits_without_ollama(self):
        initial = {"type": "box_lid", **PARTS["box_lid"]["fields"]}
        with patch("orkicad_core.ai_interpreter.interpret",
                   side_effect=AssertionError("Ollama must not run")):
            spec, summary = self.nodes.OrkiCADSavedDesign().build(
                json.dumps(initial), '{"box_width": 110, "box_depth": 75}'
            )
        self.assertEqual(json.loads(spec)["box_width"], 110)
        self.assertEqual(json.loads(spec)["box_depth"], 75)
        self.assertIn('"box_width": 110', summary)

    def test_saved_design_rejects_unknown_field(self):
        initial = {"type": "washer", **PARTS["washer"]["fields"]}
        with self.assertRaisesRegex(ValueError, "Unknown saved design fields"):
            self.nodes.OrkiCADSavedDesign().build(
                json.dumps(initial), '{"arbitrary_source":"not allowed"}'
            )

    def test_saved_design_rejects_invalid_measurements(self):
        initial = {"type": "washer", **PARTS["washer"]["fields"]}
        with self.assertRaises(Exception):
            self.nodes.OrkiCADSavedDesign().build(
                json.dumps(initial), '{"inner_diameter": 10000}'
            )

    def test_saved_design_workflow_has_no_ai_dependency(self):
        path = REPO / "comfyui" / "workflows" / "orkicad_saved_design_preview_stl.json"
        flow = json.loads(path.read_text(encoding="utf-8"))
        types = {node["id"]: node["type"] for node in flow["nodes"]}
        self.assertEqual(types, {
            1: "OrkiCADSavedDesign", 2: "OrkiCADRenderSTL", 3: "Preview3D"
        })
        self.assertEqual(flow["links"], [
            [1, 1, 0, 2, 0, "STRING"], [2, 2, 1, 3, 0, "STRING"]
        ])

    def test_preview_workflow_wiring(self):
        path = REPO / "comfyui" / "workflows" / "orkicad_ollama_review_preview_stl.json"
        flow = json.loads(path.read_text(encoding="utf-8"))
        node_types = {node["id"]: node["type"] for node in flow["nodes"]}
        self.assertEqual(node_types[2], "OrkiCADReviewSpec")
        self.assertEqual(node_types[3], "OrkiCADRenderSTL")
        self.assertEqual(node_types[4], "Preview3D")
        self.assertIn([2, 2, 0, 3, 0, "STRING"], flow["links"])
        self.assertIn([3, 3, 1, 4, 0, "STRING"], flow["links"])

    def test_workflow_file_has_registered_nodes(self):
        path = REPO / "comfyui" / "workflows" / "orkicad_parametric_stl.json"
        obj = json.loads(path.read_text(encoding="utf-8"))
        for node in obj["nodes"]:
            self.assertIn(node["type"], self.nodes.NODE_CLASS_MAPPINGS)
        self.assertEqual(len(obj["links"]), 2)


if __name__ == "__main__":
    unittest.main()
