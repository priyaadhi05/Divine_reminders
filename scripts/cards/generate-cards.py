# Share-card generator - see scripts/cards/README.md.
#
# Builds assets/deity-cards/<deity>.jpg (1080x1080) around each deity's logo
# in assets/deity-logos/. The app writes the share greeting over the bottom
# of the card as a caption band (src/components/greeting-card.tsx), so the
# brand, logo, name and mantra all sit in the top ~60%.
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FONTS = os.environ.get('CARD_FONTS', os.path.join(os.path.dirname(__file__), 'fonts'))
SIZE = 1080
GOLD = (233, 196, 106)
GOLD_DEEP = (201, 162, 39)
CREAM = (255, 246, 226)

# name, mantra, (centre colour, edge colour) - names match DEITIES in
# src/data/events.ts.
DEITIES = {
    'murugan': ('Murugan', 'Vel Vel!', ((150, 38, 22), (48, 8, 4))),
    'vishnu': ('Vishnu', 'Om Namo Narayanaya', ((26, 58, 128), (6, 14, 42))),
    'shiva': ('Shiva', 'Om Namah Shivaya', ((34, 50, 96), (8, 10, 28))),
    'durga': ('Amman', 'Om Shakti!', ((128, 22, 30), (40, 4, 8))),
    'ganesha': ('Ganesha', 'Om Gam Ganapataye Namaha', ((156, 76, 10), (52, 22, 2))),
    'ayyappan': ('Ayyappan', 'Swamiye Saranam Ayyappa', ((22, 96, 60), (4, 30, 18))),
    'hanuman': ('Hanuman', 'Om Hanumate Namaha', ((170, 64, 14), (58, 16, 2))),
    'lakshmi': ('Lakshmi', 'Om Shreem Mahalakshmiyei Namaha', ((140, 30, 80), (44, 6, 26))),
}

LOGO_CENTER = (SIZE // 2, 372)
LOGO_D = 400


def font(name, size, variation):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    f.set_variation_by_name(variation)
    return f


def background(inner, outer):
    y, x = np.mgrid[0:SIZE, 0:SIZE]
    cx, cy = LOGO_CENTER
    d = np.sqrt((x - cx) ** 2 + (y - cy) ** 2) / (SIZE * 0.85)
    t = np.clip(d, 0, 1)[..., None]
    rgb = np.array(inner) * (1 - t) + np.array(outer) * t
    return Image.fromarray(rgb.astype(np.uint8), 'RGB')


def overlay(base, draw_fn, blur=0):
    layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(layer))
    if blur:
        layer = layer.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(base, layer)


def rays(d):
    cx, cy = LOGO_CENTER
    for i in range(48):
        a = math.radians(i * 7.5)
        w = math.radians(1.2)
        r = SIZE * 1.2
        pts = [(cx, cy),
               (cx + r * math.cos(a - w), cy + r * math.sin(a - w)),
               (cx + r * math.cos(a + w), cy + r * math.sin(a + w))]
        d.polygon(pts, fill=GOLD + (22,))


def halo(d):
    cx, cy = LOGO_CENTER
    r = LOGO_D // 2 + 70
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=GOLD + (70,))


def rings(d):
    cx, cy = LOGO_CENTER
    r = LOGO_D // 2
    d.ellipse((cx - r - 14, cy - r - 14, cx + r + 14, cy + r + 14), outline=GOLD + (255,), width=12)
    d.ellipse((cx - r - 34, cy - r - 34, cx + r + 34, cy + r + 34), outline=GOLD + (200,), width=3)
    for i in range(72):
        a = math.radians(i * 5)
        x, y = cx + (r + 50) * math.cos(a), cy + (r + 50) * math.sin(a)
        d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=GOLD + (230,))


def spaced(d, y, text, f, fill, spacing):
    widths = [d.textlength(ch, font=f) for ch in text]
    total = sum(widths) + spacing * (len(text) - 1)
    x = (SIZE - total) / 2
    for ch, w in zip(text, widths):
        d.text((x, y), ch, font=f, fill=fill, anchor='ls')
        x += w + spacing
    return (SIZE - total) / 2, (SIZE + total) / 2


def text(d, name, mantra):
    brand = font('Cinzel.ttf', 34, 'Bold')
    left, right = spaced(d, 78, 'BHAKTI REMINDER', brand, GOLD + (255,), 7)
    for x0, x1 in ((left - 110, left - 24), (right + 24, right + 110)):
        d.line((x0, 66, x1, 66), fill=GOLD + (200,), width=2)
    title = font('Cinzel.ttf', 92, 'Bold')
    d.text((SIZE / 2 + 3, 735 + 4), name, font=title, fill=(0, 0, 0, 120), anchor='ms')
    d.text((SIZE / 2, 735), name, font=title, fill=CREAM + (255,), anchor='ms')
    size = 42
    sub = font('PlayfairItalic.ttf', size, 'Medium Italic')
    while d.textlength(mantra, font=sub) > SIZE - 160:
        size -= 2
        sub = font('PlayfairItalic.ttf', size, 'Medium Italic')
    d.text((SIZE / 2, 803), mantra, font=sub, fill=GOLD + (255,), anchor='ms')


def build(deity_id):
    name, mantra, (inner, outer) = DEITIES[deity_id]
    card = background(inner, outer).convert('RGBA')
    card = overlay(card, rays)
    card = overlay(card, halo, blur=40)

    logo = Image.open(os.path.join(ROOT, 'assets', 'deity-logos', f'{deity_id}.jpg')).convert('RGB')
    logo = logo.resize((LOGO_D, LOGO_D), Image.LANCZOS)
    mask = Image.new('L', (LOGO_D * 4, LOGO_D * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, LOGO_D * 4 - 1, LOGO_D * 4 - 1), fill=255)
    mask = mask.resize((LOGO_D, LOGO_D), Image.LANCZOS)
    card.paste(logo, (LOGO_CENTER[0] - LOGO_D // 2, LOGO_CENTER[1] - LOGO_D // 2), mask)

    card = overlay(card, rings)
    card = overlay(card, lambda d: text(d, name, mantra))
    out = os.path.join(ROOT, 'assets', 'deity-cards', f'{deity_id}.jpg')
    card.convert('RGB').save(out, quality=90, optimize=True)
    print('wrote', os.path.relpath(out, ROOT))


if __name__ == '__main__':
    for deity_id in sys.argv[1:] or DEITIES:
        build(deity_id)
