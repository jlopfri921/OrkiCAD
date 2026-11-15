"""Mocked provider contract tests: no external API calls or real credentials."""
from __future__ import annotations

import io
import json
import unittest
from unittest.mock import patch

from orkicad_core.cloud_interpreter import interpret_cloud, NoRedirect
from orkicad_core.parts_catalog import PARTS, validated_spec


class FakeResponse:
    status = 200

    def __init__(self, value):
        self.body = io.BytesIO(json.dumps(value).encode("utf-8"))

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self, limit=-1):
        return self.body.read(limit)


class CloudInterpreterTests(unittest.TestCase):
    def setUp(self):
        self.spec = {"type": "corner_plate", **PARTS["corner_plate"]["fields"]}

    def test_supported_providers_return_same_validated_cad_spec(self):
        for provider, reply in [
            ("openai", {"output": [{"type": "message", "content": [
                {"type": "output_text", "text": json.dumps(self.spec)}]}]}),
            ("anthropic", {"content": [{"type": "text", "text": json.dumps(self.spec)}]}),
            ("gemini", {"candidates": [{"content": {"parts": [
                {"text": json.dumps(self.spec)}]}}]}),
        ]:
            with self.subTest(provider=provider):
                response = FakeResponse(reply)
                with patch("orkicad_core.cloud_interpreter.urllib.request.build_opener") as opener:
                    opener.return_value.open.return_value = response
                    design = interpret_cloud(
                        "Diseña una placa de 90 × 55 mm", provider=provider,
                        model="test-model", api_key="test-key-123456"
                    )
                    self.assertEqual(design, validated_spec(self.spec))
                    request = opener.return_value.open.call_args[0][0]
                    self.assertTrue(request.full_url.startswith("https://"))
                    self.assertNotIn("test-key-123456", request.full_url)
                    self.assertIn("test-key-123456", str(request.header_items()))
                    self.assertNotIn("test-key-123456", request.data.decode())

    def test_reject_unsupported_provider_and_invalid_model(self):
        with self.assertRaises(ValueError):
            interpret_cloud("Una placa de 90 mm", provider="unsafe",
                            model="model", api_key="test-key-123456")
        with self.assertRaises(ValueError):
            interpret_cloud("Una placa de 90 mm", provider="gemini",
                            model="../unsafe?", api_key="test-key-123456")

    def test_openai_response_cannot_bypass_core_validation(self):
        unsafe = {"type": "feature_model", "width": 100, "depth": 60, "height": 12,
                  "operations": [{"op": "exec", "shape": "python"}]}
        reply = {"output": [{"content": [{"type": "output_text",
                                        "text": json.dumps(unsafe)}]}]}
        with patch("orkicad_core.cloud_interpreter.urllib.request.build_opener") as opener:
            opener.return_value.open.return_value = FakeResponse(reply)
            with self.assertRaisesRegex(Exception, "valid OrkiCAD CAD JSON"):
                interpret_cloud("Diseña una placa de 100 mm", provider="openai",
                                model="test-model", api_key="test-key-123456")

    def test_redirects_are_not_followed(self):
        self.assertIsNone(NoRedirect().redirect_request(
            None, None, 302, "Redirect", {}, "https://untrusted.example"
        ))


if __name__ == "__main__":
    unittest.main()
