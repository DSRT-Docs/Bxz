#!/bin/bash
set -euo pipefail
VER="${1:-v1}"
OUT="cdn/$VER"
rm -rf "$OUT"
mkdir -p "$OUT"
TMP="$OUT/index.tmp.js"
npx esbuild src/index.js --bundle --format=iife --global-name=DSRT --minify --outfile="$TMP"
HASH=$(sha1sum "$TMP" | awk '{print $1}' | cut -c1-8)
FINAL="$OUT/index.$HASH.js"
mv "$TMP" "$FINAL"
echo "{\"main\":\"/cdn/$VER/$(basename $FINAL)\"}" > "$OUT/manifest.json"
cp types/index.d.ts "$OUT/index.d.ts" 2>/dev/null || true
echo "Release built -> $FINAL"
