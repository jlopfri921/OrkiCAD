"""Serve built OrkiCAD AI Web on loopback with the same private Core API.

No Vite/npm process is required after build. This is a LOCAL test runner;
do not expose it to a LAN or the public Internet.
"""
from __future__ import annotations

import mimetypes
import os
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from orkicad_core.studio_server import StudioHandler


DIST = (Path(__file__).resolve().parent / "frontend" / "dist").resolve()
MAX_STATIC_BYTES = 32 * 1024 * 1024


class BuiltStudioHandler(StudioHandler):
    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path.startswith("/api/"):
            return super().do_GET()
        if not DIST.is_dir():
            return self._json(503, {"error": "Missing Web build: run npm run build"})
        # Strictly serve static assets from this checked-out build directory.
        candidate = (DIST / path.lstrip("/")).resolve()
        if not candidate.is_relative_to(DIST):
            self.send_error(403)
            return
        if candidate.is_dir() or not candidate.exists():
            candidate = DIST / "index.html" if path == "/" else candidate
        if not candidate.is_file():
            self.send_error(404)
            return
        stat = candidate.stat()
        if stat.st_size > MAX_STATIC_BYTES:
            self.send_error(413)
            return
        mime = mimetypes.guess_type(candidate.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", mime + ("; charset=utf-8" if mime.startswith("text/") or mime in ("application/javascript", "image/svg+xml") else ""))
        self.send_header("Content-Length", str(stat.st_size))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; worker-src 'self' blob:")
        self.end_headers()
        with candidate.open("rb") as stream:
            while block := stream.read(128 * 1024):
                self.wfile.write(block)


def main():
    port = int(os.environ.get("ORKICAD_STUDIO_PORT", "8765"))
    if not 1 <= port <= 65535:
        raise ValueError("ORKICAD_STUDIO_PORT must be 1..65535")
    if not DIST.is_dir():
        raise FileNotFoundError(f"OrkiCAD AI Web build missing: {DIST}")
    server = ThreadingHTTPServer(("127.0.0.1", port), BuiltStudioHandler)
    print(f"OrkiCAD AI Web: http://127.0.0.1:{port}")
    print("Local-only development preview. Do not port-forward this endpoint.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
