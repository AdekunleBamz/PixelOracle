# 🔮 PixelOracle

**An Autonomous AI Artist Agent on Base**

PixelOracle is a fully autonomous AI agent that creates, mints, and shares unique digital artworks on the Base blockchain. No human in the loop - just pure autonomous creativity.

![PixelOracle Banner](https://via.placeholder.com/800x400/1a1a2e/eee?text=PixelOracle+%E2%9C%A8)

## ✨ Features

- 🎨 **AI Art Generation** - Uses DALL-E 3 to create unique, stunning artworks
- ⛓️ **On-Chain Minting** - Automatically mints NFTs on Base
- 📢 **Social Sharing** - Posts to Farcaster and X/Twitter automatically
- 🔄 **Fully Autonomous** - Runs continuously without human intervention
- 🎭 **Themed Collections** - Generates art across multiple themes (surreal, cyberpunk, cosmic, etc.)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PixelOracle Agent                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   OpenAI    │  │   Pinata    │  │    Base     │         │
│  │  (DALL-E)   │  │   (IPFS)    │  │ (Blockchain)│         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────────────────────────────────────────┐       │
│  │              Autonomous Loop                     │       │
│  │  1. Generate Art Concept (GPT-4)                │       │
│  │  2. Create Image (DALL-E 3)                     │       │
│  │  3. Upload to IPFS (Pinata)                     │       │
│  │  4. Mint NFT (Base)                             │       │
│  │  5. Post to Social (Farcaster/X)                │       │
│  │  6. Wait & Repeat                               │       │
│  └─────────────────────────────────────────────────┘       │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │  Farcaster  │  │  Twitter/X  │                          │
│  │  (Neynar)   │  │   (API v2)  │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A wallet with ETH on Base (for gas fees)
- API keys for: OpenAI, Pinata, and optionally Neynar/Twitter

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pixeloracle.git
cd pixeloracle

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Configuration

Edit `.env` with your credentials:

```env
# Required
PRIVATE_KEY=your_wallet_private_key
OPENAI_API_KEY=your_openai_key
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret

# Optional - Farcaster
NEYNAR_API_KEY=your_neynar_key
FARCASTER_SIGNER_UUID=your_signer_uuid

# Optional - Twitter
TWITTER_API_KEY=your_twitter_key
TWITTER_API_SECRET=your_twitter_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
```

### Deploy the Smart Contract

```bash
# Compile contracts
npm run compile

# Deploy to Base Sepolia (testnet)
npm run deploy:testnet

# Deploy to Base mainnet
npm run deploy
```

After deployment, add the contract address to your `.env`:
```env
NFT_CONTRACT_ADDRESS=0x...
```

### Run the Agent

```bash
# Run single creation cycle (for testing)
npm run agent -- --once

# Run autonomous mode (continuous)
npm run agent
```

## 📁 Project Structure

```
pixeloracle/
├── contracts/
│   └── PixelOracle.sol      # ERC-721 NFT contract
├── scripts/
│   └── deploy.ts            # Deployment script
├── src/
│   ├── agent.ts             # Main autonomous agent
│   ├── config.ts            # Configuration & setup
│   ├── index.ts             # SDK exports
│   └── services/
│       ├── artGenerator.ts  # AI art generation
│       ├── blockchain.ts    # Base interactions
│       ├── ipfsUploader.ts  # IPFS/Pinata uploads
│       └── social.ts        # Social media posting
├── .env.example
├── hardhat.config.ts
├── package.json
└── README.md
```

## 🎨 Art Themes

PixelOracle creates art across various themes:

| Theme | Description |
|-------|-------------|
| `surreal` | Dreamscape with impossible geometry |
| `cyberpunk` | Neon-lit cityscapes |
| `abstract` | Bold expressionism |
| `cosmic` | Nebulas and stardust |
| `dreamscape` | Ethereal floating worlds |
| `vaporwave` | Retro aesthetic |
| `glitch` | Digital artifacts |
| `geometric` | Sacred geometry |

Configure themes in `.env`:
```env
ART_THEMES=surreal,cyberpunk,cosmic
```

## 🔗 On-Chain Features

The PixelOracle smart contract includes:

- **ERC-721 Compliant** - Standard NFT functionality
- **Enumerable** - Easy iteration over tokens
- **URI Storage** - IPFS metadata storage
- **Prompt Hashing** - On-chain proof of AI generation
- **Oracle Visions** - Emit messages as events
- **Public Minting** - Collectors can mint too

## 📢 Social Integration

### Farcaster Setup (via Neynar)

1. Create account at [neynar.com](https://neynar.com)
2. Create a new signer for your Farcaster account
3. Add API key and signer UUID to `.env`

### Twitter/X Setup

1. Apply for Twitter Developer access
2. Create a project with OAuth 1.0a
3. Generate access tokens with read/write permissions
4. Add all keys to `.env`

## 🛠️ Development

```bash
# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Clean build artifacts
npm run clean
```

## 🏆 Builder Quest Submission

This project was built for the OpenClaw Builder Quest. PixelOracle demonstrates:

- ✅ **Autonomous Operation** - No human in the loop
- ✅ **On-Chain Transactions** - Mints NFTs on Base
- ✅ **Smart Contract Implementation** - Custom ERC-721
- ✅ **Social Integration** - Posts to Farcaster/X
- ✅ **Novel Use Case** - AI artist with on-chain provenance

## 📄 License

MIT License - feel free to fork and build your own autonomous agents!

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

---

**Built with ✨ for the Base ecosystem**

[Twitter](https://twitter.com/pixeloracle) | [Farcaster](https://warpcast.com/pixeloracle) | [BaseScan](https://basescan.org)
