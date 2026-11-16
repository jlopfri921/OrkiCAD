"""Native OrkiCAD project roundtrip and rejection of unsupported metadata.

No sketch history/foreign CAD asset support is implied by schema v1.
"""
from __future__ import annotations

import copy
import unittest

from orkicad_core.project_document import PROJECT_SCHEMA, validate_project_document


def sample():
    return {
        "schema": PROJECT_SCHEMA,
        "id": "project_sample",
        "name": "Placa circular",
        "units": "mm",
        "origin_mm": [0, 0, 0],
        "revision": 2,
        "active_part_id": "part_plate",
        "parts": [{
            "id": "part_plate", "type": "circular_plate",
            "parameters": {
                "outer_radius": 50, "thickness": 4, "hole_count": 5,
                "hole_diameter": 3, "bolt_circle_radius": 20,
            },
        }],
    }


class ProjectDocumentTests(unittest.TestCase):
    def test_valid_roundtrip_preserves_part_and_ids(self):
        value = sample()
        clean = validate_project_document(value)
        self.assertEqual(clean, value)
        self.assertEqual(clean["parts"][0]["parameters"]["hole_count"], 5)

    def test_invalid_spec_is_never_silently_corrected(self):
        value = sample()
        value["parts"][0]["parameters"]["bolt_circle_radius"] = 60
        with self.assertRaises(ValueError):
            validate_project_document(value)

    def test_unknown_extra_part_parameter_rejected(self):
        value = sample()
        value["parts"][0]["parameters"]["invented"] = 14
        with self.assertRaisesRegex(ValueError, "unknown or incomplete"):
            validate_project_document(value)

    def test_reject_extra_top_level_future_schema(self):
        value = sample()
        value["source_assets"] = [{"path": "/unsafe"}]
        with self.assertRaisesRegex(ValueError, "Unknown or missing"):
            validate_project_document(value)

    def test_reject_wrong_revision_or_origin(self):
        for field, replacement in (("revision", -1), ("revision", True),
                                   ("origin_mm", [5, 0, 0]), ("units", "in")):
            with self.subTest(field=field, replacement=replacement):
                value = sample()
                value[field] = replacement
                with self.assertRaises(ValueError):
                    validate_project_document(value)

    def test_reject_missing_or_duplicate_parts(self):
        for replacement in ([], sample()["parts"] * 2):
            value = sample()
            value["parts"] = copy.deepcopy(replacement)
            with self.assertRaisesRegex(ValueError, "exactly one"):
                validate_project_document(value)

    def test_reject_wrong_active_part_or_schema(self):
        for field, replacement in (("active_part_id", "other"), ("schema", "orkicad.project/2")):
            value = sample()
            value[field] = replacement
            with self.assertRaises(ValueError):
                validate_project_document(value)

    def test_document_endpoint_shared_with_tauri(self):
        from pathlib import Path
        root = Path(__file__).resolve().parents[1]
        studio = (root / "core/orkicad_core/studio_server.py").read_text(encoding="utf-8")
        rust = (root / "studio/frontend/src-tauri/src/lib.rs").read_text(encoding="utf-8")
        main = (root / "studio/frontend/src/main.tsx").read_text(encoding="utf-8")
        for source in (studio, rust):
            self.assertIn("/api/document/validate", source)
        self.assertIn("openProjectFile", main)
        self.assertIn("openSave('json')", main)
        self.assertIn("snapshotProject(", main)
        self.assertIn("setStl(null)", main)


if __name__ == "__main__":
    unittest.main()
