import { ethers } from "hardhat";
import { WeFiToken, CrossChainBridge } from "../typechain-types";

async function main() {
  console.log("🚀 Deploying WeFi Cross-Chain Bridge contracts...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy WEFI Token
  console.log("📄 Deploying WeFiToken...");
  const WeFiTokenFactory = await ethers.getContractFactory("WeFiToken");
  const wefiToken = await WeFiTokenFactory.deploy(deployer.address);
  await wefiToken.waitForDeployment();
  
  const wefiTokenAddress = await wefiToken.getAddress();
  console.log("✅ WeFiToken deployed to:", wefiTokenAddress);
  console.log("📊 Initial supply:", ethers.formatEther(await wefiToken.totalSupply()), "WEFI\n");

  // Deploy CrossChain Bridge
  console.log("🌉 Deploying CrossChainBridge...");
  const CrossChainBridgeFactory = await ethers.getContractFactory("CrossChainBridge");
  const bridge = await CrossChainBridgeFactory.deploy(wefiTokenAddress, deployer.address);
  await bridge.waitForDeployment();
  
  const bridgeAddress = await bridge.getAddress();
  console.log("✅ CrossChainBridge deployed to:", bridgeAddress);
  console.log("🔗 Bridge token address:", await bridge.wefiToken());
  console.log("👤 Bridge owner:", await bridge.owner(), "\n");

  // Setup for demo (transfer some tokens to a demo user for testing)
  const demoUserPrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // Hardhat account #1
  const demoUser = new ethers.Wallet(demoUserPrivateKey, deployer.provider);
  const transferAmount = ethers.parseEther("10000"); // 10,000 WEFI for testing

  console.log("🎭 Setting up demo user:", demoUser.address);
  await wefiToken.transfer(demoUser.address, transferAmount);
  console.log("💸 Transferred", ethers.formatEther(transferAmount), "WEFI to demo user");
  
  // Verify demo user balance
  const demoBalance = await wefiToken.balanceOf(demoUser.address);
  console.log("💰 Demo user balance:", ethers.formatEther(demoBalance), "WEFI\n");

  // Save deployment addresses to file
  const deploymentInfo = {
    network: await deployer.provider.getNetwork(),
    deployer: deployer.address,
    contracts: {
      WeFiToken: {
        address: wefiTokenAddress,
        name: "WeFi Token",
        symbol: "WEFI",
        totalSupply: ethers.formatEther(await wefiToken.totalSupply())
      },
      CrossChainBridge: {
        address: bridgeAddress,
        owner: await bridge.owner(),
        wefiToken: await bridge.wefiToken()
      }
    },
    demo: {
      userAddress: demoUser.address,
      userBalance: ethers.formatEther(demoBalance)
    },
    timestamp: new Date().toISOString()
  };

  console.log("📋 Deployment Summary:");
  console.log("=".repeat(50));
  console.log("🏦 WEFI Token:", wefiTokenAddress);
  console.log("🌉 Bridge Contract:", bridgeAddress);
  console.log("🎭 Demo User:", demoUser.address);
  console.log("=".repeat(50));

  // Environment variables for .env file
  console.log("\n📝 Add these to your .env file:");
  console.log(`WEFI_TOKEN_ADDRESS=${wefiTokenAddress}`);
  console.log(`BRIDGE_CONTRACT_ADDRESS=${bridgeAddress}`);
  console.log(`DEMO_USER_ADDRESS=${demoUser.address}`);
  console.log(`DEMO_USER_PRIVATE_KEY=${demoUserPrivateKey}`);

  return deploymentInfo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
