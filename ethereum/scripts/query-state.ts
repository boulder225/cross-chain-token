import { ethers } from "hardhat";

async function main() {
  console.log("🔍 WeFi Bridge - Query Contract State\n");

  // Configuration
  const WEFI_TOKEN_ADDRESS = process.env.WEFI_TOKEN_ADDRESS;
  const BRIDGE_CONTRACT_ADDRESS = process.env.BRIDGE_CONTRACT_ADDRESS;
  
  if (!WEFI_TOKEN_ADDRESS || !BRIDGE_CONTRACT_ADDRESS) {
    console.error("❌ Please set contract addresses in .env");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  
  // Connect to contracts
  const wefiToken = await ethers.getContractAt("WeFiToken", WEFI_TOKEN_ADDRESS);
  const bridge = await ethers.getContractAt("CrossChainBridge", BRIDGE_CONTRACT_ADDRESS);

  console.log("📋 Contract Information:");
  console.log("=".repeat(50));
  
  // WEFI Token Info
  console.log("🏦 WEFI Token:");
  console.log("  📍 Address:", await wefiToken.getAddress());
  console.log("  📛 Name:", await wefiToken.name());
  console.log("  🔤 Symbol:", await wefiToken.symbol());
  console.log("  🔢 Decimals:", await wefiToken.decimals());
  console.log("  📊 Total Supply:", ethers.formatEther(await wefiToken.totalSupply()), "WEFI");
  console.log("  👤 Owner:", await wefiToken.owner());

  // Bridge Info
  console.log("\n🌉 CrossChain Bridge:");
  console.log("  📍 Address:", await bridge.getAddress());
  console.log("  🏦 WEFI Token:", await bridge.wefiToken());
  console.log("  👤 Owner:", await bridge.owner());
  console.log("  ⏸️  Paused:", await bridge.paused());
  console.log("  🔒 Total Locked:", ethers.formatEther(await bridge.getTotalLocked()), "WEFI");
  console.log("  🆔 Current Lock ID:", (await bridge.getCurrentLockId()).toString());

  // Bridge Token Balance
  const bridgeBalance = await wefiToken.balanceOf(await bridge.getAddress());
  console.log("  💰 Bridge Token Balance:", ethers.formatEther(bridgeBalance), "WEFI");

  // Constants
  console.log("\n⚙️  Bridge Configuration:");
  console.log("  📏 Min Lock Amount:", "0.001 WEFI");
  console.log("  📏 Max Lock Amount:", "1,000,000 WEFI");

  // Recent events (last 100 blocks)
  console.log("\n📡 Recent Events:");
  try {
    const currentBlock = await ethers.provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 100);
    
    const lockEvents = await bridge.queryFilter(
      bridge.filters.TokensLocked(),
      fromBlock,
      currentBlock
    );

    if (lockEvents.length > 0) {
      console.log(`  🔐 Found ${lockEvents.length} lock event(s) in last 100 blocks:`);
      for (const event of lockEvents.slice(-5)) { // Show last 5 events
        console.log(`    Block ${event.blockNumber}: ${ethers.formatEther(event.args[2])} WEFI → ${event.args[1]}`);
      }
    } else {
      console.log("  📭 No lock events found in recent blocks");
    }
  } catch (error) {
    console.log("  ⚠️  Could not fetch recent events");
  }

  console.log("\n" + "=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Query failed:", error);
    process.exit(1);
  });
