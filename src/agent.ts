import { config } from "./config.js";
import {
  generateArtPrompt,
  generateImage,
  generateOracleMessage,
} from "./services/artGenerator.js";
import { createAndUploadNFTMetadata, ipfsToHttp } from "./services/ipfsUploader.js";
import {
  mintArtwork,
  getTotalMinted,
  getBaseScanUrl,
  getOpenSeaUrl,
  checkBalance,
} from "./services/blockchain.js";
import {
  postToAllPlatforms,
  formatSocialPost,
} from "./services/social.js";

// ============================================
// 🔮 PixelOracle - Autonomous Art Agent
// ============================================

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✨ PixelOracle - Autonomous AI Artist ✨                ║
║                                                           ║
║   Creating, minting, and sharing art on Base              ║
║   No human in the loop - pure autonomous creativity       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

// ============================================
// Main Creation Cycle
// ============================================

async function createArtworkCycle(): Promise<void> {
  console.log("\n🎨 Starting new artwork creation cycle...\n");
  console.log("=".repeat(50));

  try {
    // Step 0: Check balance
    const hasBalance = await checkBalance();
    if (!hasBalance) {
      console.log("⏸️ Pausing due to low balance");
      return;
    }

    // Step 1: Generate art concept
    console.log("\n📝 Step 1: Generating art concept...");
    const artConcept = await generateArtPrompt();
    console.log(`   Title: ${artConcept.title}`);
    console.log(`   Theme: ${artConcept.theme}`);
    console.log(`   Description: ${artConcept.description}`);

    // Step 2: Generate image
    console.log("\n🎨 Step 2: Creating artwork with AI...");
    const imageBuffer = await generateImage(artConcept.prompt);

    // Step 3: Get next token ID
    const currentTotal = await getTotalMinted();
    const tokenId = Number(currentTotal);
    console.log(`\n🔢 Next token ID: ${tokenId}`);

    // Step 4: Upload to IPFS
    console.log("\n📤 Step 3: Uploading to IPFS...");
    const { metadataUri, imageUri } = await createAndUploadNFTMetadata(
      imageBuffer,
      artConcept.title,
      artConcept.description,
      artConcept.theme,
      tokenId
    );

    // Step 5: Mint NFT
    console.log("\n⛓️ Step 4: Minting on Base...");
    const { tokenId: mintedId, txHash } = await mintArtwork(
      metadataUri,
      artConcept.prompt,
      artConcept.theme
    );

    // Step 6: Generate social post
    console.log("\n✍️ Step 5: Generating social post...");
    const oracleMessage = await generateOracleMessage(
      artConcept.theme,
      artConcept.title
    );
    
    const baseScanUrl = getBaseScanUrl(txHash);
    const openSeaUrl = getOpenSeaUrl(mintedId);
    const socialPost = formatSocialPost(oracleMessage, baseScanUrl, openSeaUrl);

    // Step 7: Post to social media
    console.log("\n📢 Step 6: Sharing with the world...");
    const socialResults = await postToAllPlatforms(
      socialPost,
      imageUri,
      imageBuffer
    );

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("✅ ARTWORK CREATION COMPLETE!");
    console.log("=".repeat(50));
    console.log(`   🎨 Title: ${artConcept.title}`);
    console.log(`   🔢 Token ID: ${mintedId}`);
    console.log(`   🔗 BaseScan: ${baseScanUrl}`);
    console.log(`   🖼️ OpenSea: ${openSeaUrl}`);
    console.log(`   📦 IPFS: ${ipfsToHttp(imageUri)}`);
    console.log(`   📣 Farcaster: ${socialResults.farcaster.success ? "✅" : "❌"}`);
    console.log(`   🐦 Twitter: ${socialResults.twitter.success ? "✅" : "❌"}`);
    console.log("=".repeat(50) + "\n");

  } catch (error: any) {
    console.error("\n❌ Error in creation cycle:", error.message);
    console.error(error.stack);
  }
}

// ============================================
// Autonomous Loop
// ============================================

async function runAutonomousLoop(): Promise<void> {
  const intervalMs = config.creationIntervalMinutes * 60 * 1000;

  console.log(`🔄 Autonomous mode: Creating art every ${config.creationIntervalMinutes} minutes`);
  console.log(`   Press Ctrl+C to stop\n`);

  // Run first cycle immediately
  await createArtworkCycle();

  // Schedule subsequent cycles
  setInterval(async () => {
    console.log(`\n⏰ Time for a new creation...`);
    await createArtworkCycle();
  }, intervalMs);
}

// ============================================
// Entry Point
// ============================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--once")) {
    // Single creation mode
    console.log("🎯 Running single creation cycle...\n");
    await createArtworkCycle();
    process.exit(0);
  } else {
    // Autonomous loop mode
    await runAutonomousLoop();
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 PixelOracle signing off... Until next time!");
  process.exit(0);
});

process.on("unhandledRejection", (error: any) => {
  console.error("Unhandled rejection:", error);
});

// Run!
main().catch(console.error);
