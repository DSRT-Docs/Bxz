#!/bin/bash

echo "Building DSRT CDN..."

mkdir -p cdn/v1

npx esbuild src/index.js --bundle --minify --outfile=cdn/v1/dsrt.min.js

if [ -d "assets" ]; then
  cp -r assets cdn/
fi

echo "Build selesai."
