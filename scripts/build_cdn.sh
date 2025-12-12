#!/bin/bash

VERSION="v1"
CDN_PATH="cdn/$VERSION"

echo "🔧 Building DSRT CDN ($VERSION)..."

# Hapus folder lama (optional)
rm -rf $CDN_PATH

# Buat folder CDN
mkdir -p $CDN_PATH

# Bundle utama
npx esbuild src/index.js \
  --bundle \
  --format=iife \
  --global-name=DSRT \
  --minify \
  --outfile=$CDN_PATH/index.js

# Copy asset kalau ada
if [ -d "assets" ]; then
  cp -r assets $CDN_PATH/
fi

# Copy modul lain yang diperlukan (math, core, shaders, dll)
if [ -d "src/math" ]; then
  mkdir -p $CDN_PATH/math
  cp -r src/math/*.js $CDN_PATH/math/
fi

if [ -d "src/core" ]; then
  mkdir -p $CDN_PATH/core
  cp -r src/core/*.js $CDN_PATH/core/
fi

echo "✅ CDN Build selesai → $CDN_PATH/"
