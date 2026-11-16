"""Source regressions for explicit CAD save confirmation across Web and Tauri.

Runtime browser/native dialogs still require interactive acceptance.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
FRONT = ROOT / "studio/frontend"


class SaveDialogContractTests(unittest.TestCase):
    def test_shared_web_native_save_routing(self):
        source = (FRONT / "src/saveFile.ts").read_text(encoding="utf-8")
        for expected in (
            "export function normalizeExportName",
            "showSaveFilePicker",
            "excludeAcceptAllOption: true",
            "createWritable",
            "filename, format, dataBase64",
            "'save_export_file'",
            "fallbackBrowserDownload",
            "download = name",
        ):
            with self.subTest(expected=expected):
                self.assertIn(expected, source)

    def test_all_export_buttons_require_name_review(self):
        app = (FRONT / "src/main.tsx").read_text(encoding="utf-8")
        for expected in (
            "setSavePending(format)",
            "openSave('stl')",
            "openSave('scad')",
            "openSave(format)",
            "normalizeExportName(saveStem, format)",
            "onClick={confirmSave}",
            'role="dialog"',
            'aria-modal="true"',
            "savePending &&",
        ):
            with self.subTest(expected=expected):
                self.assertIn(expected, app)
        self.assertNotIn("link.download =", app)

    def test_desktop_native_dialog_requires_explicit_format(self):
        rust = (FRONT / "src-tauri/src/lib.rs").read_text(encoding="utf-8")
        for expected in (
            "async fn save_export_file(",
            'matches!(format.as_str(), "stl" | "3mf" | "step" | "scad" | "json")',
            'rfd::FileDialog::new()',
            ".set_file_name(&filename)",
            ".save_file()",
            "std::fs::write(&destination, bytes)",
            "studio_request, save_export_file",
        ):
            with self.subTest(expected=expected):
                self.assertIn(expected, rust)


if __name__ == "__main__":
    unittest.main()
