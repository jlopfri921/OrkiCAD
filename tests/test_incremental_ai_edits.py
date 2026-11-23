"""Regression checks for editing a loaded CAD part without replacing its geometry."""
import json
import unittest
from unittest.mock import patch

from orkicad_core.ai_interpreter import AIError, build_edit_instruction, merge_edit_changes
from orkicad_core.parts_catalog import PARTS, validated_spec


class IncrementalEditTests(unittest.TestCase):
    def setUp(self):
        self.current = validated_spec({
            "type": "mounting_plate", "width": 100, "depth": 60,
            "thickness": 5, "hole_diameter": 6, "hole_inset": 10,
        })

    def test_only_requested_dimensions_change(self):
        updated, changes = merge_edit_changes(
            self.current, {"changes": {"width": 120, "hole_diameter": 8}})
        self.assertEqual(updated["width"], 120)
        self.assertEqual(updated["hole_diameter"], 8)
        for field in ("depth", "thickness", "hole_inset"):
            self.assertEqual(updated[field], self.current[field])
        self.assertEqual(changes, {"width": 120, "hole_diameter": 8})
        self.assertEqual(self.current["width"], 100)

    def test_reject_type_change_and_unrecognized_fields(self):
        for changes in ({"type": "washer"}, {"arbitrary_script": "print('hi')"}):
            with self.subTest(changes=changes), self.assertRaises(AIError):
                merge_edit_changes(self.current, {"changes": changes})

    def test_reject_full_spec_and_empty_response(self):
        for proposed in ({"type": "mounting_plate", "width": 120},
                         {"changes": {}}, {"changes": {"width": 100}},
                         {"changes": {"width": True}}):
            with self.subTest(proposed=proposed), self.assertRaises(AIError):
                merge_edit_changes(self.current, proposed)

    def test_invalid_geometry_is_rejected(self):
        with self.assertRaises(ValueError):
            merge_edit_changes(self.current, {"changes": {"hole_inset": 500}})

    def test_instruction_discloses_current_spec_and_allowed_parameters(self):
        instruction = build_edit_instruction(self.current)
        self.assertIn('"width": 100', instruction)
        self.assertIn("changes", instruction)
        self.assertIn("Preserve all other properties", instruction)

    def test_operation_history_editing_not_silently_supported(self):
        current = {"type": "feature_model", **PARTS["feature_model"]["fields"]}
        with self.assertRaisesRegex(ValueError, "operation-history"):
            build_edit_instruction(current)


if __name__ == "__main__":
    unittest.main()
