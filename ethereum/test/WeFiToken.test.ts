import { ethers } from "hardhat";
import { expect } from "chai";
import { WeFiToken, CrossChainBridge } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("WeFiToken", function () {
  let wefiToken: WeFiToken;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const WeFiTokenFactory = await ethers.getContractFactory("WeFiToken");
    wefiToken = await WeFiTokenFactory.deploy(owner.address);
    await wefiToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await wefiToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await wefiToken.balanceOf(owner.address);
      expect(await wefiToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have correct name and symbol", async function () {
      expect(await wefiToken.name()).to.equal("WeFi Token");
      expect(await wefiToken.symbol()).to.equal("WEFI");
    });

    it("Should have 18 decimals", async function () {
      expect(await wefiToken.decimals()).to.equal(18);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await wefiToken.mint(user1.address, mintAmount);
      
      expect(await wefiToken.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      await expect(
        wefiToken.connect(user1).mint(user1.address, mintAmount)
      ).to.be.revertedWithCustomError(wefiToken, "OwnableUnauthorizedAccount");
    });

    it("Should not allow minting beyond max supply", async function () {
      const maxSupply = await wefiToken.MAX_SUPPLY();
      const currentSupply = await wefiToken.totalSupply();
      const excessAmount = maxSupply - currentSupply + 1n;
      
      await expect(
        wefiToken.mint(user1.address, excessAmount)
      ).to.be.revertedWith("WeFiToken: exceeds max supply");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      const transferAmount = ethers.parseEther("1000");
      await wefiToken.transfer(user1.address, transferAmount);
    });

    it("Should allow users to burn their tokens", async function () {
      const burnAmount = ethers.parseEther("100");
      const initialBalance = await wefiToken.balanceOf(user1.address);
      
      await wefiToken.connect(user1).burn(burnAmount);
      
      expect(await wefiToken.balanceOf(user1.address)).to.equal(
        initialBalance - burnAmount
      );
    });

    it("Should allow burning from another account with allowance", async function () {
      const burnAmount = ethers.parseEther("100");
      
      // User1 approves user2 to burn tokens
      await wefiToken.connect(user1).approve(user2.address, burnAmount);
      
      const initialBalance = await wefiToken.balanceOf(user1.address);
      await wefiToken.connect(user2).burnFrom(user1.address, burnAmount);
      
      expect(await wefiToken.balanceOf(user1.address)).to.equal(
        initialBalance - burnAmount
      );
    });
  });
});
