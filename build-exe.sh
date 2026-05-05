#!/usr/bin/env bash
set -e

echo "========================================"
echo "  NeoSSH - Build Windows .exe"
echo "========================================"
echo ""

# --- Check Node.js ---
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed."
    echo ""
    echo "Install it with:"
    echo "  Debian/Ubuntu:  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - && sudo apt install -y nodejs"
    echo "  Arch:           sudo pacman -S nodejs npm"
    echo "  Fedora:         sudo dnf install nodejs"
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

# --- Build .exe ---
echo ""
echo "Building Windows .exe installer..."
npx electron-builder --win 2>&1 | tail -20

echo ""
echo "========================================"
echo "  Build complete!"
echo "========================================"
echo ""
echo "Package: dist/NeoSSH*.exe"
echo ""
echo "Transfer to Windows and install."
echo ""
