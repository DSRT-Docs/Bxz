 #!/bin/bash
set -euo pipefail

# Read current version or default v1
VER_FILE=".cdn_version"
if [ -f "$VER_FILE" ]; then
  CUR=$(cat "$VER_FILE")
else
  CUR="v1"
fi

# allow override via env
if [ -n "${CDN_VERSION-}" ]; then
  CUR="$CDN_VERSION"
fi

CDN_PATH="cdn/$CUR"

echo "==== Building DSRT CDN ($CUR) ===="
rm -rf "$CDN_PATH"
mkdir -p "$CDN_PATH"

echo "-> Bundling JS (esbuild)..."
npx esbuild src/index.js --bundle --format=iife --global-name=DSRT --minify --outfile="$CDN_PATH/index.js"

# Copy TypeScript d.ts (if you placed it)
if [ -f "types/index.d.ts" ]; then
  cp types/index.d.ts "$CDN_PATH/index.d.ts"
fi

# WASM build
if command -v emcc >/dev/null 2>&1; then
  echo "-> Building WASM (emcc)..."
  emcc src/wasm/dsrt.cpp -O3 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 \
    -s EXPORTED_FUNCTIONS='["_dsrt_add","_dsrt_dot3","_dsrt_length3","_dsrt_cross","_dsrt_normalize","_dsrt_mat4_mul","_dsrt_mat4_identity","_dsrt_mat4_transpose"]' \
    -s EXPORTED_RUNTIME_METHODS='["cwrap","getValue","setValue","malloc","free","HEAPF64"]' \
    -o "$CDN_PATH/dsrt.js"
  # emcc creates dsrt.wasm automatically next to dsrt.js (in same dir)
else
  echo "-> emcc not found — skipping WASM build"
fi

# copy assets
if [ -d "assets" ]; then
  cp -r assets "$CDN_PATH/"
fi

echo "==== DONE: CDN build -> $CDN_PATH ===="
