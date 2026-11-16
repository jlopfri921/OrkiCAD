"""Regression contracts for screw head and drive controls in shared Studio UI."""
from pathlib import Path
import unittest

from orkicad_core.mechanical import HEAD_DRIVES
from orkicad_core.parts_catalog import OPTIONS, PARTS, catalog_public


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "studio" / "frontend" / "src" / "main.tsx"
I18N = ROOT / "studio" / "frontend" / "src" / "i18n.ts"


class ScrewDropdownContractTests(unittest.TestCase):
    def test_core_exposes_both_enumerations(self):
        fields = {x["key"]: x for x in catalog_public()["parts"]["metric_screw"]["fields"]}
        self.assertEqual(fields["head"]["options"], OPTIONS["head"])
        self.assertEqual(fields["drive"]["options"], OPTIONS["drive"])
        self.assertTrue(set(HEAD_DRIVES).issubset(fields["head"]["options"]))
        for allowed in HEAD_DRIVES.values():
            self.assertTrue(set(allowed).issubset(fields["drive"]["options"]))

    def test_frontend_displays_selects_even_without_catalog_metadata(self):
        source = SOURCE.read_text(encoding="utf-8")
        self.assertIn("CATEGORICAL_OPTIONS[name]", source)
        self.assertIn("SCREW_DRIVES_BY_HEAD", source)
        self.assertIn("name === 'head'", source)
        self.assertIn("name === 'drive'", source)
        self.assertIn("compatible.includes(String(updated.drive))", source)
        self.assertIn("<select id={name}", source)

    def test_local_screw_head_options_match_core(self):
        source = SOURCE.read_text(encoding="utf-8")
        for head, drives in HEAD_DRIVES.items():
            self.assertIn(f"{head}: [", source)
            for drive in drives:
                self.assertIn(f"'{drive}'", source)

    def test_spanish_ui_distinguishes_head_and_drive(self):
        source = I18N.read_text(encoding="utf-8")
        self.assertIn("head: 'Tipo de cabeza'", source)
        self.assertIn("drive: 'Huella / accionamiento'", source)


if __name__ == "__main__":
    unittest.main()
