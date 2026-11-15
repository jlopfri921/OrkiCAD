"""Development-only localhost API: JSON CAD specs to OpenSCAD text."""
from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from .geometry import generate_scad

MAX_BYTES = 8192


class StudioHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/api/scad":
            self.send_error(404)
            return
        if self.headers.get("X-OrkiCAD-Client") != "studio":
            self._json(403, {"error": "Missing Studio client header"})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._json(400, {"error": "Invalid content length"})
            return
        if not 0 < size <= MAX_BYTES:
            self._json(413, {"error": "Request too large or empty"})
            return
        try:
            spec = json.loads(self.rfile.read(size))
            scad = generate_scad(spec)
        except (ValueError, UnicodeDecodeError) as exc:
            self._json(400, {"error": str(exc)})
            return
        self._json(200, {"scad": scad})

    def do_GET(self):
        if self.path == "/api/health":
            self._json(200, {"status": "ok", "service": "orkicad-studio-api"})
        else:
            self.send_error(404)

    def _json(self, status, value):
        encoded = json.dumps(value).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 8765), StudioHandler)
    print("OrkiCAD Studio development API at http://127.0.0.1:8765/api/health")
    print("Local development only. Do not expose this unauthenticated server.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
