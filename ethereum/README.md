# Ethereum Smart Contracts

This directory contains the Ethereum smart contracts for the WeFi cross-chain bridge PoC.

## Contracts

### WeFiToken.sol
Mock ERC20 token representing WEFI with the following features:
- **Standard ERC20** with permit functionality
- **Minting capability** for owner (up to max supply)
- **Burning functionality** for users
- **Initial supply**: 1B tokens
- **Max supply**: 10B tokens

### CrossChainBridge.sol
Bridge contract for locking WEFI tokens with these features:
- **Token locking** with event emission for cross-chain transfers
- **Security features**: ReentrancyGuard, Pausable, access control
- **Validation**: Amount limits, Cosmos address format checking
- **Emergency functions**: Pause/unpause, emergency withdrawal
- **Tracking**: Individual and total locked balances

## Key Events

```solidity
event TokensLocked(
    address indexed sender,
    string cosmosAddress,
    uint256 amount,
    uint256 indexed lockId
);
```

## Usage

### Deploy Contracts
```bash
npm run deploy
```

### Run Tests
```bash
npm test
```

### Lock Tokens (Demo)
```bash
npm run lock-tokens
```

### Query Contract State
```bash
npx hardhat run scripts/query-state.ts --network localhost
```

## Configuration

### Environment Variables
```
WEFI_TOKEN_ADDRESS=0x...
BRIDGE_CONTRACT_ADDRESS=0x...
DEMO_USER_PRIVATE_KEY=0x...
```

### Network Configuration
- **Local**: Hardhat network (chainId: 31337)
- **Testnet**: Goerli (configured but requires API key)

## Security Features

### Access Control
- **Owner-only functions**: Pause, emergency withdrawal, token minting
- **Reentrancy protection** on all state-changing functions
- **Pausable** emergency stop mechanism

### Validation
- **Amount limits**: 0.001 WEFI minimum, 1M WEFI maximum per transaction
- **Address validation**: Basic Cosmos address format checking
- **Allowance checks**: Standard ERC20 approval mechanism

### Emergency Features
- **Pause/Unpause**: Owner can halt bridge operations
- **Emergency withdrawal**: Owner can recover locked tokens
- **Event logging**: All operations emit events for monitoring

## Testing

Comprehensive test coverage includes:
- **Unit tests** for both contracts
- **Integration tests** for cross-contract interactions
- **Edge cases** and error conditions
- **Access control** verification
- **Event emission** validation

## Architecture Notes

This is a **simplified PoC version**. Production implementation would include:
- Multi-signature wallet integration
- Time locks for emergency functions
- Oracle price feeds for fee calculation
- Merkle proof verification for unlocks
- Challenge periods for security
- Integration with actual LayerZero endpoints
