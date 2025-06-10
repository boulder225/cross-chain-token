# Cross-Chain Interoperability PoC

## Overview
This project demonstrates core mechanics of an omnichain architecture using a simplified LayerZero-like approach for cross-chain token transfers.

## Architecture
```
┌─────────────┐    Lock Event    ┌──────────────┐    Mint Command    ┌─────────────┐
│   Ethereum  │ ────────────────▶│ Mock Relayer │ ──────────────────▶│   Cosmos    │
│ Lock Contract│                 │   Service    │                   │ Mint Module │
└─────────────┘                 └──────────────┘                   └─────────────┘
```

## Project Structure
```
cross-chain-poc/
├── ethereum/          # Hardhat project with smart contracts
│   ├── contracts/     # Solidity contracts
│   ├── scripts/       # Deployment scripts
│   └── test/          # Contract tests
├── cosmos/            # CosmJS integration
│   ├── src/           # Cosmos SDK interactions
│   └── types/         # TypeScript definitions
├── relayer/           # Bridge service
│   ├── src/           # Event listener and bridge logic
│   └── config/        # Configuration files
└── scripts/           # Integration and demo scripts
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Deploy Contracts
```bash
npm run deploy
```

### 4. Start Relayer
```bash
npm run start:relayer
```

### 5. Run Demo
```bash
npm run demo
```

## Components

### Ethereum Lock Contract
- Locks tokens securely
- Emits cross-chain events
- Handles ERC20 token custody

### Cosmos Mint Module  
- Mints wrapped tokens
- Manages cross-chain state
- Simulates LayerZero message handling

### Mock Relayer
- Listens for Ethereum events
- Validates cross-chain messages
- Triggers Cosmos minting

## Testing
```bash
# Run all tests
npm test

# Test individual components
npm run test:ethereum
npm run test:integration
```

## Development

### Prerequisites
- Node.js 18+
- TypeScript 5+
- Hardhat
- Local Ethereum node (optional)

### Environment Variables
```
ETHEREUM_RPC_URL=http://localhost:8545
COSMOS_RPC_URL=http://localhost:26657
PRIVATE_KEY=your_private_key
TOKEN_ADDRESS=deployed_token_address
BRIDGE_CONTRACT_ADDRESS=deployed_bridge_address
```

## Next Steps
- [ ] Add unlock/burn functionality
- [ ] Implement signature verification
- [ ] Add challenge periods for security
- [ ] Integrate actual LayerZero endpoints
- [ ] Add comprehensive error handling
- [ ] Deploy to testnets

## License
MIT
