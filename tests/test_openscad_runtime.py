"""Source-level portable OpenSCAD executable discovery tests."""
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from orkicad_core.stl_render import RenderError, resolve_openscad


class OpenSCADResolverTests(unittest.TestCase):
    def test_explicit_executable(self):
        with tempfile.TemporaryDirectory() as temp:
            binary = Path(temp) / ("openscad.exe" if os.name == "nt" else "openscad")
            binary.write_bytes(b"fake executable for discovery")
            with patch.dict(os.environ, {"ORKICAD_OPENSCAD": str(binary)}):
                self.assertEqual(resolve_openscad(), str(binary.resolve()))

    def test_explicit_missing_override_is_not_silently_ignored(self):
        with tempfile.TemporaryDirectory() as temp:
            missing = str(Path(temp) / "nonexistent_openscad")
            with patch.dict(os.environ, {"ORKICAD_OPENSCAD": missing}):
                with self.assertRaisesRegex(RenderError, "missing executable"):
                    resolve_openscad()

    def test_path_detection(self):
        with patch.dict(os.environ, {"ORKICAD_OPENSCAD": ""}):
            with patch("orkicad_core.stl_render.shutil.which",
                       side_effect=lambda name: "/mock/openscad" if name == "openscad" else None):
                self.assertEqual(resolve_openscad(), "/mock/openscad")


if __name__ == "__main__":
    unittest.main()
