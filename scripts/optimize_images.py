"""Resize + recompress oversized product/catalog photos for PageSpeed image-delivery savings.
Run manually: python scripts/optimize_images.py
"""
from PIL import Image
import glob
import os

# (glob pattern, target max width in px, jpeg quality)
JOBS = [
    ("assets/img/productos/*.jpg", 800, 78),   # catalog thumbnails (~380px display, 2x retina)
    ("assets/imgCamisetas/*.jpg", 1200, 80),   # PDP gallery + lightbox (~600px display, 2x retina)
]

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

for pattern, max_w, quality in JOBS:
    for path in glob.glob(os.path.join(root, pattern)):
        im = Image.open(path)
        before = os.path.getsize(path)
        if im.width > max_w:
            ratio = max_w / im.width
            im = im.resize((max_w, round(im.height * ratio)), Image.LANCZOS)
        im.convert("RGB").save(path, "JPEG", quality=quality, optimize=True, progressive=True)
        after = os.path.getsize(path)
        print(f"{os.path.relpath(path, root)}: {before//1024}KB -> {after//1024}KB")
