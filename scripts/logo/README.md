# App logo

The logo (a lit diya on a lotus, in a gold-ringed green seal) is drawn in
code so every size stays in sync.

1. `python3 scripts/logo/generate-logo.py scripts/logo/out` writes the SVG
   variants (`icon`, `badge`, `android-fg`, `android-bg`, `android-mono`,
   `splash`).
2. `scripts/logo/render-svg.js <svg> <png> <px>` renders one to PNG with
   headless Chrome (needs `playwright-core` and Google Chrome installed).

Sizes used in `assets/images/`:

| file | source | px |
|---|---|---|
| icon.png | icon | 1024 |
| android-icon-foreground.png | android-fg | 512 |
| android-icon-background.png | android-bg | 512 |
| android-icon-monochrome.png | android-mono | 432 |
| splash-icon.png | splash | 600 |
| favicon.png | icon | 48 |
| logo-mark.png | badge | 360 |
| logo-mark-transparent.png | badge | 360 |
