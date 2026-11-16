"""Build the rounded, bordered OrkiCAD AI Windows icon from official logo.

For experimental Tauri packaging only; Pillow is a build dependency.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "logo_OrkiCAD-AI.png"
target = ROOT / "studio" / "frontend" / "src-tauri" / "icons"
if not source.is_file():
    raise SystemExit(f"Official OrkiCAD AI logo missing: {source}")
target.mkdir(parents=True, exist_ok=True)

# Supersample before reduction for a clean, translucent, rounded silhouette.
scale = 4
side = 256 * scale
radius = 48 * scale
border = 5 * scale
margin = 12 * scale
canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
draw = ImageDraw.Draw(canvas)
bounds = (margin, margin, side - margin - 1, side - margin - 1)
draw.rounded_rectangle(bounds, radius=radius, fill="#102638",
                       outline="#819da9", width=border)
with Image.open(source) as original:
    logo = original.convert("RGBA")
    logo.thumbnail((195 * scale, 195 * scale), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo, ((side - logo.width) // 2,
                                  (side - logo.height) // 2))
canvas = canvas.resize((256, 256), Image.Resampling.LANCZOS)
canvas.save(target / "icon.png")
canvas.save(target / "icon.ico", sizes=[
    (16, 16), (24, 24), (32, 32), (48, 48), (64, 64),
    (128, 128), (256, 256)
])
print(f"Prepared rounded OrkiCAD AI app icons in {target}")
