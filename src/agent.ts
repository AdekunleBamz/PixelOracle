import { config, account } from "./config.js";
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
  getWalletBalance,
  emitHeartbeat,
} from "./services/blockchain.js";
import {
  postToAllPlatforms,
  formatSocialPost,
} from "./services/social.js";
import {
  startMintListener,
  startMentionListener,
  stopListeners,
} from "./services/interactions.js";
import http from "http";

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
// Agent State (for /status endpoint)
// ============================================

interface AgentState {
  status: "idle" | "creating" | "minting" | "posting";
  lastCycleTime: Date;
  nextScheduledCycle: Date;
  totalMinted: number;
  lastMintTx: string | null;
  lastMintTokenId: number | null;
  lastHeartbeatTx: string | null;
  cycleCount: number;
  errors: Array<{ time: string; message: string }>;
  walletBalance: string;
  contractAddress: string;
  network: string;
}

const agentState: AgentState = {
  status: "idle",
  lastCycleTime: new Date(),
  nextScheduledCycle: new Date(Date.now() + config.creationIntervalMinutes * 60 * 1000),
  totalMinted: 0,
  lastMintTx: null,
  lastMintTokenId: null,
  lastHeartbeatTx: null,
  cycleCount: 0,
  errors: [],
  walletBalance: "0",
  contractAddress: config.contractAddress || "",
  network: config.network,
};

// ============================================
// Enhanced HTTP Server with /status endpoint
// ============================================

const PORT = process.env.PORT || 3000;

function startKeepAliveServer() {
  const server = http.createServer(async (req, res) => {
    // CORS headers for public access
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    if (req.url === "/health" || req.url === "/") {
      const now = new Date();
      const nextCycle = agentState.nextScheduledCycle;
      const timeUntilNext = Math.max(0, nextCycle.getTime() - now.getTime());
      const minutesUntilNext = Math.floor(timeUntilNext / 60000);
      const secondsUntilNext = Math.floor((timeUntilNext % 60000) / 1000);
      
      res.writeHead(200);
      res.end(JSON.stringify({
        agent: "🔮 PixelOracle",
        status: agentState.status,
        totalMinted: agentState.totalMinted,
        lastMintTime: agentState.lastCycleTime.toISOString(),
        nextMintIn: `${minutesUntilNext}m ${secondsUntilNext}s`,
        nextMintAt: nextCycle.toISOString(),
        uptime: formatUptime(process.uptime()),
      }));
    } else if (req.url === "/status") {
      // Full status endpoint - proves autonomy!
      const now = new Date();
      const nextCycle = agentState.nextScheduledCycle;
      const timeUntilNext = Math.max(0, nextCycle.getTime() - now.getTime());
      const minutesUntilNext = Math.floor(timeUntilNext / 60000);
      const secondsUntilNext = Math.floor((timeUntilNext % 60000) / 1000);
      
      res.writeHead(200);
      res.end(JSON.stringify({
        agent: "🔮 PixelOracle - Autonomous AI Artist",
        description: "AI agent that autonomously converts computation → culture → onchain provenance",
        status: agentState.status,
        autonomous: true,
        humanInLoop: false,
        
        // Human-readable timing
        lastCycleRan: agentState.lastCycleTime.toISOString(),
        lastCycleAgo: formatUptime((now.getTime() - agentState.lastCycleTime.getTime()) / 1000) + " ago",
        nextMintIn: `${minutesUntilNext}m ${secondsUntilNext}s`,
        nextMintAt: nextCycle.toISOString(),
        mintIntervalMinutes: config.creationIntervalMinutes,
        
        // Artwork stats
        totalArtworksMinted: agentState.totalMinted,
        cyclesCompleted: agentState.cycleCount,
        
        // Last mint details
        lastMint: {
          tokenId: agentState.lastMintTokenId,
          txHash: agentState.lastMintTx,
          viewOnBasescan: agentState.lastMintTx ? getBaseScanUrl(agentState.lastMintTx) : null,
          viewOnOpensea: agentState.lastMintTokenId ? `https://opensea.io/assets/base/${agentState.contractAddress}/${agentState.lastMintTokenId}` : null,
        },
        
        // Contract info
        contract: agentState.contractAddress,
        contractUrl: `https://basescan.org/address/${agentState.contractAddress}`,
        network: agentState.network,
        walletBalance: agentState.walletBalance,
        
        // Uptime
        uptime: formatUptime(process.uptime()),
        
        // Social links
        links: {
          farcaster: "https://warpcast.com/pixel-oracle",
          opensea: "https://opensea.io/collection/pixeloracle",
          basescan: `https://basescan.org/address/${agentState.contractAddress}`,
        },
        
        // Recent errors (for debugging)
        recentErrors: agentState.errors.slice(-3),
      }));
    } else if (req.url === "/proof") {
      // Minimal proof endpoint for quick verification
      res.writeHead(200);
      res.end(JSON.stringify({
        alive: true,
        autonomous: true,
        lastMintTx: agentState.lastMintTx,
        nextMint: agentState.nextScheduledCycle.toISOString(),
        contract: agentState.contractAddress,
      }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not found", endpoints: ["/", "/health", "/status", "/proof"] }));
    }
  });

  server.listen(PORT, () => {
    console.log(`🌐 Status server running on port ${PORT}`);
    console.log(`   📊 /status - Full agent status (proves autonomy)`);
    console.log(`   💓 /health - Health check`);
    console.log(`   🔍 /proof  - Minimal proof endpoint`);
  });

  // Self-ping every 10 minutes to prevent Render from sleeping
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
  if (RENDER_URL) {
    setInterval(async () => {
      try {
        const response = await fetch(`${RENDER_URL}/health`);
        console.log(`🏓 Self-ping: ${response.status}`);
      } catch (error) {
        console.log(`🏓 Self-ping failed (non-critical)`);
      }
    }, 10 * 60 * 1000); // 10 minutes
    console.log(`🏓 Self-ping enabled (every 10 mins)`);
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

// Update wallet balance in state
async function updateWalletBalance() {
  try {
    agentState.walletBalance = await getWalletBalance();
  } catch (e) {
    // ignore
  }
}

// ============================================
// Main Creation Cycle
// ============================================

async function createArtworkCycle(): Promise<void> {
  console.log("\n🎨 Starting new artwork creation cycle...\n");
  console.log("=".repeat(50));
  
  agentState.status = "creating";
  agentState.lastCycleTime = new Date();
  agentState.cycleCount++;

  try {
    // Update balance
    await updateWalletBalance();
    
    // Step 0: Check balance
    const hasBalance = await checkBalance();
    if (!hasBalance) {
      console.log("⏸️ Pausing due to low balance");
      agentState.status = "idle";
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
    agentState.status = "minting";
    console.log("\n⛓️ Step 4: Minting on Base...");
    const { tokenId: mintedId, txHash } = await mintArtwork(
      metadataUri,
      artConcept.prompt,
      artConcept.theme
    );
    
    // Update state with mint info
    agentState.lastMintTx = txHash;
    agentState.lastMintTokenId = Number(mintedId);
    agentState.totalMinted = Number(await getTotalMinted());

    // Step 6: Generate social post
    agentState.status = "posting";
    console.log("\n✍️ Step 5: Generating social post...");
    
    const baseScanUrl = getBaseScanUrl(txHash);
    const openSeaUrl = getOpenSeaUrl(mintedId);
    // Use title for concise social posts (fits 280/320 char limits)
    const socialPost = formatSocialPost(artConcept.title, baseScanUrl, openSeaUrl);

    // Step 7: Post to social media
    console.log("\n📢 Step 6: Sharing with the world...");
    const socialResults = await postToAllPlatforms(
      socialPost,
      imageUri,
      imageBuffer
    );

    // Summary
    agentState.status = "idle";
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

    // Emit heartbeat with stats every 5 cycles (on-chain proof of autonomy)
    if (agentState.cycleCount > 0 && agentState.cycleCount % 5 === 0) {
      console.log("\n💓 Milestone reached! Emitting on-chain heartbeat with stats...");
      const heartbeatTx = await emitHeartbeat({
        cycleCount: agentState.cycleCount,
        totalMinted: agentState.totalMinted,
        uptimeSeconds: Math.floor(process.uptime()),
      });
      if (heartbeatTx) {
        agentState.lastHeartbeatTx = heartbeatTx;
        console.log(`   ✅ Heartbeat recorded: ${getBaseScanUrl(heartbeatTx)}\n`);
      }
    }

  } catch (error: any) {
    console.error("\n❌ Error in creation cycle:", error.message);
    console.error(error.stack);
    // Track error in state
    agentState.errors.push({
      time: new Date().toISOString(),
      message: error.message,
    });
    // Keep only last 10 errors
    if (agentState.errors.length > 10) {
      agentState.errors = agentState.errors.slice(-10);
    }
    agentState.status = "idle";
  }
}

// ============================================
// Autonomous Loop
// ============================================

async function runAutonomousLoop(): Promise<void> {
  const intervalMs = config.creationIntervalMinutes * 60 * 1000;

  console.log(`🔄 Autonomous mode: Creating art every ${config.creationIntervalMinutes} minutes`);
  console.log(`   Press Ctrl+C to stop\n`);

  // Update next scheduled cycle time
  const updateNextCycle = () => {
    agentState.nextScheduledCycle = new Date(Date.now() + intervalMs);
  };

  // Run first cycle immediately
  await createArtworkCycle();
  updateNextCycle();

  // Schedule subsequent cycles
  setInterval(async () => {
    console.log(`\n⏰ Time for a new creation...`);
    await createArtworkCycle();
    updateNextCycle();
  }, intervalMs);
}

// ============================================
// Entry Point
// ============================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Start keep-alive server for Render
  startKeepAliveServer();

  // NOTE: --debug-create is for local testing/debugging only.
  // Competition/production deployment uses autonomous mode (default).
  // The agent runs 24/7 without human intervention in autonomous mode.
  if (args.includes("--debug-create") || args.includes("--once")) {
    // Debug mode - single creation for testing
    console.log("🔧 DEBUG MODE: Running single creation cycle...\n");
    console.log("⚠️  For autonomous operation, run without --debug-create\n");
    await createArtworkCycle();
    // Don't exit - keep server running for /status endpoint
  } else {
    // AUTONOMOUS MODE - This is how the agent runs in production
    // No human in the loop - pure autonomous operation
    console.log("🚀 AUTONOMOUS MODE - No human intervention required\n");
    
    // Start interaction listeners (thank collectors, reply to mentions)
    if (config.contractAddress) {
      await startMintListener(account.address, config.contractAddress);
    }
    await startMentionListener();
    
    await runAutonomousLoop();
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  stopListeners();
  console.log("\n\n👋 PixelOracle signing off... Until next time!");
  process.exit(0);
});

process.on("unhandledRejection", (error: any) => {
  console.error("Unhandled rejection:", error);
});

// Run!
main().catch(console.error);
