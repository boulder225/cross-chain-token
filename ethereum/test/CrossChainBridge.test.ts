import { ethers } from "hardhat";
import { expect } from "chai";
import { WeFiToken, CrossChainBridge } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CrossChainBridge", function () {
  let wefiToken: WeFiToken;
  let bridge: CrossChainBridge;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const LOCK_AMOUNT = ethers.parseEther("100");
  const COSMOS_ADDRESS = "cosmos1abc123def456ghi789jkl012mno345pqr678st";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy WEFI token
    const WeFiTokenFactory = await ethers.getContractFactory("WeFiToken");
    wefiToken = await WeFiTokenFactory.deploy(owner.address);
    await wefiToken.waitForDeployment();
    
    // Deploy bridge
    const CrossChainBridgeFactory = await ethers.getContractFactory("CrossChainBridge");
    bridge = await CrossChainBridgeFactory.deploy(
      await wefiToken.getAddress(),
      owner.address
    );
    await bridge.waitForDeployment();

    // Transfer tokens to users and approve bridge
    await wefiToken.transfer(user1.address, ethers.parseEther("1000"));
    await wefiToken.transfer(user2.address, ethers.parseEther("1000"));
    
    await wefiToken.connect(user1).approve(await bridge.getAddress(), ethers.parseEther("1000"));
    await wefiToken.connect(user2).approve(await bridge.getAddress(), ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set the correct WEFI token address", async function () {
      expect(await bridge.wefiToken()).to.equal(await wefiToken.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await bridge.owner()).to.equal(owner.address);
    });

    it("Should start unpaused", async function () {
      expect(await bridge.paused()).to.be.false;
    });
  });

  describe("Token Locking", function () {
    it("Should successfully lock tokens", async function () {
      const initialBalance = await wefiToken.balanceOf(user1.address);
      const initialBridgeBalance = await wefiToken.balanceOf(await bridge.getAddress());

      const tx = await bridge.connect(user1).lockTokens(LOCK_AMOUNT, COSMOS_ADDRESS);
      const receipt = await tx.wait();

      // Check balances
      expect(await wefiToken.balanceOf(user1.address)).to.equal(
        initialBalance - LOCK_AMOUNT
      );
      expect(await wefiToken.balanceOf(await bridge.getAddress())).to.equal(
        initialBridgeBalance + LOCK_AMOUNT
      );

      // Check locked balance tracking
      expect(await bridge.getLockedBalance(user1.address)).to.equal(LOCK_AMOUNT);
      expect(await bridge.getTotalLocked()).to.equal(LOCK_AMOUNT);

      // Check event emission
      const events = receipt?.logs.filter(log => {
        try {
          return bridge.interface.parseLog(log)?.name === 'TokensLocked';
        } catch {
          return false;
        }
      });
      
      expect(events).to.have.length(1);
    });

    it("Should emit TokensLocked event with correct parameters", async function () {
      await expect(
        bridge.connect(user1).lockTokens(LOCK_AMOUNT, COSMOS_ADDRESS)
      )
        .to.emit(bridge, "TokensLocked")
        .withArgs(user1.address, COSMOS_ADDRESS, LOCK_AMOUNT, 1);
    });

    it("Should increment lock ID for each lock", async function () {
      await bridge.connect(user1).lockTokens(LOCK_AMOUNT, COSMOS_ADDRESS);
      expect(await bridge.getCurrentLockId()).to.equal(1);

      await bridge.connect(user2).lockTokens(LOCK_AMOUNT, COSMOS_ADDRESS);
      expect(await bridge.getCurrentLockId()).to.equal(2);
    });

    it("Should reject lock with amount too small", async function () {
      const tooSmallAmount = ethers.parseEther("0.0001"); // Less than MIN_LOCK_AMOUNT
      
      await expect(
        bridge.connect(user1).lockTokens(tooSmallAmount, COSMOS_ADDRESS)
      ).to.be.revertedWith("CrossChainBridge: amount too small");
    });

    it("Should reject lock with amount too large", async function () {
      const tooLargeAmount = ethers.parseEther("2000000"); // More than MAX_LOCK_AMOUNT
      
      await expect(
        bridge.connect(user1).lockTokens(tooLargeAmount, COSMOS_ADDRESS)
      ).to.be.revertedWith("CrossChainBridge: amount too large");
    });

    it("Should reject lock with empty cosmos address", async function () {
      await expect(
        bridge.connect(user1).lockTokens(LOCK_AMOUNT, "")
      ).to.be.revertedWith("CrossChainBridge: invalid cosmos address");
    });

    it("Should reject lock with invalid cosmos address format", async function () {
      await expect(
        bridge.connect(user1).lockTokens(LOCK_AMOUNT, "invalid_address")
      ).to.be.revertedWith("CrossChainBridge: invalid cosmos address format");
    });

    it("Should reject lock when paused", async function () {
      await bridge.pause();
      
      await expect(
        bridge.connect(user1).lockTokens(LOCK_AMOUNT, COSMOS_ADDRESS)
      ).to.be.revertedWithCustomError(bridge, "EnforcedPause");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to pause", async function () {
      await bridge.pause();
      expect(await bridge.paused()).to.be.true;
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(
        bridge.connect(user1).pause()
      ).to.be.revertedWithCustomError(bridge, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to unpause", async function () {
      await bridge.pause();
      await bridge.unpause();
      expect(await bridge.paused()).to.be.false;
    });

    it("Should allow owner to emergency withdraw", async function () {
      // Lock some tokens first
      await bridge.connect(user1).lockTokens(LOCK_AMOUNT, COSMOS_ADDRESS);
      
      const initialOwnerBalance = await wefiToken.balanceOf(owner.address);
      await bridge.emergencyWithdraw(LOCK_AMOUNT);
      
      expect(await wefiToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance + LOCK_AMOUNT
      );
    });

    it("Should not allow non-owner to emergency withdraw", async function () {
      await expect(
        bridge.connect(user1).emergencyWithdraw(LOCK_AMOUNT)
      ).to.be.revertedWithCustomError(bridge, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await bridge.connect(user1).lockTokens(LOCK_AMOUNT, COSMOS_ADDRESS);
      await bridge.connect(user2).lockTokens(LOCK_AMOUNT, COSMOS_ADDRESS);
    });

    it("Should correctly track individual locked balances", async function () {
      expect(await bridge.getLockedBalance(user1.address)).to.equal(LOCK_AMOUNT);
      expect(await bridge.getLockedBalance(user2.address)).to.equal(LOCK_AMOUNT);
    });

    it("Should correctly track total locked amount", async function () {
      expect(await bridge.getTotalLocked()).to.equal(LOCK_AMOUNT * 2n);
    });
  });
});
