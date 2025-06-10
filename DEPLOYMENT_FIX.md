# 🛠️ Quick Fix for Phase 2 Deployment Issues

## Issues Identified:
1. **Node.js v23.3.0 incompatibility** with Hardhat
2. **OpenZeppelin v5 import path changes**

## 🚀 Quick Solution:

### Step 1: Fix Node.js Compatibility
```bash
# Set Node.js compatibility flag
export NODE_OPTIONS="--openssl-legacy-provider"

# Or use a Node.js version manager to switch to Node 18/20
# nvm use 18  # if you have nvm installed
```

### Step 2: Clean Install Dependencies
```bash
cd /Users/enrico/workspace/myobsidian/cross-chain-token/ethereum

# Clean previous installations
rm -rf node_modules cache artifacts typechain-types

# Install dependencies
npm install
```

### Step 3: Compile Contracts
```bash
# This should now work with the updated import paths
npm run compile
```

### Step 4: Deploy
```bash
# Terminal 1: Start Hardhat node
npm run node

# Terminal 2: Deploy contracts
npm run deploy
```

## 📋 Alternative: Use Different Node Version

If you have `nvm` (Node Version Manager):
```bash
# Install and use Node 18
nvm install 18
nvm use 18

# Then proceed with normal installation
npm install
npm run node     # Terminal 1
npm run deploy   # Terminal 2
```

## ✅ Verification Commands

After successful deployment:
```bash
# 1. Run tests
npm test

# 2. Query contract state
npm run compile && npx hardhat run scripts/query-state.ts --network localhost

# 3. Run demo
npx hardhat run scripts/lock-tokens.ts --network localhost
```

## 🔧 Updated Files:
- ✅ Fixed OpenZeppelin import paths in `CrossChainBridge.sol`
- ✅ Updated `package.json` with correct dependencies
- ✅ Added Node.js engine constraints
- ✅ Updated Hardhat config for better compatibility

## 🚨 If Still Having Issues:

### Option 1: Use Docker
```bash
# Create a Dockerfile with Node 18
docker run -it --rm -v $(pwd):/app -w /app node:18 bash
npm install && npm run deploy
```

### Option 2: Use Yarn Instead
```bash
# Sometimes yarn handles dependencies better
yarn install
yarn run deploy
```

### Option 3: Manual Contract Verification
```bash
# Check if contracts compile correctly
npx hardhat compile --show-stack-traces
```

Run these commands in sequence and let me know which step fails (if any).
