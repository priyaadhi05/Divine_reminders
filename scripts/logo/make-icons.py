# App icon builder - see scripts/logo/README.md.
#
#   python3 scripts/logo/make-icons.py prepare <generated.png>
#       Cleans a 1024x1024 generated artwork (removes the generator's corner
#       sparkle mark, warms the pale water to match the temple glow) and
#       saves two masters next to this script: icon-master.png (zoomed on
#       the lotus, for square icons) and icon-master-wide.png (uncropped,
#       for Android's adaptive icon, which the launcher crops itself).
#
#   python3 scripts/logo/make-icons.py build
#       Writes every icon/splash/logo size in assets/images/ from the masters.
import os, sys
import cv2
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
IMAGES = os.path.join(HERE, '..', '..', 'assets', 'images')
MASTER = os.path.join(HERE, 'icon-master.png')
MASTER_WIDE = os.path.join(HERE, 'icon-master-wide.png')
GOLD = (201, 162, 39)


def remove_mark(img):
    # Gemini's ✦ sits in the lower-right corner: bright, colourless pixels.
    y0, y1, x0, x1 = 860, 950, 860, 950
    box = img[y0:y1, x0:x1].astype(int)
    grey, sat = box.mean(2), box.max(2) - box.min(2)
    mask = np.zeros(img.shape[:2], np.uint8)
    mask[y0:y1, x0:x1] = ((grey > grey.mean() + 12) & (sat < 30)).astype(np.uint8) * 255
    return cv2.inpaint(img, cv2.dilate(mask, np.ones((7, 7), np.uint8)), 9, cv2.INPAINT_TELEA)


def warm(img, start):
    # Unsaturated (grey-blue water) pixels below `start` take on the amber
    # of the rest of the scene, keeping their own light and shade.
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(float)
    y = np.linspace(0, 1, img.shape[0])[:, None]
    k = np.clip((y - start) / 0.2, 0, 1) * np.clip((70 - hsv[..., 1]) / 50, 0, 1)
    out = hsv.copy()
    out[..., 0] = np.where(k > 0.02, 15, hsv[..., 0])
    out[..., 1] = hsv[..., 1] * (1 - k) + np.maximum(hsv[..., 1], 140) * k
    out[..., 2] = hsv[..., 2] * (1 - 0.4 * k)
    return cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR)


def vignette(img):
    h = img.shape[0]
    yy, xx = np.mgrid[0:h, 0:h]
    r = np.sqrt((xx - h / 2) ** 2 + (yy - h / 2) ** 2) / (h * 0.71)
    v = 1 - 0.4 * np.clip((r - 0.6) / 0.4, 0, 1)
    return np.clip(img.astype(float) * v[..., None], 0, 255).astype(np.uint8)


def prepare(src_path):
    img = cv2.imread(src_path)
    assert img.shape[:2] == (1024, 1024), 'expected a 1024x1024 image'
    img = remove_mark(img)
    zoomed = cv2.resize(img[160:1000, 92:932], (1024, 1024), interpolation=cv2.INTER_LANCZOS4)
    cv2.imwrite(MASTER, vignette(warm(zoomed, 0.45)))
    cv2.imwrite(MASTER_WIDE, warm(img, 0.55))
    print('wrote', MASTER, MASTER_WIDE)


def circle(img, size, ring):
    # Round medallion with a gold ring, transparent outside - supersampled
    # so the edge stays smooth.
    s = size * 4
    art = img.resize((s, s), Image.LANCZOS).convert('RGBA')
    mask = Image.new('L', (s, s), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, s - 1, s - 1), fill=255)
    out = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    out.paste(art, (0, 0), mask)
    w = ring * 4
    ImageDraw.Draw(out).ellipse((w // 2, w // 2, s - 1 - w // 2, s - 1 - w // 2), outline=GOLD + (255,), width=w)
    return out.resize((size, size), Image.LANCZOS)


def save(img, name):
    img.save(os.path.join(IMAGES, name), optimize=True)
    print('wrote assets/images/' + name, img.size)


def build():
    master = Image.open(MASTER).convert('RGB')
    wide = Image.open(MASTER_WIDE).convert('RGB')
    save(master, 'icon.png')
    save(master.resize((48, 48), Image.LANCZOS), 'favicon.png')
    # Android adaptive icon: the launcher shows roughly the middle two thirds
    # of the foreground, so the uncropped artwork frames the lotus there.
    save(wide.resize((512, 512), Image.LANCZOS).convert('RGBA'), 'android-icon-foreground.png')
    edge = np.asarray(wide)[:24].reshape(-1, 3).mean(0).astype(int)
    save(Image.new('RGB', (512, 512), tuple(edge)), 'android-icon-background.png')
    # Splash and the in-app crest: a round gold-ringed medallion.
    save(circle(master, 600, 14), 'splash-icon.png')
    badge = circle(master, 360, 10)
    save(badge, 'logo-mark.png')
    save(badge, 'logo-mark-transparent.png')
    print('android background colour: #%02X%02X%02X' % tuple(edge))


if __name__ == '__main__':
    if sys.argv[1:2] == ['prepare'] and len(sys.argv) == 3:
        prepare(sys.argv[2])
    elif sys.argv[1:] == ['build']:
        build()
    else:
        sys.exit(__doc__ or 'usage: make-icons.py prepare <generated.png> | build')
