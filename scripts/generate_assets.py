#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)


def font(size: int):
    candidates = [
        Path("C:/Windows/Fonts/segoeuib.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def make(size: int, dark: bool, path: Path):
    bg = "#07111f" if dark else "#eff6ff"
    navy = "#dbeafe" if dark else "#0f172a"
    blue = "#60a5fa" if dark else "#2563eb"
    cyan = "#22d3ee"
    image = Image.new("RGB", (size, size), bg)
    draw = ImageDraw.Draw(image)
    center = size // 2
    for ratio, width in [(0.78, max(2, size // 90)), (0.54, max(2, size // 100)), (0.30, max(2, size // 110))]:
        radius = int(size * ratio / 2)
        draw.ellipse((center-radius, center-radius, center+radius, center+radius), outline=blue, width=width)
    draw.line((center, center, int(size*0.82), int(size*0.24)), fill=cyan, width=max(3, size//45))
    dot = max(5, size//25)
    draw.ellipse((int(size*0.74)-dot, int(size*0.30)-dot, int(size*0.74)+dot, int(size*0.30)+dot), fill=cyan)
    label = "AR"
    f = font(max(16, size//4))
    box = draw.textbbox((0,0), label, font=f)
    tw, th = box[2]-box[0], box[3]-box[1]
    draw.rounded_rectangle((center-tw//2-12, center-th//2-8, center+tw//2+12, center+th//2+10), radius=max(6,size//30), fill=bg)
    draw.text((center-tw//2, center-th//2-2), label, font=f, fill=navy)
    image.save(path, optimize=True)


make(128, False, ASSETS / "icon.png")
make(512, False, ASSETS / "logo.png")
make(512, True, ASSETS / "logo-dark.png")
print(ASSETS)
