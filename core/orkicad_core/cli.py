"""CLI for safely generating OpenSCAD and optionally STL output."""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

from .geometry import ParameterError, generate_scad


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="OrkiCAD prototype CAD generator")
    parser.add_argument("spec", type=Path, help="JSON specification file")
    parser.add_argument("-o", "--output", required=True, type=Path,
                        help="Output .scad or .stl")
    parser.add_argument("--openscad", default="openscad",
                        help="Explicit OpenSCAD executable path or PATH name")
    parser.add_argument("--bosl2-dir", type=Path, default=None,
                        help="Path to folder containing BOSL2/std.scad")
    args = parser.parse_args(argv)
    try:
        if args.output.suffix.lower() not in (".scad", ".stl"):
            raise ParameterError("output must end in .scad or .stl")
        source = json.loads(args.spec.read_text(encoding="utf-8"))
        scad = generate_scad(source)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        if args.output.suffix.lower() == ".scad":
            args.output.write_text(scad, encoding="utf-8")
        else:
            exe = shutil.which(args.openscad)
            if exe is None:
                raise ParameterError(
                    "OpenSCAD not found; install it or pass --openscad PATH"
                )
            env = os.environ.copy()
            if args.bosl2_dir is not None:
                folder = args.bosl2_dir.expanduser().resolve()
                if not all((folder / name).is_file() for name in
                           ("std.scad", "screws.scad", "gears.scad")):
                    raise ParameterError(
                        "--bosl2-dir must point to the BOSL2 folder "
                        "containing std.scad, screws.scad and gears.scad"
                    )
                env["OPENSCADPATH"] = os.pathsep.join(
                    path for path in (str(folder.parent), env.get("OPENSCADPATH", ""))
                    if path
                )
            # Generated SCAD is a validated allowlisted template, never raw LLM code.
            import tempfile
            with tempfile.TemporaryDirectory(prefix="orkicad_") as tmp:
                source_file = Path(tmp) / "part.scad"
                source_file.write_text(scad, encoding="utf-8")
                completed = subprocess.run(
                    [exe, "-o", str(args.output.resolve()), str(source_file)],
                    check=True,
                    timeout=120,
                    capture_output=True,
                    text=True,
                    env=env,
                )
                if any(fragment in completed.stderr for fragment in (
                    "Can't open include file",
                    "Ignoring unknown module",
                    "Unable to convert file",
                )):
                    raise ParameterError(
                        "OpenSCAD reports a missing library or invalid module: "
                        + completed.stderr[-1500:]
                    )
            if not args.output.is_file() or args.output.stat().st_size == 0:
                raise ParameterError("OpenSCAD did not produce an STL")
        print(f"Created: {args.output}")
        return 0
    except (OSError, ValueError, json.JSONDecodeError,
            subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        print(f"OrkiCAD error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
