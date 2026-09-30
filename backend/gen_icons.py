import cairosvg
import os

SVG_PATH = os.path.join(os.path.dirname(__file__), '..', 'extension', 'icons', 'icon.svg')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'extension', 'icons')

for size in [16, 48, 128]:
    out = os.path.join(OUT_DIR, f'icon{size}.png')
    cairosvg.svg2png(url=SVG_PATH, write_to=out, output_width=size, output_height=size)
    print(f"Created {out}")

# Also create logo.png at root of extension
import shutil
shutil.copy(os.path.join(OUT_DIR, 'icon128.png'), os.path.join(OUT_DIR, '..', 'logo.png'))
print("Copied logo.png")
