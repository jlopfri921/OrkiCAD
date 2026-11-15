"""Desktop session authentication for the same localhost CAD API.

The Web developer server intentionally remains backwards-compatible without
ORKICAD_STUDIO_TOKEN; Tauri starts it with an unpredictable secret and port.
"""
from __future__ import annotations

import http.client
import json
import os
import threading
import unittest
from http.server import ThreadingHTTPServer
from unittest.mock import patch

from orkicad_core.studio_server import StudioHandler


class StudioDesktopAuthTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), StudioHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def request(self, method, path, *, token=None, body=None):
        connection = http.client.HTTPConnection(
            "127.0.0.1", self.server.server_port, timeout=3
        )
        headers = {"X-OrkiCAD-Client": "studio"}
        if token is not None:
            headers["X-OrkiCAD-Token"] = token
        connection.request(method, path, body=body, headers=headers)
        response = connection.getresponse()
        value = json.loads(response.read())
        status = response.status
        connection.close()
        return status, value

    def test_private_worker_rejects_unauthorized_get_and_post(self):
        with patch.dict(os.environ, {"ORKICAD_STUDIO_TOKEN": "private-desktop-token"}):
            for method, endpoint, body in (
                ("GET", "/api/health", None),
                ("GET", "/api/catalog", None),
                ("POST", "/api/scad", json.dumps({
                    "type": "washer", "outer_diameter": 18,
                    "inner_diameter": 6.5, "thickness": 2
                })),
            ):
                with self.subTest(method=method, endpoint=endpoint):
                    for provided in (None, "wrong-token"):
                        status, reply = self.request(
                            method, endpoint, token=provided, body=body
                        )
                        self.assertEqual(status, 403)
                        self.assertNotIn("private-desktop-token", json.dumps(reply))

    def test_private_worker_allows_correct_session(self):
        with patch.dict(os.environ, {"ORKICAD_STUDIO_TOKEN": "private-desktop-token"}):
            status, reply = self.request(
                "GET", "/api/health", token="private-desktop-token"
            )
            self.assertEqual(status, 200)
            self.assertEqual(reply["status"], "ok")

    def test_development_web_without_token_unchanged(self):
        with patch.dict(os.environ, {"ORKICAD_STUDIO_TOKEN": ""}):
            status, reply = self.request("GET", "/api/health")
            self.assertEqual(status, 200)
            self.assertEqual(reply["status"], "ok")


if __name__ == "__main__":
    unittest.main()
