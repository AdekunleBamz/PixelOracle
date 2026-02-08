import { config, publicClient, pixelOracleABI } from "../config.js";
import { postToFarcaster, postToTwitter } from "./social.js";
import { getBaseScanUrl, getOpenSeaUrl } from "./blockchain.js";
import { generateAIReply } from "./artGenerator.js";

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
// Community Theme Voting (via Farcaster mentions)
// ============================================

const themeVotes = new Map<string, number>();
const validThemes = ["surreal", "cyberpunk", "abstract", "cosmic", "dreamscape", "vaporwave", "minimalist", "glitch", "nature", "geometric"];

export function getTopVotedTheme(): string | null {
  if (themeVotes.size === 0) return null;
  
  let topTheme: string | null = null;
  let topVotes = 0;
  
  for (const [theme, votes] of themeVotes.entries()) {
    if (votes > topVotes) {
      topTheme = theme;
      topVotes = votes;
    }
  }
  
  // Reset votes after consuming
  if (topTheme && topVotes > 0) {
    console.log(`   🗳️ Community chose theme: "${topTheme}" with ${topVotes} votes!`);
    themeVotes.clear();
    return topTheme;
  }
  
  return null;
}

export function getThemeVotes(): Record<string, number> {
  return Object.fromEntries(themeVotes);
}

function processThemeVote(text: string, username: string): string | null {
  const lower = text.toLowerCase();
  
  // Check for "vote <theme>" or "theme <theme>" pattern
  const voteMatch = lower.match(/(?:vote|theme|request|create|paint|draw)\s+(\w+)/);
  if (!voteMatch) return null;
  
  const requestedTheme = voteMatch[1];
  
  // Check if it's a valid theme
  const matchedTheme = validThemes.find(t => t.startsWith(requestedTheme) || requestedTheme.startsWith(t));
  if (!matchedTheme) return null;
  
  // Record the vote
  themeVotes.set(matchedTheme, (themeVotes.get(matchedTheme) || 0) + 1);
  const currentVotes = themeVotes.get(matchedTheme) || 0;
  
  console.log(`   🗳️ @${username} voted for theme: "${matchedTheme}" (${currentVotes} total votes)`);
  
  return matchedTheme;
}

// ============================================
// Listen for New Mints via Polling (works on public RPCs)
// ============================================

let mintPollInterval: NodeJS.Timeout | null = null;
let lastKnownSupply: bigint = BigInt(0);

export async function startMintListener(
  agentAddress: string,
  contractAddress: `0x${string}`
): Promise<void> {
  console.log("👂 Starting mint listener (polling mode)...");
  
  try {
    // Get initial supply
    lastKnownSupply = await publicClient.readContract({
      address: contractAddress,
      abi: pixelOracleABI,
      functionName: "totalSupply",
    }) as bigint;
    console.log(`   📊 Current supply: ${lastKnownSupply}`);
  } catch (error: any) {
    console.log(`   ⚠️ Could not read initial supply: ${error.message}`);
    return;
  }
  
  // Poll every 3 minutes for new mints
  mintPollInterval = setInterval(async () => {
    try {
      const currentSupply = await publicClient.readContract({
        address: contractAddress,
        abi: pixelOracleABI,
        functionName: "totalSupply",
      }) as bigint;
      
      if (currentSupply > lastKnownSupply) {
        const newMints = Number(currentSupply - lastKnownSupply);
        console.log(`\n🎉 ${newMints} NEW MINT(S) DETECTED!`);
        
        // Check each new token
        for (let i = Number(lastKnownSupply); i < Number(currentSupply); i++) {
          try {
            const owner = await publicClient.readContract({
              address: contractAddress,
              abi: [{
                inputs: [{ name: "tokenId", type: "uint256" }],
                name: "ownerOf",
                outputs: [{ name: "", type: "address" }],
                stateMutability: "view",
                type: "function",
              }],
              functionName: "ownerOf",
              args: [BigInt(i)],
            }) as string;
            
            // Only thank if not our own mint
            if (owner.toLowerCase() !== agentAddress.toLowerCase()) {
              await thankCollector(owner, BigInt(i), "");
            }
          } catch {
            // Token might not exist yet, skip
          }
        }
        
        lastKnownSupply = currentSupply;
      }
    } catch (error: any) {
      // Silent fail — polling errors are non-critical
    }
  }, 3 * 60 * 1000); // Every 3 minutes
  
  console.log("   ✅ Mint listener active (polling every 3 min)");
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

      // Check for theme vote first
      const votedTheme = processThemeVote(cast.text, cast.author?.username || "anon");
      
      let reply: string | null;
      if (votedTheme) {
        // Acknowledge the theme vote
        reply = `🗳️ Vote recorded! You voted for "${votedTheme}" theme, @${cast.author?.username}. The Oracle hears the community! 🔮`;
      } else {
        // Generate AI-powered reply
        reply = await generateAIReply(cast.text, cast.author?.username);
      }
      
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

      // Generate AI-powered reply
      const reply = await generateAIReply(tweet.text, username);

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
  if (mintPollInterval) {
    clearInterval(mintPollInterval);
    mintPollInterval = null;
  }
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
