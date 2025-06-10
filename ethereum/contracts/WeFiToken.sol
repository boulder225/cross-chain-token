// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WeFiToken
 * @dev Mock WEFI token for cross-chain bridge demonstration
 * @notice This is a simplified version for PoC purposes
 */
contract WeFiToken is ERC20, ERC20Permit, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1B tokens
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18; // 10B tokens max

    /**
     * @dev Constructor that gives msg.sender all of existing tokens
     */
    constructor(
        address initialOwner
    ) ERC20("WeFi Token", "WEFI") ERC20Permit("WeFi Token") Ownable(initialOwner) {
        _mint(initialOwner, INITIAL_SUPPLY);
    }

    /**
     * @dev Mint additional tokens (for testing purposes)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "WeFiToken: exceeds max supply");
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from caller's balance
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @dev Burn tokens from specified account (with allowance)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) external {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }
}
