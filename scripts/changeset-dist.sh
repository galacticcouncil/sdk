#!/bin/bash

set -e

# Create top-level dist-npm directory
mkdir -p dist-npm

# Loop through each package
for pkg in packages/*; do
  pkg_name=$(basename "$pkg")
  src="$pkg/build"
  dest="dist-npm/$pkg_name"

  echo "Preparing $pkg_name for publish"

  # Only copy if build folder exists
  if [ -d "$src" ]; then
    mkdir -p "$dest"
    cp -r "$src"/* "$dest/"
    cp "$pkg"/package.json "$dest/"
  else
    echo "⚠️  Skipping $pkg_name — no build directory found."
  fi
done