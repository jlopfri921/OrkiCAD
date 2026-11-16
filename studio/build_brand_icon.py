"""Generate app packaging icons from the official repository logo.

Only used by the Windows experimental build. Requires Pillow at build-time.
Never ship proprietary or third-party font files.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "logo_OrkiCAD-AI.png"
target = ROOT / "studio" / "frontend" / "src-tauri" / "icons"
if not source.is_file():
    raise SystemExit(f"Official OrkiCAD AI logo missing: {source}")
target.mkdir(parents=True, exist_ok=True)
with Image.open(source) as picture:
    picture = picture.convert("RGBA")
    picture.thumbnail((216, 216), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (256, 256), "#0b1625")
    canvas.alpha_composite(picture, ((256 - picture.width) // 2, (256 - picture.height) // 2))
    canvas.save(target / "icon.png")
    canvas.save(target / "icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print(f"Prepared official OrkiCAD AI icons in {target}")
