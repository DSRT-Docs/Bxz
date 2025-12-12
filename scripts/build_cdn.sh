#!/bin/bash
set -euo pipefail

VERSION="v1"
CDN_PATH="cdn/$VERSION"

echo "==== Building DSRT CDN ($VERSION) ===="
rm -rf "$CDN_PATH"
mkdir -p "$CDN_PATH"

echo "-> Bundling JS with esbuild..."
npx esbuild src/index.js \
  --bundle \
  --format=iife \
  --global-name=DSRT \
  --minify \
  --outfile="$CDN_PATH/index.js"

if command -v emcc >/dev/null 2>&1; then
  echo "-> Building WASM (C++ Native via emcc)..."
  emcc src/wasm/dsrt.cpp \
    -O3 \
    -s WASM=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s EXPORTED_FUNCTIONS='["_dsrt_add","_dsrt_dot3","_dsrt_length3","_dsrt_cross","_dsrt_normalize","_dsrt_mat4_mul","_dsrt_mat4_identity","_dsrt_mat4_transpose"]' \
    -s EXPORTED_RUNTIME_METHODS='["cwrap","getValue","setValue","malloc","free","HEAPF64"]' \
    -o "$CDN_PATH/dsrt.js"
else
  echo "-> emcc not found — skipping WASM build."
fi

echo "-> Generating TypeScript declarations..."
TMP=$(mktemp -d)
npx tsc --project tsconfig.json --emitDeclarationOnly --outDir "$TMP"

if [ -f "$TMP/src/index.d.ts" ]; then
  mv "$TMP/src/index.d.ts" "$CDN_PATH/index.d.ts"
else
  DTS=$(find $TMP -name "*.d.ts" | head -n 1)
  if [ -n "$DTS" ]; then
    cp "$DTS" "$CDN_PATH/index.d.ts"
  fi
fi
rm -rf "$TMP"

if [ -d "assets" ]; then
  cp -r assets "$CDN_PATH/"
fi

echo "==== DONE: CDN build → $CDN_PATH ===="
