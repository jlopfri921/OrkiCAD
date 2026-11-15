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

    def test_workflow_file_has_registered_nodes(self):
        path = REPO / "comfyui" / "workflows" / "orkicad_parametric_stl.json"
        obj = json.loads(path.read_text(encoding="utf-8"))
        for node in obj["nodes"]:
            self.assertIn(node["type"], self.nodes.NODE_CLASS_MAPPINGS)
        self.assertEqual(len(obj["links"]), 2)


if __name__ == "__main__":
    unittest.main()
