"""Synchronize framework-neutral UI assets into the two shipped clients.

Source of truth: shared/ui/feature_viewport.js
Consumers: Studio React (web/desktop) and ComfyUI plugin static assets.
Usage: python scripts/sync_shared_ui.py [--check]
"""
from __future__ import annotations

import argparse
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "shared/ui/feature_viewport.js"
DESTINATIONS = (
    ROOT / "studio/frontend/src/feature_viewport.js",
    ROOT / "comfyui/orkicad_nodes/web/feature_viewport.js",
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="Fail if either shipped copy differs from shared source")
    args = parser.parse_args()
    canonical = SOURCE.read_bytes()
    mismatch = False
    for destination in DESTINATIONS:
        if destination.is_file() and destination.read_bytes() == canonical:
            print("OK:", destination.relative_to(ROOT))
            continue
        mismatch = True
        print("OUT OF SYNC:", destination.relative_to(ROOT))
        if not args.check:
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(canonical)
            print("UPDATED:", destination.relative_to(ROOT))
    return int(mismatch and args.check)


if __name__ == "__main__":
    sys.exit(main())
