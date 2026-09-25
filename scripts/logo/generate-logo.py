# App logo generator - see scripts/logo/README.md.
import math, os, sys

PETAL = "M0 0 C -48 -60, -50 -125, 0 -172 C 50 -125, 48 -60, 0 0 Z"
VEIN = "M0 -14 C -6 -70, -6 -110, 0 -150"

def petal(cx, cy, rot, scale, fill, mono, vein=True):
    t = f'translate({cx} {cy}) rotate({rot}) scale({scale})'
    if mono:
        return f'<path d="{PETAL}" transform="{t}" fill="#FFFFFF"/>'
    s = f'<path d="{PETAL}" transform="{t}" fill="{fill}" stroke="#C99A3A" stroke-width="4"/>'
    if vein:
        s += f'<path d="{VEIN}" transform="{t}" fill="none" stroke="#FFF3F6" stroke-width="4" stroke-linecap="round" opacity="0.7"/>'
    return s

def sparkle(x, y, r, op=1.0):
    return (f'<path d="M{x} {y-r} Q {x+r*0.18} {y-r*0.18} {x+r} {y} Q {x+r*0.18} {y+r*0.18} {x} {y+r} '
            f'Q {x-r*0.18} {y+r*0.18} {x-r} {y} Q {x-r*0.18} {y-r*0.18} {x} {y-r} Z" fill="#FFF4C2" opacity="{op}"/>')

def mandala():
    out = []
    # soft sunburst
    for i in range(36):
        a = i * 10
        out.append(f'<path d="M512 512 L {512-14} 120 L {512+14} 120 Z" transform="rotate({a} 512 512)" fill="#FFE39A" opacity="0.07"/>')
    # ring of petals
    for i in range(24):
        a = i * 15
        out.append(f'<path d="M512 170 C 494 196, 494 222, 512 246 C 530 222, 530 196, 512 170 Z" transform="rotate({a} 512 512)" fill="none" stroke="#E8C36A" stroke-width="3" opacity="0.35"/>')
    out.append('<circle cx="512" cy="512" r="262" fill="none" stroke="#E8C36A" stroke-width="2" opacity="0.3"/>')
    return "\n".join(out)

def border():
    out = ['<circle cx="512" cy="512" r="476" fill="none" stroke="url(#goldring)" stroke-width="16"/>',
           '<circle cx="512" cy="512" r="446" fill="none" stroke="url(#goldring)" stroke-width="5"/>']
    for i in range(60):
        a = math.radians(i * 6)
        x, y = 512 + 461 * math.cos(a), 512 + 461 * math.sin(a)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5" fill="#F3D27E"/>')
    return "\n".join(out)

def lamp(mono=False):
    p = []
    cx, base = 512, 760
    pinkA, pinkB = "url(#pinkDeep)", "url(#pinkLight)"
    # back petals (behind lamp)
    for rot, sc in [(-88, 1.18), (88, 1.18)]:
        p.append(petal(cx, base, rot, sc, pinkA, mono))
    for rot, sc in [(-62, 1.4), (62, 1.4)]:
        p.append(petal(cx, base, rot, sc, pinkB, mono))
    for rot, sc in [(-34, 1.5), (34, 1.5)]:
        p.append(petal(cx, base, rot, sc, pinkA, mono))
    # lamp bowl
    gold = "#FFFFFF" if mono else "url(#gold)"
    p.append(f'<path d="M322 566 Q 512 536 702 566 Q 686 692 512 708 Q 338 692 322 566 Z" fill="{gold}" '
             + ('' if mono else 'stroke="#9C6A16" stroke-width="6"') + '/>')
    if not mono:
        p.append('<ellipse cx="512" cy="568" rx="186" ry="30" fill="#6E3F0A"/>')
        p.append('<ellipse cx="512" cy="564" rx="168" ry="20" fill="#D89A2A"/>')
        # decorative band with beads
        p.append('<path d="M346 616 Q 512 646 678 616" fill="none" stroke="#9C6A16" stroke-width="5"/>')
        for i in range(11):
            t = i / 10
            x = 360 + t * 304
            y = 622 + 26 * (1 - (2 * t - 1) ** 2)
            p.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="7" fill="#FFF0B8" stroke="#9C6A16" stroke-width="2"/>')
        p.append('<path d="M372 590 Q 512 608 652 590" fill="none" stroke="#FFF6D6" stroke-width="7" stroke-linecap="round" opacity="0.75"/>')
    # front petals cupping the bowl
    for rot, sc in [(-16, 0.9), (16, 0.9)]:
        p.append(petal(cx, base + 6, rot, sc, pinkB, mono))
    # wick + flame
    if not mono:
        p.append('<rect x="505" y="516" width="14" height="48" rx="7" fill="#4A2C0A"/>')
        p.append('<path d="M512 226 C 440 336, 420 430, 512 530 C 604 430, 584 336, 512 226 Z" fill="#FFB02E" filter="url(#blur)" opacity="0.9"/>')
    flame = "#FFFFFF" if mono else "url(#flame)"
    p.append(f'<path d="M512 240 C 452 340, 436 428, 512 526 C 588 428, 572 340, 512 240 Z" fill="{flame}"/>')
    if not mono:
        p.append('<path d="M512 336 C 480 396, 474 440, 512 508 C 550 440, 544 396, 512 336 Z" fill="#FFF8D6"/>')
        p.append('<path d="M512 420 C 500 446, 498 466, 512 500 C 526 466, 524 446, 512 420 Z" fill="#FFFFFF"/>')
        p.append(sparkle(392, 300, 26, 0.95))
        p.append(sparkle(640, 262, 20, 0.9))
        p.append(sparkle(662, 380, 13, 0.8))
        p.append(sparkle(366, 408, 12, 0.75))
    return "\n".join(p)

DEFS = '''<defs>
  <radialGradient id="bg" cx="50%" cy="44%" r="72%"><stop offset="0" stop-color="#2E9443"/><stop offset="0.5" stop-color="#1B6B28"/><stop offset="1" stop-color="#08300F"/></radialGradient>
  <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF0B3" stop-opacity="0.95"/><stop offset="0.35" stop-color="#FFD166" stop-opacity="0.55"/><stop offset="1" stop-color="#FFB703" stop-opacity="0"/></radialGradient>
  <linearGradient id="goldring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF0B0"/><stop offset="0.35" stop-color="#E4B24A"/><stop offset="0.65" stop-color="#FFE59A"/><stop offset="1" stop-color="#B7832A"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9A6"/><stop offset="0.45" stop-color="#F0BD48"/><stop offset="1" stop-color="#A5681A"/></linearGradient>
  <linearGradient id="pinkLight" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFE4EC"/><stop offset="1" stop-color="#EC6F97"/></linearGradient>
  <linearGradient id="pinkDeep" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FAD0DC"/><stop offset="1" stop-color="#C93A68"/></linearGradient>
  <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF5A00"/><stop offset="0.45" stop-color="#FF9F1A"/><stop offset="1" stop-color="#FFE266"/></linearGradient>
  <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
</defs>'''

def compose(bg=True, deco=True, mono=False, scale=1.0, shape='square'):
    parts = []
    if bg:
        parts.append('<rect width="1024" height="1024" fill="url(#bg)"/>' if shape == 'square'
                     else '<circle cx="512" cy="512" r="512" fill="url(#bg)"/>')
    inner = []
    if deco and not mono:
        inner.append(mandala())
    if not mono:
        inner.append('<circle cx="512" cy="420" r="300" fill="url(#halo)"/>')
    # the lamp is drawn a little larger than its natural size so it holds up as a small icon
    inner.append(f'<g transform="translate(512 520) scale(1.12) translate(-512 -520)">{lamp(mono)}</g>')
    if deco and not mono:
        inner.append(border())
    t = f'translate({512*(1-scale)} {512*(1-scale)}) scale({scale})'
    parts.append(f'<g transform="{t}">' + "\n".join(inner) + '</g>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{DEFS}' + "\n".join(parts) + '</svg>'

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
variants = {
    'icon': compose(),
    'badge': compose(shape='circle'),
    'android-bg': compose(deco=False).split('<g transform')[0] + '</svg>',
    'android-fg': compose(bg=False, deco=False, scale=0.72),
    'android-mono': compose(bg=False, deco=False, mono=True, scale=0.72),
    'splash': compose(bg=False, deco=False, scale=0.95),
}
for name, svg in variants.items():
    open(os.path.join(out, name + '.svg'), 'w').write(svg)
print('ok')
