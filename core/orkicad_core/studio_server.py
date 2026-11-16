"""Development-only localhost API: JSON CAD specs to OpenSCAD text."""
from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from .geometry import generate_scad
from .stl_render import RenderError, render_stl, render_mesh
from .occt_step import OCCTExportError, render_occt_step
from .parts_catalog import validated_spec
from .project_document import validate_project_document
from .parts_catalog import catalog_public, CATALOG_VERSION
from .ai_interpreter import AIError, interpret
from .cloud_interpreter import interpret_cloud
from .circular_prompt import parse_explicit_circular_plate
import os
import secrets

MAX_BYTES = 16384


class StudioHandler(BaseHTTPRequestHandler):
    def _check_private_token(self):
        """Desktop worker requires a per-session secret; web dev stays local-only."""
        expected = os.environ.get("ORKICAD_STUDIO_TOKEN", "")
        if expected and not secrets.compare_digest(
                self.headers.get("X-OrkiCAD-Token", ""), expected):
            self._json(403, {"error": "Invalid desktop worker session"})
            return False
        return True

    def do_POST(self):
        if not self._check_private_token():
            return
        if self.path not in ("/api/scad", "/api/stl", "/api/3mf", "/api/step", "/api/interpret", "/api/document/validate"):
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
            if self.path == "/api/document/validate":
                project = validate_project_document(spec)
            elif self.path == "/api/scad":
                scad = generate_scad(validated_spec(spec))
            elif self.path == "/api/stl":
                binary = render_stl(validated_spec(spec))
            elif self.path == "/api/3mf":
                binary = render_mesh(validated_spec(spec), format="3mf")
            elif self.path == "/api/step":
                binary = render_occt_step(validated_spec(spec))
            else:
                if not isinstance(spec, dict):
                    raise ValueError("Expected an object containing a prompt")
                provider = spec.get("provider", "ollama")
                # A fully dimensioned simple disk needs no probabilistic
                # template choice: preserve the user's actual circular shape.
                exact = parse_explicit_circular_plate(spec.get("prompt", ""))
                if exact is not None:
                    proposal = exact
                elif provider == "ollama":
                    proposal = interpret(spec.get("prompt", ""), model=spec.get("model"))
                elif provider in ("openai", "anthropic", "gemini"):
                    proposal = interpret_cloud(
                        spec.get("prompt", ""),
                        provider=provider,
                        model=spec.get("model", ""),
                        api_key=spec.get("api_key", ""),
                    )
                else:
                    raise ValueError("Unsupported AI provider")

        except (ValueError, UnicodeDecodeError) as exc:
            self._json(400, {"error": str(exc)})
            return
        except (RenderError, OCCTExportError, AIError) as exc:
            self._json(422, {"error": str(exc)})
            return
        if self.path == "/api/document/validate":
            self._json(200, {"project": project})
        elif self.path == "/api/interpret":
            self._json(200, {"spec": proposal, "review_required": True,
                             "message": "Review ALL dimensions and assumptions before generating."})
        elif self.path == "/api/scad":
            self._json(200, {"scad": scad})
        else:
            suffix, content_type = {
                "/api/stl": ("stl", "model/stl"),
                "/api/3mf": ("3mf", "model/3mf"),
                "/api/step": ("step", "application/step"),
            }[self.path]
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Disposition",
                             f'attachment; filename="orkicad.{suffix}"')
            self.send_header("Content-Length", str(len(binary)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(binary)

    def do_GET(self):
        if not self._check_private_token():
            return
        if self.path == "/api/health":
            self._json(200, {"status": "ok", "service": "orkicad-studio-api",
                             "catalog_version": CATALOG_VERSION})
        elif self.path == "/api/catalog":
            self._json(200, catalog_public())
        elif self.path == "/api/ollama/models":
            from urllib.parse import urlsplit
            import urllib.request
            import urllib.error
            base = os.environ.get("ORKICAD_OLLAMA_URL", "http://127.0.0.1:11434")
            parsed = urlsplit(base)
            if (parsed.scheme != "http" or parsed.hostname not in
                    {"127.0.0.1", "localhost", "::1"} or
                    parsed.username or parsed.password or parsed.query or
                    parsed.fragment or parsed.path not in ("", "/")):
                self._json(400, {"error": "Ollama must use a loopback endpoint"})
                return
            try:
                with urllib.request.urlopen(base.rstrip("/") + "/api/tags", timeout=5) as response:
                    data = json.loads(response.read(131072))
                    models = sorted(
                        [entry["name"] for entry in data.get("models", [])
                         if isinstance(entry, dict) and
                         isinstance(entry.get("name"), str)]
                    )
                self._json(200, {"models": models})
            except (OSError, ValueError, KeyError, urllib.error.URLError):
                self._json(503, {"error": "Ollama is not responding on localhost"})
        elif self.path == "/api/providers":
            self._json(200, {
                "providers": [{
                    "id": "ollama", "kind": "local", "configured": True,
                    "model": os.environ.get("ORKICAD_OLLAMA_MODEL", "qwen2.5:7b"),
                    "endpoint": os.environ.get("ORKICAD_OLLAMA_URL", "http://127.0.0.1:11434"),
                    "note": "Local provider; actual availability tested when prompted"
                }],
                "cloud_providers_enabled": True,
                "message": "Cloud providers require opt-in API keys on each request. Development localhost only."
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
    port = int(os.environ.get("ORKICAD_STUDIO_PORT", "8765"))
    if not 1 <= port <= 65535:
        raise ValueError("OrkiCAD server port must be 1..65535")
    server = ThreadingHTTPServer(("127.0.0.1", port), StudioHandler)
    print(f"OrkiCAD Studio local API at http://127.0.0.1:{port}/api/health")
    print("Local development only. Do not expose this unauthenticated server.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
