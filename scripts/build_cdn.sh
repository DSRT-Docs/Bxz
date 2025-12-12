#!/bin/bash
VERSION="v1"
CDN_PATH="cdn/$VERSION"
echo "Building DSRT CDN ($VERSION)..."
rm -rf $CDN_PATH
mkdir -p $CDN_PATH

# Build JS bundle (esbuild)
npx esbuild src/index.js \
  --bundle \
  --format=iife \
  --global-name=DSRT \
  --minify \
  --outfile=$CDN_PATH/index.js

# Build wasm using emcc (if emcc available)
if command -v emcc >/dev/null 2>&1; then
  echo "Building WASM with emcc..."
  emcc src/wasm/dsrt.cpp -O3 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 \
    -s EXPORTED_FUNCTIONS='["_dsrt_add","_dsrt_dot3","_dsrt_length3"]' \
    -s EXPORTED_RUNTIME_METHODS='["cwrap","getValue","setValue","malloc","free"]' \
    -o $CDN_PATH/dsrt.js
  # emcc creates dsrt.wasm automatically next to dsrt.js
  cp $CDN_PATH/dsrt.wasm $CDN_PATH/
fi

# Copy assets
if [ -d "assets" ]; then
  cp -r assets $CDN_PATH/
fi

echo "✅ CDN Build selesai → $CDN_PATH/"
