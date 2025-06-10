// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CrossChainBridge
 * @dev Bridge contract for locking WEFI tokens and emitting cross-chain events
 * @notice This is a simplified version for PoC - production version would include more security features
 */
contract CrossChainBridge is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable wefiToken;
    
    // Track locked amounts for each user
    mapping(address => uint256) public lockedBalances;
    
    // Track total locked amount
    uint256 public totalLocked;
    
    // Minimum lock amount (prevent dust attacks)
    uint256 public constant MIN_LOCK_AMOUNT = 1e15; // 0.001 WEFI
    
    // Maximum lock amount per transaction (for PoC safety)
    uint256 public constant MAX_LOCK_AMOUNT = 1000000e18; // 1M WEFI

    /**
     * @dev Emitted when tokens are locked for cross-chain transfer
     * @param sender Address that locked the tokens
     * @param cosmosAddress Destination address on Cosmos chain
     * @param amount Amount of tokens locked
     * @param lockId Unique identifier for this lock operation
     */
    event TokensLocked(
        address indexed sender,
        string cosmosAddress,
        uint256 amount,
        uint256 indexed lockId
    );

    /**
     * @dev Emitted when tokens are unlocked (for future unlock functionality)
     * @param recipient Address that received the unlocked tokens
     * @param amount Amount of tokens unlocked
     * @param unlockId Unique identifier for this unlock operation
     */
    event TokensUnlocked(
        address indexed recipient,
        uint256 amount,
        uint256 indexed unlockId
    );

    // Counter for unique lock IDs
    uint256 private _lockIdCounter;

    constructor(address _wefiToken, address _owner) Ownable(_owner) {
        require(_wefiToken != address(0), "CrossChainBridge: invalid token address");
        wefiToken = IERC20(_wefiToken);
    }

    /**
     * @dev Lock WEFI tokens for cross-chain transfer
     * @param amount Amount of tokens to lock
     * @param cosmosAddress Destination address on Cosmos chain
     * @return lockId Unique identifier for this lock operation
     */
    function lockTokens(
        uint256 amount,
        string calldata cosmosAddress
    ) external nonReentrant whenNotPaused returns (uint256 lockId) {
        require(amount >= MIN_LOCK_AMOUNT, "CrossChainBridge: amount too small");
        require(amount <= MAX_LOCK_AMOUNT, "CrossChainBridge: amount too large");
        require(bytes(cosmosAddress).length > 0, "CrossChainBridge: invalid cosmos address");
        
        // Validate cosmos address format (basic check)
        require(_isValidCosmosAddress(cosmosAddress), "CrossChainBridge: invalid cosmos address format");

        // Transfer tokens from user to bridge
        wefiToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update balances
        lockedBalances[msg.sender] += amount;
        totalLocked += amount;

        // Generate unique lock ID
        lockId = ++_lockIdCounter;

        // Emit event for relayer to pick up
        emit TokensLocked(msg.sender, cosmosAddress, amount, lockId);

        return lockId;
    }

    /**
     * @dev Get locked balance for a user
     * @param user Address to check
     * @return amount Amount of tokens locked by user
     */
    function getLockedBalance(address user) external view returns (uint256) {
        return lockedBalances[user];
    }

    /**
     * @dev Get total locked amount in bridge
     * @return amount Total amount of tokens locked
     */
    function getTotalLocked() external view returns (uint256) {
        return totalLocked;
    }

    /**
     * @dev Get current lock ID counter
     * @return currentId Current lock ID counter value
     */
    function getCurrentLockId() external view returns (uint256) {
        return _lockIdCounter;
    }

    /**
     * @dev Basic validation for Cosmos address format
     * @param cosmosAddress Address to validate
     * @return isValid True if address format is valid
     */
    function _isValidCosmosAddress(string calldata cosmosAddress) internal pure returns (bool) {
        bytes memory addr = bytes(cosmosAddress);
        
        // Basic length check (cosmos addresses are typically 39-59 characters)
        if (addr.length < 39 || addr.length > 59) {
            return false;
        }
        
        // Check if starts with "cosmos"
        if (addr.length >= 6) {
            return (
                addr[0] == 'c' &&
                addr[1] == 'o' &&
                addr[2] == 's' &&
                addr[3] == 'm' &&
                addr[4] == 'o' &&
                addr[5] == 's'
            );
        }
        
        return false;
    }

    /**
     * @dev Emergency function to pause the bridge
     * @notice Only owner can pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Emergency function to unpause the bridge
     * @notice Only owner can unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal function (only for owner)
     * @param amount Amount to withdraw
     * @notice This is for emergency situations only
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= wefiToken.balanceOf(address(this)), "CrossChainBridge: insufficient balance");
        wefiToken.safeTransfer(owner(), amount);
    }
}
