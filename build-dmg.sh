#!/usr/bin/env bash
set -e

echo "========================================"
echo "  NeoSSH - Build macOS .dmg"
echo "========================================"
echo ""

# --- Check macOS ---
if [ "$(uname)" != "Darwin" ]; then
    echo "ERROR: This script must be run on macOS."
    echo ""
    echo "To build for macOS from Linux, use:"
    echo "  npm run build:mac   (requires wine and cross-compilation setup)"
    echo "Or build on a Mac directly."
    exit 1
fi

# --- Check Node.js ---
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed."
    echo ""
    echo "Install it with:"
    echo "  brew install node"
    echo "Or download from https://nodejs.org"
    exit 1
fi

NODE_VER=$(node -e "console.log(parseInt(process.versions.node.split('.')[0]))")
if [ "$NODE_VER" -lt 18 ]; then
    echo "ERROR: Node.js >= 18 is required (found $(node -v))"
    exit 1
fi
echo "✓ Node.js $(node -v)"

# --- Check npm ---
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed."
    exit 1
fi
echo "✓ npm $(npm -v)"

# --- Install deps ---
echo ""
echo "Installing dependencies..."
npm install --no-audit --no-fund 2>&1 | tail -5

# --- Build frontend ---
echo ""
echo "Building frontend..."
npx vite build 2>&1 | tail -5

# --- Build .dmg ---
echo ""
echo "Building macOS .dmg..."
npx electron-builder --mac 2>&1 | tail -20

echo ""
echo "========================================"
echo "  Build complete!"
echo "========================================"
echo ""
echo "Package: dist/NeoSSH*.dmg"
echo ""
echo "Install:"
echo "  Open dist/NeoSSH*.dmg and drag to Applications"
echo ""
