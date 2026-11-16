"""PyInstaller entrypoint for the optional Windows test package.

This is a headless, token-protected loopback CAD worker started by the Tauri
shell. OpenSCAD/BOSL2 and OCCT/OCP are optional external development runtimes,
not bundled or certified by this experimental package.
"""
from orkicad_core.studio_server import main

if __name__ == "__main__":
    main()
