#!/bin/bash
set -euo pipefail
if ! command -v emcc >/dev/null 2>&1; then
  echo "emcc not found. Install emsdk."
  exit 1
fi

OUT="cdn/v1"
mkdir -p "$OUT"
emcc src/wasm/dsrt.cpp -O3 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_FUNCTIONS='["_dsrt_add","_dsrt_dot3","_dsrt_length3","_dsrt_cross","_dsrt_normalize","_dsrt_mat4_mul","_dsrt_mat4_identity","_dsrt_mat4_transpose"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap","getValue","setValue","malloc","free","HEAPF64"]' \
  -o "$OUT/dsrt.js"

echo "WASM built -> $OUT/dsrt.wasm & $OUT/dsrt.js"
