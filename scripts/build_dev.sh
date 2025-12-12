#!/bin/bash
set -euo pipefail
VER="${1:-v1}"
OUT="cdn/$VER"
rm -rf "$OUT"
mkdir -p "$OUT"
npx esbuild src/index.js --bundle --format=esm --sourcemap --outfile="$OUT/index.js"
cp types/index.d.ts "$OUT/index.d.ts" 2>/dev/null || true
echo "Dev bundle -> $OUT/index.js"
