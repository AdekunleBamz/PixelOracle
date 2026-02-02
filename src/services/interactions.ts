import { config, publicClient, pixelOracleABI } from "../config.js";
import { postToFarcaster, postToTwitter } from "./social.js";
import { getBaseScanUrl, getOpenSeaUrl } from "./blockchain.js";

// ============================================
// ABI Extensions for Events
// ============================================

const extendedABI = [
  ...pixelOracleABI,
  {
    type: "event",
    name: "ArtworkCreated",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "metadataURI", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
  },
] as const;

// ============================================
// Track Processed Events (avoid duplicates)
// ============================================

const processedMints = new Set<string>();
const processedFarcasterMentions = new Set<string>();
const processedTwitterMentions = new Set<string>();

// ============================================
// Listen for New Mints (Thank Collectors)
// ============================================

export async function startMintListener(
  agentAddress: string,
  contractAddress: `0x${string}`
): Promise<void> {
  console.log("👂 Mint listener for collector thank-yous...");
  
  // Note: Disabled due to public RPC limitations with event filters
  // The free Base RPC doesn't support eth_newFilter/eth_getFilterChanges reliably
  // To enable: use a paid RPC like Alchemy or Infura that supports WebSocket/filters
  console.log("   ⚠️ Mint listener disabled (public RPC doesn't support filters)");
  console.log("   💡 Tip: Use Alchemy/Infura RPC to enable this feature");
  return;

  // Original code kept for reference - uncomment with a proper RPC:
  /*
  // Watch for ArtworkCreated events
  publicClient.watchContractEvent({
    address: contractAddress,
    abi: extendedABI,
    eventName: "ArtworkCreated",
    onLogs: async (logs) => {
      for (const log of logs) {
        const { tokenId, creator, metadataURI, timestamp } = log.args as {
          tokenId: bigint;
          creator: string;
          metadataURI: string;
          timestamp: bigint;
        };

        // Skip if this is our own mint
        if (creator.toLowerCase() === agentAddress.toLowerCase()) {
          continue;
        }

        // Skip if already processed
        const eventKey = `${log.transactionHash}-${tokenId}`;
        if (processedMints.has(eventKey)) {
          continue;
        }
        processedMints.add(eventKey);

        console.log(`\n🎉 NEW COLLECTOR MINT DETECTED!`);
        console.log(`   Token ID: ${tokenId}`);
        console.log(`   Collector: ${creator}`);

        // Generate thank you message
        await thankCollector(collector, tokenId, log.transactionHash || "");
      }
    },
    onError: (error) => {
      console.error("❌ Mint listener error:", error.message);
    },
  });

  console.log("   ✅ Mint listener active");
  */
}

// ============================================
// Thank Collector Function
// ============================================

async function thankCollector(
  collector: string,
  tokenId: bigint,
  txHash: string
): Promise<void> {
  const shortAddress = `${collector.slice(0, 6)}...${collector.slice(-4)}`;
  const openSeaUrl = getOpenSeaUrl(tokenId);
  
  // Generate varied thank you messages
  const thankYouMessages = [
    `🙏 Thank you, ${shortAddress}! You just collected PixelOracle #${tokenId}. The Oracle sees your vision. ✨`,
    `✨ A new guardian emerges! ${shortAddress} has claimed PixelOracle #${tokenId}. The Oracle is grateful. 🔮`,
    `🔮 The Oracle acknowledges ${shortAddress} — collector of #${tokenId}. May this art illuminate your path. 💫`,
    `💎 Welcome to the collection, ${shortAddress}! PixelOracle #${tokenId} now resides with you. 🎨`,
    `🌟 ${shortAddress} has joined the Oracle's circle by collecting #${tokenId}. Art finds its destined keeper. 🙏`,
  ];

  const message = thankYouMessages[Math.floor(Math.random() * thankYouMessages.length)];
  const fullPost = `${message}\n\n🖼️ ${openSeaUrl}`;

  console.log(`   📢 Posting thank you...`);

  // Post to social platforms
  const [farcasterResult, twitterResult] = await Promise.all([
    postToFarcaster(fullPost),
    postToTwitter(fullPost),
  ]);

  if (farcasterResult.success) {
    console.log(`   ✅ Thank you posted to Farcaster`);
  }
  if (twitterResult.success) {
    console.log(`   ✅ Thank you posted to Twitter`);
  }
}

// ============================================
// Listen for Farcaster Mentions & Replies
// ============================================

let farcasterMentionInterval: NodeJS.Timeout | null = null;
let twitterMentionInterval: NodeJS.Timeout | null = null;

export async function startMentionListener(fid?: string): Promise<void> {
  // Start Farcaster listener
  if (config.neynarApiKey && config.farcasterSignerUuid) {
    console.log("👂 Starting Farcaster mention listener...");

    // Check for mentions every 2 minutes
    farcasterMentionInterval = setInterval(async () => {
      await checkAndReplyToFarcasterMentions();
    }, 2 * 60 * 1000);

    // Initial check
    await checkAndReplyToFarcasterMentions();

    console.log("   ✅ Farcaster listener active (every 2 min)");
  } else {
    console.log("⚠️ Farcaster not configured, skipping mention listener");
  }

  // Start Twitter listener (every 8 hours to stay within 100 reads/month free tier)
  if (config.twitterApiKey && config.twitterAccessToken) {
    console.log("👂 Starting Twitter/X mention listener...");

    // Check for mentions every 8 hours (3x per day = ~90 reads/month)
    twitterMentionInterval = setInterval(async () => {
      await checkAndReplyToTwitterMentions();
    }, 8 * 60 * 60 * 1000);

    // Initial check
    await checkAndReplyToTwitterMentions();

    console.log("   ✅ Twitter listener active (every 8 hours - free tier friendly)");
  } else {
    console.log("⚠️ Twitter not configured, skipping mention listener");
  }
}

async function checkAndReplyToFarcasterMentions(): Promise<void> {
  try {
    // Get our FID first
    const userResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by_username?username=pixeloracle`,
      {
        headers: { api_key: config.neynarApiKey },
      }
    );

    if (!userResponse.ok) {
      return; // User not found, skip
    }

    const userData = await userResponse.json();
    const fid = userData.user?.fid;

    if (!fid) return;

    // Get mentions/notifications
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/notifications?fid=${fid}&type=mentions`,
      {
        headers: { api_key: config.neynarApiKey },
      }
    );

    if (!response.ok) return;

    const data = await response.json();
    const mentions = data.notifications || [];

    for (const mention of mentions.slice(0, 5)) {
      // Only process recent, unprocessed mentions
      if (processedFarcasterMentions.has(mention.cast?.hash)) {
        continue;
      }

      const cast = mention.cast;
      if (!cast) continue;

      // Mark as processed
      processedFarcasterMentions.add(cast.hash);

      // Generate reply
      const reply = await generateMentionReply(cast.text, cast.author?.username);
      
      if (reply) {
        await replyToCast(cast.hash, reply);
        console.log(`   💬 [Farcaster] Replied to @${cast.author?.username}`);
      }
    }
  } catch (error: any) {
    // Silent fail - mentions are optional
  }
}

// ============================================
// Twitter/X Mention Checking
// ============================================

async function checkAndReplyToTwitterMentions(): Promise<void> {
  if (!config.twitterApiKey || !config.twitterAccessToken) {
    return;
  }

  try {
    console.log("   🐦 Checking Twitter mentions...");
    
    // Dynamic import
    const { TwitterApi } = await import("twitter-api-v2");

    const client = new TwitterApi({
      appKey: config.twitterApiKey,
      appSecret: config.twitterApiSecret,
      accessToken: config.twitterAccessToken,
      accessSecret: config.twitterAccessSecret,
    });

    // Get our user ID
    const me = await client.v2.me();
    const myUserId = me.data.id;

    // Get recent mentions (this uses 1 read from the 100/month quota)
    const mentions = await client.v2.userMentionTimeline(myUserId, {
      max_results: 10,
      expansions: ["author_id"],
      "tweet.fields": ["created_at", "conversation_id"],
      "user.fields": ["username"],
    });

    if (!mentions.data?.data) {
      console.log("   🐦 No new mentions");
      return;
    }

    // Build user lookup map
    const users = new Map<string, string>();
    for (const user of mentions.includes?.users || []) {
      users.set(user.id, user.username);
    }

    let repliedCount = 0;

    for (const tweet of mentions.data.data) {
      // Skip if already processed
      if (processedTwitterMentions.has(tweet.id)) {
        continue;
      }

      // Mark as processed
      processedTwitterMentions.add(tweet.id);

      // Get username
      const username = users.get(tweet.author_id || "") || "friend";

      // Generate reply
      const reply = await generateMentionReply(tweet.text, username);

      if (reply) {
        try {
          await client.v2.reply(reply, tweet.id);
          console.log(`   💬 [Twitter] Replied to @${username}`);
          repliedCount++;
          
          // Limit replies per check to avoid rate limits
          if (repliedCount >= 3) break;
        } catch (replyError: any) {
          // Rate limited or other error - skip
          console.log(`   ⚠️ Twitter reply failed: ${replyError.message}`);
        }
      }
    }

    if (repliedCount === 0) {
      console.log("   🐦 No mentions needed replies");
    }
  } catch (error: any) {
    console.log(`   ⚠️ Twitter mention check failed: ${error.message}`);
  }
}

async function generateMentionReply(mentionText: string, username?: string): Promise<string | null> {
  // Simple keyword-based responses (could use GPT for smarter replies)
  const text = mentionText.toLowerCase();
  const user = username ? `@${username}` : "friend";

  if (text.includes("gm") || text.includes("good morning")) {
    return `gm ${user} ☀️ The Oracle sees a creative day ahead for you! 🔮`;
  }

  if (text.includes("hello") || text.includes("hi ") || text.includes("hey")) {
    return `Hello ${user}! 👋 The Oracle welcomes you. What vision do you seek? 🔮`;
  }

  if (text.includes("love") || text.includes("amazing") || text.includes("beautiful") || text.includes("great")) {
    return `Thank you ${user}! 🙏 The Oracle is grateful for your kind words. Art thrives on appreciation. ✨`;
  }

  if (text.includes("when") || text.includes("next")) {
    return `${user}, the Oracle creates on its own rhythm 🎨 New visions emerge every hour. Stay tuned! ⏰`;
  }

  if (text.includes("how") && (text.includes("work") || text.includes("make") || text.includes("create"))) {
    return `${user}, I am an autonomous AI agent 🤖 I generate art with DALL-E, mint NFTs on Base, and share them here — all without human intervention! 🔮`;
  }

  if (text.includes("buy") || text.includes("mint") || text.includes("collect")) {
    return `${user}, you can collect my art on OpenSea! 🖼️ Each piece is minted on Base. Check the link in my bio! 💎`;
  }

  // Default: acknowledge but don't spam
  if (Math.random() < 0.3) {
    // Only respond to 30% of other mentions to avoid spam
    return `The Oracle acknowledges you, ${user} 🔮✨`;
  }

  return null; // Don't reply to everything
}

async function replyToCast(parentHash: string, text: string): Promise<void> {
  try {
    await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: config.neynarApiKey,
      },
      body: JSON.stringify({
        signer_uuid: config.farcasterSignerUuid,
        text: text,
        parent: parentHash,
      }),
    });
  } catch (error: any) {
    console.error(`   ❌ Reply failed: ${error.message}`);
  }
}

// ============================================
// Stop Listeners
// ============================================

export function stopListeners(): void {
  if (farcasterMentionInterval) {
    clearInterval(farcasterMentionInterval);
    farcasterMentionInterval = null;
  }
  if (twitterMentionInterval) {
    clearInterval(twitterMentionInterval);
    twitterMentionInterval = null;
  }
  console.log("🛑 Interaction listeners stopped");
}
