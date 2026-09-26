# Share cards

`generate-cards.py` builds the picture offered in each deity's "Share with
family" panel - `assets/deity-cards/<deity>.jpg`, 1080×1080 - from that
deity's logo in `assets/deity-logos/`. Re-run it whenever a logo changes.

The app writes the share greeting over the bottom of the card, so
everything important stays in the top ~60%.

## Fonts

Both are SIL Open Font License fonts from Google Fonts, fine to use in
published images. Download once into `scripts/cards/fonts/` (git-ignored):

```bash
mkdir -p scripts/cards/fonts && cd scripts/cards/fonts
curl -Lo Cinzel.ttf "https://github.com/google/fonts/raw/main/ofl/cinzel/Cinzel%5Bwght%5D.ttf"
curl -Lo PlayfairItalic.ttf "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay-Italic%5Bwght%5D.ttf"
```

## Run

```bash
pip install pillow numpy
python3 scripts/cards/generate-cards.py            # all deities
python3 scripts/cards/generate-cards.py murugan    # just one
```

To add a deity, add its logo to `assets/deity-logos/`, an entry to
`DEITIES` in the script, and a line to `src/lib/deity-cards.ts`.
