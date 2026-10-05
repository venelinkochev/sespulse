#!/usr/bin/env bash
# Regenerates every favicon / app icon from the SVG sources in this folder.
# Requires rsvg-convert (librsvg) and ImageMagick 7 (`magick`).
#   brew install librsvg imagemagick        # macOS
#   apt install librsvg2-bin imagemagick    # Debian/Ubuntu (IM6: use `convert`)
set -euo pipefail
cd "$(dirname "$0")"
APP=../src/app
PUB=../public
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Browser tab, modern browsers (Next serves src/app/icon.svg as /icon.svg)
cp icon.svg "$APP/icon.svg"

# Legacy .ico: hand-tuned 16px + 32/48px from the main mark
rsvg-convert -w 16 -h 16 icon-16.svg -o "$TMP/16.png"
rsvg-convert -w 32 -h 32 icon.svg -o "$TMP/32.png"
rsvg-convert -w 48 -h 48 icon.svg -o "$TMP/48.png"
magick "$TMP/16.png" "$TMP/32.png" "$TMP/48.png" "$APP/favicon.ico"

# iOS home screen: must be opaque or iOS renders a black square
rsvg-convert -w 180 -h 180 icon-full-bleed.svg -o "$TMP/apple.png"
magick "$TMP/apple.png" -background "#5b8def" -alpha remove -alpha off "$APP/apple-icon.png"

# PWA / Android (referenced from src/app/manifest.ts)
rsvg-convert -w 192 -h 192 icon.svg -o "$PUB/icon-192.png"
rsvg-convert -w 512 -h 512 icon.svg -o "$PUB/icon-512.png"
rsvg-convert -w 512 -h 512 icon-full-bleed.svg -o "$PUB/icon-maskable-512.png"

echo "Icons written to src/app and public/"
