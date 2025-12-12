#!/bin/bash
set -euo pipefail

VERSION="v1"
CDN_PATH="cdn/$VERSION"
echo "Building DSRT CDN ($VERSION)..."
rm -rf "$CDN_PATH"
mkdir -p "$CDN_PATH"

# 1) Build JS bundle (esbuild)
echo "-> Bundling JS with esbuild..."
npx esbuild src/index.js \
  --bundle \
  --format=iife \
  --global-name=DSRT \
  --minify \
  --outfile="$CDN_PATH/index.js"

# 2) Build wasm using emcc (if emcc available)
if command -v emcc >/dev/null 2>&1; then
  echo "-> Building WASM with emcc..."
  # produce emscripten glue (dsrt.js) and dsrt.wasm in CDN_PATH
  emcc src/wasm/dsrt.cpp -O3 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 \
    -s EXPORTED_FUNCTIONS='["_dsrt_add","_dsrt_dot3","_dsrt_length3"]' \
    -s EXPORTED_RUNTIME_METHODS='["cwrap","getValue","setValue","malloc","free"]' \
    -o "$CDN_PATH/dsrt.js"

  # emcc should create dsrt.wasm next to dsrt.js automatically
  if [ -f "$CDN_PATH/dsrt.wasm" ]; then
    echo "-> WASM built: $CDN_PATH/dsrt.wasm"
  else
    echo "-> Warning: dsrt.wasm not found next to dsrt.js"
  fi
else
  echo "-> emcc not found: skipping WASM build (install emsdk if you want WASM)."
fi

# 3) Generate TypeScript declarations from JS using tsc (allowJs + declaration)
if command -v npx >/dev/null 2>&1; then
  echo "-> Generating TypeScript declarations (index.d.ts)..."
  # create temp output dir for declarations
  TMP_DECL_OUT="$(mktemp -d)"
  # run tsc with project tsconfig.json, emit declaration only to temp folder
  npx tsc --project tsconfig.json --emitDeclarationOnly --outDir "$TMP_DECL_OUT"
  # the declaration for entry should be at TMP_DECL_OUT/src/index.d.ts or similar
  # normalize: move the generated declaration to cdn path root as index.d.ts
  # try common locations
  if [ -f "$TMP_DECL_OUT/src/index.d.ts" ]; then
    mv "$TMP_DECL_OUT/src/index.d.ts" "$CDN_PATH/index.d.ts"
    echo "-> Declaration generated: $CDN_PATH/index.d.ts"
  else
    # fallback: move any .d.ts in TMP_DECL_OUT to CDN_PATH
    find "$TMP_DECL_OUT" -name "*.d.ts" -print -exec cp {} "$CDN_PATH/" \; || true
    echo "-> Declarations (if any) copied to $CDN_PATH/"
  fi
  rm -rf "$TMP_DECL_OUT"
else
  echo "-> npx not found: skipping declaration generation."
fi

# 4) Copy assets if exists
if [ -d "assets" ]; then
  cp -r assets "$CDN_PATH/"
fi

echo "✅ CDN Build selesai → $CDN_PATH/"
