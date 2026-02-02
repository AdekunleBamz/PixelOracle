import hre from "hardhat";

async function main() {
  console.log("🔮 Deploying PixelOracle NFT Contract...\n");

  const pixelOracle = await hre.viem.deployContract("PixelOracle");

  console.log("✅ PixelOracle deployed successfully!");
  console.log(`📍 Contract Address: ${pixelOracle.address}`);
  console.log(`🔗 Network: ${hre.network.name}`);
  
  if (hre.network.name === "base") {
    console.log(`🔎 View on BaseScan: https://basescan.org/address/${pixelOracle.address}`);
  } else if (hre.network.name === "baseSepolia") {
    console.log(`🔎 View on BaseScan: https://sepolia.basescan.org/address/${pixelOracle.address}`);
  }

  console.log("\n📝 Add this to your .env file:");
  console.log(`NFT_CONTRACT_ADDRESS=${pixelOracle.address}`);

  // Verify contract on BaseScan (optional)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    try {
      await hre.run("verify:verify", {
        address: pixelOracle.address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on BaseScan!");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("ℹ️ Contract already verified");
      } else {
        console.log("⚠️ Verification failed:", error.message);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
