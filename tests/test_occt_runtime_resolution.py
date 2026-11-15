"""Regression tests for path-free development OCCT runtime discovery."""
from __future__ import annotations

import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from orkicad_core import occt_step


class OCCTRuntimeResolutionTests(unittest.TestCase):
    def test_auto_finds_project_local_venv(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            package = root / "core" / "orkicad_core"
            package.mkdir(parents=True)
            worker_file = package / "occt_step.py"
            worker_file.write_text("# test package location", encoding="utf-8")
            runtime = root / ".venv-occt" / (
                "Scripts/python.exe" if os.name == "nt" else "bin/python"
            )
            runtime.parent.mkdir(parents=True)
            runtime.write_bytes(b"fake-python-for-resolution-test")
            with patch.object(occt_step, "__file__", str(worker_file)):
                with patch.dict(os.environ, {"ORKICAD_OCCT_PYTHON": ""}):
                    self.assertEqual(
                        occt_step.resolve_occt_python("Auto"),
                        str(runtime.resolve()),
                    )

    def test_explicit_bad_override_fails_clearly(self):
        with tempfile.TemporaryDirectory() as temp:
            nonexistent = str(Path(temp) / "nonexistent-python")
            with self.assertRaisesRegex(
                occt_step.OCCTExportError, "Invalid OCCT Python runtime"
            ):
                occt_step.resolve_occt_python(nonexistent)


if __name__ == "__main__":
    unittest.main()
