"""Offline tests for the local Ollama adapter's error handling."""
import os
import unittest
from unittest.mock import patch

from orkicad_core.ai_interpreter import AIError, interpret


class OllamaAdapterTests(unittest.TestCase):
    @patch.dict(os.environ, {"ORKICAD_OLLAMA_URL": "http://127.0.0.1:11434",
                              "ORKICAD_OLLAMA_TIMEOUT": "5"})
    @patch("orkicad_core.ai_interpreter.urllib.request.urlopen",
           side_effect=TimeoutError("timed out"))
    def test_timeout_message_explains_remediation(self, mock_open):
        with self.assertRaises(AIError) as captured:
            interpret("Create a box lid", model="test-local-model")
        self.assertIn("5 seconds", str(captured.exception))
        self.assertIn("ollama list", str(captured.exception))
        self.assertEqual(mock_open.call_args.kwargs["timeout"], 5)

    @patch.dict(os.environ, {"ORKICAD_OLLAMA_TIMEOUT": "bogus"})
    def test_invalid_timeout_config_rejected(self):
        with self.assertRaisesRegex(AIError, "must be a number"):
            interpret("Create a box lid", model="test-local-model")

    @patch.dict(os.environ, {"ORKICAD_OLLAMA_TIMEOUT": "601"})
    def test_out_of_range_timeout_rejected(self):
        with self.assertRaisesRegex(AIError, "between 5 and 600"):
            interpret("Create a box lid", model="test-local-model")

    @patch.dict(os.environ, {"ORKICAD_OLLAMA_URL": "https://example.com"})
    def test_external_endpoint_disallowed(self):
        with self.assertRaisesRegex(AIError, "loopback"):
            interpret("Create a box lid", model="test-local-model")


if __name__ == "__main__":
    unittest.main()
