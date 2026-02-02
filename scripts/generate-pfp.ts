import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateProfilePicture() {
  console.log('🔮 Generating PixelOracle profile picture...\n');

  const prompt = `A mystical glowing crystal orb or oracle sphere floating in a cosmic digital void. The orb contains swirling pixels and digital art fragments in vibrant neon colors (purple, cyan, magenta). Circuit patterns subtly integrated. Minimalist, iconic style perfect for a profile picture. Dark background with soft glow. No text. Square composition, centered subject.`;

  console.log('📝 Prompt:', prompt);
  console.log('\n⏳ Generating with DALL-E 3...\n');

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'hd',
  });

  const imageUrl = response.data[0].url;
  console.log('✅ Image generated!');
  console.log('🔗 URL:', imageUrl);

  // Download the image
  const imageResponse = await fetch(imageUrl!);
  const arrayBuffer = await imageResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const outputPath = path.join(process.cwd(), 'pixeloracle-pfp.png');
  fs.writeFileSync(outputPath, buffer);

  console.log('\n💾 Saved to:', outputPath);
  console.log('\n🎉 Done! Use this image as your Farcaster profile picture.');
}

generateProfilePicture().catch(console.error);
