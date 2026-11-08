import math, os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tianji", "res")
SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
INK = (9, 11, 16, 255)
GOLD = (206, 170, 104, 255)


def make(size):
    s = 1024
    img = Image.new("RGBA", (s, s), INK)
    d = ImageDraw.Draw(img)
    # soft radial glow
    glow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(60, 0, -1):
        r = int(s * 0.55 * i / 60)
        a = int(10 * (1 - i / 60))
        gd.ellipse([s / 2 - r, s / 2 - r, s / 2 + r, s / 2 + r], fill=(200, 164, 90, a))
    img = Image.alpha_composite(img, glow)

    d = ImageDraw.Draw(img)
    cx, cy = s / 2, s / 2
    # rings
    for r, w, a in ((s * 0.335, 9, 255), (s * 0.30, 3, 110)):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(GOLD[0], GOLD[1], GOLD[2], a), width=w)
    # trigram strokes (qian)
    bw, bh, gap = s * 0.34, s * 0.043, s * 0.062
    top = cy - gap - bh * 1.5
    for i in range(3):
        y = top + i * (bh + gap)
        d.rounded_rectangle([cx - bw / 2, y, cx + bw / 2, y + bh], radius=bh / 2, fill=GOLD)
    # corner ticks
    for (x0, y0, x1, y1) in ((0.18, 0.18, 0.18, 0.30), (0.18, 0.18, 0.30, 0.18)):
        pass
    return img.resize((size, size), Image.LANCZOS)


for bucket, px in SIZES.items():
    out = os.path.join(SRC, f"mipmap-{bucket}")
    os.makedirs(out, exist_ok=True)
    make(px).save(os.path.join(out, "ic_launcher.png"))

# store listing / preview
make(512).save(os.path.join(ROOT, "tianji", "icon-512.png"))
print("icons done")
