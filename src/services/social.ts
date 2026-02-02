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

    let mediaId: string | undefined;

    // Upload image if provided
    if (imageBuffer) {
      mediaId = await client.v1.uploadMedia(imageBuffer, {
        mimeType: "image/png",
      });
    }

    // Post tweet
    const tweet = await client.v2.tweet({
      text: text,
      media: mediaId ? { media_ids: [mediaId] } : undefined,
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

  // Post to both platforms in parallel
  const [farcasterResult, twitterResult] = await Promise.all([
    postToFarcaster(text, imageUrl),
    postToTwitter(text, imageBuffer),
  ]);

  return {
    farcaster: farcasterResult,
    twitter: twitterResult,
  };
}

// ============================================
// Generate Social Post with Links
// ============================================

export function formatSocialPost(
  message: string,
  baseScanUrl: string,
  openSeaUrl: string
): string {
  // Keep under 280 chars for Twitter compatibility
  const links = `\n\n🔗 ${baseScanUrl}`;
  const maxMessageLength = 280 - links.length - 10;
  
  let truncatedMessage = message;
  if (message.length > maxMessageLength) {
    truncatedMessage = message.substring(0, maxMessageLength - 3) + "...";
  }

  return `${truncatedMessage}${links}`;
}
