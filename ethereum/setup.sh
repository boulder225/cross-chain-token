#!/bin/bash

# Fix for Node.js v23 compatibility with Hardhat
echo "🔧 Setting up Ethereum contracts..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 23 ]; then
    echo "⚠️  Node.js v$NODE_VERSION detected. Using legacy OpenSSL provider for compatibility..."
    export NODE_OPTIONS="--openssl-legacy-provider"
fi

# Clean and install dependencies
echo "🧹 Cleaning previous builds..."
rm -rf node_modules cache artifacts typechain-types

echo "📦 Installing dependencies..."
npm install

echo "🔨 Compiling contracts..."
npm run compile

echo "✅ Setup complete! You can now run:"
echo "   npm run node     # Start local network"
echo "   npm run deploy   # Deploy contracts"
echo "   npm test         # Run tests"
