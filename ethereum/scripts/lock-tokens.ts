import { ethers } from "hardhat";
import { WeFiToken, CrossChainBridge } from "../typechain-types";

async function main() {
  console.log("🔐 WeFi Bridge - Lock Tokens Demo\n");

  // Configuration
  const WEFI_TOKEN_ADDRESS = process.env.WEFI_TOKEN_ADDRESS;
  const BRIDGE_CONTRACT_ADDRESS = process.env.BRIDGE_CONTRACT_ADDRESS;
  const DEMO_USER_PRIVATE_KEY = process.env.DEMO_USER_PRIVATE_KEY || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
  
  if (!WEFI_TOKEN_ADDRESS || !BRIDGE_CONTRACT_ADDRESS) {
    console.error("❌ Please set WEFI_TOKEN_ADDRESS and BRIDGE_CONTRACT_ADDRESS in .env");
    console.log("💡 Run: npm run deploy first");
    process.exit(1);
  }

  // Setup
  const provider = ethers.provider;
  const demoUser = new ethers.Wallet(DEMO_USER_PRIVATE_KEY, provider);
  
  console.log("👤 Demo User:", demoUser.address);
  console.log("🏦 WEFI Token:", WEFI_TOKEN_ADDRESS);
  console.log("🌉 Bridge Contract:", BRIDGE_CONTRACT_ADDRESS, "\n");

  // Connect to contracts
  const wefiToken = await ethers.getContractAt("WeFiToken", WEFI_TOKEN_ADDRESS, demoUser) as WeFiToken;
  const bridge = await ethers.getContractAt("CrossChainBridge", BRIDGE_CONTRACT_ADDRESS, demoUser) as CrossChainBridge;

  // Demo parameters
  const LOCK_AMOUNT = ethers.parseEther("100"); // 100 WEFI
  const COSMOS_ADDRESS = "cosmos1abc123def456ghi789jkl012mno345pqr678st";

  try {
    // Step 1: Check initial balances
    console.log("📊 Initial State:");
    const initialUserBalance = await wefiToken.balanceOf(demoUser.address);
    const initialBridgeBalance = await wefiToken.balanceOf(BRIDGE_CONTRACT_ADDRESS);
    const initialLocked = await bridge.getLockedBalance(demoUser.address);
    
    console.log("  👤 User WEFI balance:", ethers.formatEther(initialUserBalance));
    console.log("  🌉 Bridge WEFI balance:", ethers.formatEther(initialBridgeBalance));
    console.log("  🔒 User locked amount:", ethers.formatEther(initialLocked), "\n");

    // Step 2: Check allowance and approve if needed
    console.log("🔍 Checking token allowance...");
    const currentAllowance = await wefiToken.allowance(demoUser.address, BRIDGE_CONTRACT_ADDRESS);
    console.log("  📋 Current allowance:", ethers.formatEther(currentAllowance));

    if (currentAllowance < LOCK_AMOUNT) {
      console.log("  📝 Approving bridge to spend tokens...");
      const approveTx = await wefiToken.approve(BRIDGE_CONTRACT_ADDRESS, LOCK_AMOUNT);
      await approveTx.wait();
      console.log("  ✅ Approval confirmed");
    } else {
      console.log("  ✅ Sufficient allowance already exists");
    }

    // Step 3: Lock tokens
    console.log("\n🔐 Locking tokens for cross-chain transfer...");
    console.log("  💰 Amount:", ethers.formatEther(LOCK_AMOUNT), "WEFI");
    console.log("  🎯 Destination:", COSMOS_ADDRESS);

    const lockTx = await bridge.lockTokens(LOCK_AMOUNT, COSMOS_ADDRESS);
    console.log("  📡 Transaction sent:", lockTx.hash);
    
    const receipt = await lockTx.wait();
    console.log("  ✅ Transaction confirmed in block:", receipt?.blockNumber);

    // Step 4: Parse events
    const lockEvents = receipt?.logs
      .map(log => {
        try {
          return bridge.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(log => log?.name === 'TokensLocked');

    if (lockEvents && lockEvents.length > 0) {
      const event = lockEvents[0];
      console.log("  🎉 TokensLocked event emitted:");
      console.log("    👤 Sender:", event?.args[0]);
      console.log("    🎯 Cosmos Address:", event?.args[1]);
      console.log("    💰 Amount:", ethers.formatEther(event?.args[2]), "WEFI");
      console.log("    🆔 Lock ID:", event?.args[3].toString());
    }

    // Step 5: Check final balances
    console.log("\n📊 Final State:");
    const finalUserBalance = await wefiToken.balanceOf(demoUser.address);
    const finalBridgeBalance = await wefiToken.balanceOf(BRIDGE_CONTRACT_ADDRESS);
    const finalLocked = await bridge.getLockedBalance(demoUser.address);
    const totalLocked = await bridge.getTotalLocked();
    
    console.log("  👤 User WEFI balance:", ethers.formatEther(finalUserBalance));
    console.log("  🌉 Bridge WEFI balance:", ethers.formatEther(finalBridgeBalance));
    console.log("  🔒 User locked amount:", ethers.formatEther(finalLocked));
    console.log("  🔒 Total locked amount:", ethers.formatEther(totalLocked));

    // Step 6: Show changes
    console.log("\n📈 Changes:");
    console.log("  👤 User balance change:", ethers.formatEther(finalUserBalance - initialUserBalance), "WEFI");
    console.log("  🌉 Bridge balance change:", ethers.formatEther(finalBridgeBalance - initialBridgeBalance), "WEFI");
    console.log("  🔒 Locked amount change:", ethers.formatEther(finalLocked - initialLocked), "WEFI");

    console.log("\n🎯 Next Steps:");
    console.log("  1. 📡 Relayer will detect the TokensLocked event");
    console.log("  2. 🌌 Relayer will trigger mint on Cosmos chain");
    console.log("  3. ✨ User will receive wrapped WEFI on Cosmos");

  } catch (error: any) {
    console.error("❌ Lock tokens failed:", error.message);
    
    // Common error explanations
    if (error.message.includes("insufficient allowance")) {
      console.log("💡 Solution: Increase token allowance for the bridge contract");
    } else if (error.message.includes("amount too small")) {
      console.log("💡 Solution: Use a larger amount (minimum 0.001 WEFI)");
    } else if (error.message.includes("amount too large")) {
      console.log("💡 Solution: Use a smaller amount (maximum 1M WEFI)");
    } else if (error.message.includes("invalid cosmos address")) {
      console.log("💡 Solution: Use a valid cosmos address format");
    }
    
    process.exit(1);
  }
}

// Execute the demo
main()
  .then(() => {
    console.log("\n✅ Lock tokens demo completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  });
