import { config } from "../src/config.js";
import { getWalletBalance, getTotalMinted } from "../src/services/blockchain.js";

async function main() {
  try {
    const balance = await getWalletBalance();
    const total = await getTotalMinted();

    console.log("=".repeat(40));
    console.log("📊 PixelOracle Status");
    console.log("=".repeat(40));
    console.log(`Network: ${config.network}`);
    console.log(`Contract: ${config.contractAddress}`);
    console.log(`Wallet Balance: ${balance} ETH`);
    console.log(`Total Minted: ${total.toString()} NFTs`);
    console.log("=".repeat(40));
  } catch (error: any) {
    console.error("Error getting status:", error.message);
    process.exit(1);
  }
}

main();
