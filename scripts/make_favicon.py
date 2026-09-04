from PIL import Image, ImageDraw

src = Image.open("favicon.jpeg").convert("RGB")
gray = src.convert("L")
low, high = 150, 225

def alpha_map(v):
    if v <= low: return 0
    if v >= high: return 255
    return int((v - low) / (high - low) * 255)

alpha = gray.point(alpha_map)
full_bbox = alpha.getbbox()
l, t, r, b = full_bbox

# "RDH" sits above the "Imports" tagline in this source image, so split by
# scanning rows for the gap between the two lines (not columns).
row_has_ink = []
for y in range(t, b):
    row = alpha.crop((l, y, r, y + 1))
    row_has_ink.append(row.getbbox() is not None)

runs = []
run_start = None
for i, v in enumerate(row_has_ink):
    if not v and run_start is None:
        run_start = i
    if v and run_start is not None:
        runs.append((run_start, i))
        run_start = None
if run_start is not None:
    runs.append((run_start, len(row_has_ink)))

runs = [r_ for r_ in runs if r_[1] - r_[0] > 8]
runs.sort(key=lambda r_: r_[1] - r_[0], reverse=True)
gap_start_rel, gap_end_rel = runs[0]
rdh_bottom = t + gap_start_rel

rdh_bbox = (l, t, r, rdh_bottom)
rdh_alpha = alpha.crop(rdh_bbox)
pad = 6
rdh_alpha_bbox = rdh_alpha.getbbox()
al, at, ar, ab = rdh_alpha_bbox
al = max(0, al - pad); at = max(0, at - pad)
ar = min(rdh_alpha.width, ar + pad); ab = min(rdh_alpha.height, ab + pad)
rdh_alpha = rdh_alpha.crop((al, at, ar, ab))

w, h = rdh_alpha.size
white_mark = Image.new("RGBA", (w, h), (255, 255, 255, 0))
white_mark.putalpha(rdh_alpha)
white_mark.save("assets/img/mark-rdh-white.png")
print("mark size:", w, h)

# Build square favicons: rust background circle-ish square, white RDH mark centered
RUST = (184, 69, 43, 255)
OLIVE_950 = (28, 27, 21, 255)

def make_icon(size, bg=RUST, mark_scale=0.62):
    canvas = Image.new("RGBA", (size, size), bg)
    target_w = int(size * mark_scale)
    scale = target_w / w
    target_h = max(1, int(h * scale))
    mark_resized = white_mark.resize((target_w, target_h), Image.LANCZOS)
    x = (size - target_w) // 2
    y = (size - target_h) // 2
    canvas.alpha_composite(mark_resized, (x, y))
    return canvas

sizes = {
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
    "favicon-48x48.png": 48,
    "apple-touch-icon.png": 180,
    "android-chrome-192x192.png": 192,
    "android-chrome-512x512.png": 512,
}

for name, sz in sizes.items():
    icon = make_icon(sz)
    icon.save(f"assets/img/{name}")

# multi-size .ico
# Pillow's ICO writer skips any requested size larger than the base image
# passed to .save(), so the base must be the largest frame.
ico_sizes = [48, 32, 16]
ico_imgs = [make_icon(s) for s in ico_sizes]
ico_imgs[0].save("favicon.ico", format="ICO", sizes=[(s, s) for s in ico_sizes],
                  append_images=ico_imgs[1:])

print("done")
