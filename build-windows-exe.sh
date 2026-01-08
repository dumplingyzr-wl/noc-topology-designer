#!/bin/bash

# NoC Topology Designer - Windows EXE Build Script
# This script builds the Windows EXE executable

set -e

echo "🔨 Building NoC Topology Designer for Windows..."
echo ""

# Step 1: Build frontend
echo "📦 Step 1: Building frontend application..."
pnpm run build

# Step 2: Compile Electron main process
echo "📦 Step 2: Compiling Electron main process..."
mkdir -p dist-electron
npx esbuild electron/main.ts --bundle --platform=node --target=node20 --outfile=dist-electron/main.js --external:electron

# Step 3: Build Windows EXE
echo "📦 Step 3: Building Windows EXE with electron-builder..."
npx electron-builder --win --publish never

echo ""
echo "✅ Build complete!"
echo ""
echo "📍 Output location:"
echo "   - Portable EXE: dist/win-unpacked/NoC Topology Designer.exe"
echo "   - Size: ~202MB"
echo ""
echo "💡 To run the EXE on Windows:"
echo "   1. Copy the entire dist/win-unpacked directory to your Windows machine"
echo "   2. Double-click 'NoC Topology Designer.exe' to run"
echo ""
