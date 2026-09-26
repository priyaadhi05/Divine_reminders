# App logo

The icon is a lit diya on a lotus in a temple, generated as a 1024×1024
image and turned into every size by `make-icons.py` (needs `pip install
opencv-python pillow numpy`):

1. `python3 scripts/logo/make-icons.py prepare <generated.png>` removes the
   generator's corner mark, warms the pale water and saves the two masters
   here - `icon-master.png` (zoomed on the lotus) and `icon-master-wide.png`
   (uncropped, for Android's adaptive icon, which the launcher crops).
2. `python3 scripts/logo/make-icons.py build` writes `icon.png`,
   `favicon.png`, `android-icon-foreground.png`,
   `android-icon-background.png`, `splash-icon.png`, `logo-mark.png` and
   `logo-mark-transparent.png` in `assets/images/`. It prints the Android
   background colour - keep `android.adaptiveIcon.backgroundColor` in
   `app.json` in step with it.

Then re-run `scripts/cards/generate-cards.py` if the share cards should
pick up any branding change.

`android-icon-monochrome.png` (the silhouette Android 13+ uses for themed
icons) still comes from the earlier drawn logo - `generate-logo.py`'s
`android-mono` variant, rendered with `render-svg.js` at 432 px. It is the
same diya-on-lotus shape, so it still matches.
