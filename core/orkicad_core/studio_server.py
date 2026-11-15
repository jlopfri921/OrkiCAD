"""Development-only localhost API: JSON CAD specs to OpenSCAD text."""
from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from .geometry import generate_scad
from .stl_render import RenderError, render_stl
from .parts_catalog import catalog_public
from .ai_interpreter import AIError, interpret
import os

MAX_BYTES = 8192


class StudioHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path not in ("/api/scad", "/api/stl", "/api/interpret"):
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
            if self.path == "/api/scad":
                scad = generate_scad(spec)
            elif self.path == "/api/stl":
                binary = render_stl(spec)
            else:
                if not isinstance(spec, dict):
                    raise ValueError("Expected an object containing a prompt")
                proposal = interpret(spec.get("prompt", ""), model=spec.get("model"))

        except (ValueError, UnicodeDecodeError) as exc:
            self._json(400, {"error": str(exc)})
            return
        except (RenderError, AIError) as exc:
            self._json(422, {"error": str(exc)})
            return
        if self.path == "/api/interpret":
            self._json(200, {"spec": proposal, "review_required": True,
                             "message": "Review ALL dimensions and assumptions before generating."})
        elif self.path == "/api/scad":
            self._json(200, {"scad": scad})
        else:
            self.send_response(200)
            self.send_header("Content-Type", "model/stl")
            self.send_header("Content-Disposition", 'attachment; filename="orkicad.stl"')
            self.send_header("Content-Length", str(len(binary)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(binary)

    def do_GET(self):
        if self.path == "/api/health":
            self._json(200, {"status": "ok", "service": "orkicad-studio-api"})
        elif self.path == "/api/catalog":
            self._json(200, catalog_public())
        elif self.path == "/api/providers":
            self._json(200, {
                "providers": [{
                    "id": "ollama", "kind": "local", "configured": True,
                    "model": os.environ.get("ORKICAD_OLLAMA_MODEL", "qwen2.5:7b"),
                    "endpoint": os.environ.get("ORKICAD_OLLAMA_URL", "http://127.0.0.1:11434"),
                    "note": "Local provider; actual availability tested when prompted"
                }],
                "cloud_providers_enabled": False,
                "message": "Cloud credentials and adapters are not yet implemented."
            })
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
