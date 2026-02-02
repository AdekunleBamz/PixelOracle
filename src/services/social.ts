import { config } from "../config.js";
import { ipfsToHttp } from "./ipfsUploader.js";

// ============================================
// Farcaster (via Neynar)
// ============================================

interface FarcasterPostResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export async function postToFarcaster(
  text: string,
  imageUrl?: string
): Promise<FarcasterPostResult> {
  if (!config.neynarApiKey || !config.farcasterSignerUuid) {
    console.log("⚠️ Farcaster not configured, skipping...");
    return { success: false, error: "Not configured" };
  }

  console.log("📢 Posting to Farcaster...");

  try {
    const embeds = [];
    
    // Add image embed if provided
    if (imageUrl) {
      const httpUrl = ipfsToHttp(imageUrl);
      embeds.push({ url: httpUrl });
    }

    const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: config.neynarApiKey,
      },
      body: JSON.stringify({
        signer_uuid: config.farcasterSignerUuid,
        text: text,
        embeds: embeds.length > 0 ? embeds : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Neynar API error: ${error}`);
    }

    const data = await response.json();
    console.log(`✅ Posted to Farcaster: ${data.cast?.hash || "success"}`);
    
    return { success: true, hash: data.cast?.hash };
  } catch (error: any) {
    console.error(`❌ Farcaster post failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================
// Twitter/X
// ============================================

interface TwitterPostResult {
  success: boolean;
  tweetId?: string;
  error?: string;
}

export async function postToTwitter(
  text: string,
  imageBuffer?: Buffer
): Promise<TwitterPostResult> {
  if (
    !config.twitterApiKey ||
    !config.twitterApiSecret ||
    !config.twitterAccessToken ||
    !config.twitterAccessSecret
  ) {
    console.log("⚠️ Twitter not configured, skipping...");
    return { success: false, error: "Not configured" };
  }

  console.log("📢 Posting to Twitter/X...");

  try {
    // Dynamic import to avoid issues if not configured
    const { TwitterApi } = await import("twitter-api-v2");

    const client = new TwitterApi({
      appKey: config.twitterApiKey,
      appSecret: config.twitterApiSecret,
      accessToken: config.twitterAccessToken,
      accessSecret: config.twitterAccessSecret,
    });

    // Note: Media upload requires Basic tier ($200/month)
    // Free tier only supports text tweets, so we skip image upload
    // The IPFS image link is included in the text anyway

    // Post tweet (text only on free tier)
    const tweet = await client.v2.tweet({
      text: text,
    });

    console.log(`✅ Posted to Twitter: ${tweet.data.id}`);
    return { success: true, tweetId: tweet.data.id };
  } catch (error: any) {
    console.error(`❌ Twitter post failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================
// Post to All Configured Platforms
// ============================================

export interface SocialPostResult {
  farcaster: FarcasterPostResult;
  twitter: TwitterPostResult;
}

export async function postToAllPlatforms(
  text: string,
  imageUrl?: string,
  imageBuffer?: Buffer
): Promise<SocialPostResult> {
  console.log("\n📣 Broadcasting to social platforms...\n");

  // Post to Farcaster FIRST (it has the image)
  const farcasterResult = await postToFarcaster(text, imageUrl);

  // Build Twitter text - include Farcaster link if available
  let twitterText = text;
  if (farcasterResult.success && farcasterResult.hash) {
    // Warpcast URL format: https://warpcast.com/~/conversations/{hash}
    const warpcastUrl = `https://warpcast.com/~/conversations/${farcasterResult.hash}`;
    // Add Farcaster link to Twitter post (truncate main text if needed)
    const linkText = `\n\n🖼️ See artwork: ${warpcastUrl}`;
    const maxTextLength = 280 - linkText.length;
    if (twitterText.length > maxTextLength) {
      twitterText = twitterText.substring(0, maxTextLength - 3) + "...";
    }
    twitterText = twitterText + linkText;
  }

  // Now post to Twitter with Farcaster link
  const twitterResult = await postToTwitter(twitterText, imageBuffer);

  return {
    farcaster: farcasterResult,
    twitter: twitterResult,
  };
}

// ============================================
// Generate Social Post with Links
// ============================================

export function formatSocialPost(
  title: string,
  baseScanUrl: string,
  openSeaUrl: string
): string {
  // Farcaster: 320 chars, Twitter: 280 chars
  // Use shorter format to fit both platforms
  
  // Shorten URLs for display (full URLs still work as links)
  const shortBaseScan = baseScanUrl.replace('https://basescan.org/tx/', 'basescan.org/tx/').substring(0, 35) + '...';
  const shortOpenSea = 'opensea.io/assets/base/...';
  
  const links = `\n\n⛓️ ${shortBaseScan}\n🖼️ ${shortOpenSea}`;
  
  // Create a punchy post with just the title
  const post = `🎨 New artwork minted!\n\n"${title}"\n\nAutonomously created & minted on Base by PixelOracle 🔮${links}`;
  
  return post;
}
