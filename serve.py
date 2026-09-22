#!/usr/bin/env python3
"""
Local development server for membership-verification.
Mimics Vercel's cleanUrls and rewrites:
  - /admin         -> admin.html
  - /verify        -> verify.html
  - /verify/:id    -> verify.html
"""

import http.server
import os
import sys
import urllib.parse

PORT = 8080
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(ROOT_DIR, "public")


class VercelDevHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def translate_path(self, path):
        # Extract the pure path without query string or hash
        parsed = urllib.parse.urlparse(path)
        clean_path = parsed.path

        # 1. Rewrite: /verify/<serial> -> verify.html
        if clean_path.startswith("/verify/") and len(clean_path) > 8:
            return os.path.join(PUBLIC_DIR, "verify.html")

        # 2. Clean URLs: map extensionless paths (e.g. /admin, /verify) to .html if exists
        ext = os.path.splitext(clean_path)[1]
        if not ext and clean_path != "/":
            trimmed = clean_path.strip("/")
            candidate = os.path.join(PUBLIC_DIR, f"{trimmed}.html")
            if os.path.isfile(candidate):
                return candidate

        return super().translate_path(path)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    server_address = ("", port)

    with http.server.ThreadingHTTPServer(server_address, VercelDevHandler) as httpd:
        print(f"Development server running at http://localhost:{port}/")
        print(f"Serving '{PUBLIC_DIR}' with cleanUrls and rewrites enabled.\n")
        print("Available routes:")
        print(f"  - http://localhost:{port}/               (Login page)")
        print(f"  - http://localhost:{port}/admin          (Admin dashboard)")
        print(f"  - http://localhost:{port}/verify?serial=X (Member verification)")
        print(f"  - http://localhost:{port}/verify/X       (Member verification by path)\n")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()
