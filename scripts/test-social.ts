// ============================================
// 🧪 Test Social Media Connections
// ============================================

import { config } from "../src/config.js";
import { postToFarcaster, postToTwitter } from "../src/services/social.js";

console.log(`
╔═══════════════════════════════════════════════════════════╗
║         🧪 Testing Social Media Connections               ║
╚═══════════════════════════════════════════════════════════╝
`);

async function testSocialConnections() {
  const testMessage = `🔮 PixelOracle test post - ${new Date().toISOString()}

Testing autonomous agent connectivity. Please ignore this message!

🎨 AI Art Agent on Base`;

  console.log("📝 Test message:", testMessage);
  console.log("\n" + "=".repeat(50) + "\n");

  // Test Farcaster
  console.log("🟣 Testing Farcaster (Neynar)...");
  console.log("   API Key:", config.neynarApiKey ? "✅ Configured" : "❌ Missing");
  console.log("   Signer UUID:", config.farcasterSignerUuid ? "✅ Configured" : "❌ Missing");
  
  if (config.neynarApiKey && config.farcasterSignerUuid) {
    const farcasterResult = await postToFarcaster(testMessage);
    if (farcasterResult.success) {
      console.log("   ✅ Farcaster POST SUCCESSFUL!");
      console.log(`   📎 Cast hash: ${farcasterResult.hash}`);
    } else {
      console.log("   ❌ Farcaster failed:", farcasterResult.error);
    }
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test Twitter
  console.log("🐦 Testing Twitter/X...");
  console.log("   API Key:", config.twitterApiKey ? "✅ Configured" : "❌ Missing");
  console.log("   API Secret:", config.twitterApiSecret ? "✅ Configured" : "❌ Missing");
  console.log("   Access Token:", config.twitterAccessToken ? "✅ Configured" : "❌ Missing");
  console.log("   Access Secret:", config.twitterAccessSecret ? "✅ Configured" : "❌ Missing");

  if (config.twitterApiKey && config.twitterApiSecret && config.twitterAccessToken && config.twitterAccessSecret) {
    const twitterResult = await postToTwitter(testMessage);
    if (twitterResult.success) {
      console.log("   ✅ Twitter POST SUCCESSFUL!");
      console.log(`   📎 Tweet ID: ${twitterResult.tweetId}`);
      console.log(`   🔗 https://x.com/i/status/${twitterResult.tweetId}`);
    } else {
      console.log("   ❌ Twitter failed:", twitterResult.error);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("🏁 Test complete!");
}

testSocialConnections().catch(console.error);
