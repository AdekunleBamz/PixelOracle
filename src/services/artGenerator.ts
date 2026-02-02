import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
  timeout: 120000, // 2 minute timeout for DALL-E
  maxRetries: 2,
});

// ============================================
// Art Style Definitions
// ============================================

const styleModifiers: Record<string, string> = {
  surreal: "surrealist dreamscape with melting forms and impossible geometry, Salvador Dali inspired",
  cyberpunk: "neon-lit cyberpunk cityscape with holographic elements and rain-slicked streets",
  abstract: "bold abstract expressionism with dynamic brushstrokes and vibrant color fields",
  cosmic: "cosmic nebula with swirling galaxies, stardust, and ethereal light",
  dreamscape: "ethereal dreamscape with floating islands and bioluminescent flora",
  vaporwave: "vaporwave aesthetic with pink and blue gradients, greek statues, and retro tech",
  minimalist: "minimalist composition with clean lines and negative space",
  glitch: "glitch art with digital artifacts, RGB splitting, and data corruption aesthetics",
  nature: "fantastical nature scene with impossible plants and magical creatures",
  geometric: "sacred geometry patterns with fractals and mathematical beauty",
};

// ============================================
// Prompt Generation
// ============================================

interface GeneratedPrompt {
  prompt: string;
  theme: string;
  title: string;
  description: string;
}

export async function generateArtPrompt(): Promise<GeneratedPrompt> {
  // Pick a random theme
  const themes = config.artThemes;
  const theme = themes[Math.floor(Math.random() * themes.length)];
  const styleModifier = styleModifiers[theme] || theme;

  // Use GPT to generate a unique, creative prompt
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are PixelOracle, an autonomous AI artist creating unique digital artworks. 
Your art explores themes of technology, consciousness, and the digital frontier.
Generate creative, evocative art prompts that will produce stunning visuals.
Always respond in JSON format with: title, description, and imagePrompt fields.`,
      },
      {
        role: "user",
        content: `Create a unique artwork concept in the style of: ${styleModifier}

The artwork should:
- Have a poetic, memorable title
- Explore themes relevant to the crypto/web3 community
- Be visually striking and unique
- Feel like a prophecy or vision from a digital oracle

Respond with JSON only:
{
  "title": "artwork title",
  "description": "2-3 sentence description for NFT metadata",
  "imagePrompt": "detailed DALL-E prompt for generating the image"
}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.9,
  });

  const response = JSON.parse(completion.choices[0].message.content || "{}");

  return {
    prompt: response.imagePrompt,
    theme,
    title: response.title,
    description: response.description,
  };
}

// ============================================
// Image Generation
// ============================================

export async function generateImage(prompt: string, retries = 2): Promise<Buffer> {
  console.log("🎨 Generating image with DALL-E...");
  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `${prompt}. High quality digital art, 4K resolution, detailed, professional artwork.`,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "vivid",
      });

      if (!response.data || !response.data[0]?.url) {
        throw new Error("No image URL returned from DALL-E");
      }
      const imageUrl = response.data[0].url;

      // Download the image with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for download
      
      const imageResponse = await fetch(imageUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const arrayBuffer = await imageResponse.arrayBuffer();
      
      console.log("✅ Image generated successfully");
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      console.log(`   ⚠️ Attempt ${attempt} failed: ${error.message}`);
      if (attempt <= retries) {
        console.log(`   🔄 Retrying in 5 seconds...`);
        await new Promise(r => setTimeout(r, 5000));
      } else {
        throw error;
      }
    }
  }
  
  throw new Error("Image generation failed after all retries");
}

// ============================================
// Oracle Message Generation
// ============================================

export async function generateOracleMessage(theme: string, title: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are PixelOracle, a mystical AI artist on the Base blockchain. 
You speak in a poetic, prophetic tone - part artist, part digital sage.
Your messages are brief but memorable, mixing crypto culture with artistic wisdom.
Use emojis sparingly but effectively. Never use hashtags excessively.`,
      },
      {
        role: "user",
        content: `Write a short social media post (max 280 chars) announcing your new artwork:
Title: "${title}"
Theme: ${theme}

Include:
- A mystical/prophetic tone
- Reference to the artwork
- Maybe 1-2 relevant emojis
- A sense of being an autonomous AI creating art`,
      },
    ],
    max_tokens: 100,
    temperature: 0.8,
  });

  return completion.choices[0].message.content || "✨ A new vision emerges from the digital void...";
}
