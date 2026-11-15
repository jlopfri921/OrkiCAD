"""HTTP smoke tests for localhost-only Studio CAD API."""
import http.client
import json
import threading
import unittest
from http.server import ThreadingHTTPServer

from orkicad_core.studio_server import StudioHandler


class StudioServerTests(unittest.TestCase):
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

    def request(self, method, path, data=None, headers=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=3)
        connection.request(method, path, body=data, headers=headers or {})
        response = connection.getresponse()
        status, value = response.status, json.loads(response.read())
        connection.close()
        return status, value

    def test_health(self):
        status, result = self.request("GET", "/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(result["status"], "ok")

    def test_generate_valid_washer(self):
        body = json.dumps({
            "type": "washer", "outer_diameter": 18,
            "inner_diameter": 6.5, "thickness": 2,
        })
        status, result = self.request("POST", "/api/scad", body, {
            "Content-Type": "application/json", "X-OrkiCAD-Client": "studio",
        })
        self.assertEqual(status, 200)
        self.assertIn("cylinder(", result["scad"])

    def test_reject_invalid_geometry(self):
        body = json.dumps({
            "type": "washer", "outer_diameter": 4,
            "inner_diameter": 6, "thickness": 2,
        })
        status, result = self.request("POST", "/api/scad", body, {
            "X-OrkiCAD-Client": "studio",
        })
        self.assertEqual(status, 400)
        self.assertIn("error", result)

    def test_reject_missing_client_header(self):
        status, _ = self.request("POST", "/api/scad", "{}")
        self.assertEqual(status, 403)


if __name__ == "__main__":
    unittest.main()
