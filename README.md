# 🔮 PixelOracle

**An Autonomous AI Artist Agent on Base**

> 🏆 **OpenClaw Builder Quest Submission** - An AI agent that converts computation → culture → onchain provenance

PixelOracle is a fully autonomous AI agent that creates, mints, and shares unique digital artworks on the Base blockchain. No human in the loop - just pure autonomous creativity.

![PixelOracle Banner](https://coffee-mean-rooster-421.mypinata.cloud/ipfs/Qma9s8iD4PnWAiqPvv4Zw1amVeUnmEPtKUgAE7FViQgbnQ)

## 🎯 Why PixelOracle?

- **Truly Autonomous**: Runs 24/7 without human intervention
- **Publicly Verifiable**: Live `/status` endpoint proves autonomy
- **On-Chain Proof**: Every mint creates immutable blockchain records
- **AI-Native**: Gemini/GPT-4 concepts + Imagen 3/DALL-E 3 artwork generation (FREE with Gemini!)

## 🎥 Demo Video

Watch PixelOracle create, mint, and post autonomously:

👉 https://youtu.be/KC8w4bEdLPc

## ✨ Features

- 🎨 **AI Art Generation** - Uses Google Gemini (FREE) or DALL-E 3 to create unique artworks
- ⛓️ **On-Chain Minting** - Automatically mints NFTs on Base
- 📢 **Social Sharing** - Posts to Farcaster + X/Twitter automatically
- 🔄 **Fully Autonomous** - Runs 24/7 without human intervention
- 🎭 **Themed Collections** - Generates art across 10+ themes (surreal, cyberpunk, cosmic, etc.)
- 📊 **Public Status API** - `/status` endpoint for real-time monitoring
- 🧠 **AI-Powered Replies** - Context-aware responses to mentions using Gemini/GPT
- 🗳️ **Community Theme Voting** - Followers vote on next art theme via mentions
- 💬 **Comment Interaction** - Replies to comments under its own posts
- 🙏 **Mint Acknowledgements** - Polls for new collector mints and auto-thanks them
- 💓 **On-Chain Heartbeat** - Periodic proof-of-autonomy transactions with stats

## 📡 Live Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | Health check |
| `/status` | Full agent state, metrics, and onchain proof |
| `/proof` | Minimal proof of autonomy |

### Sample `/status` Response
```json
{
  "agent": "🔮 PixelOracle - Autonomous AI Artist",
  "status": "idle",
  "autonomous": true,
  "humanInLoop": false,
  "lastMintTx": "0x...",
  "nextScheduledCycle": "2024-01-15T12:00:00.000Z",
  "totalMinted": 15,
  "contract": "0x09ED29b4b822a41bf14B2efE8C54bA753A35d5B6",
  "network": "base"
}
```

## 🔗 Verification Links

- **Farcaster**: [Agent Feed](https://warpcast.com/pixel-oracle)
- **Contract**: [BaseScan](https://basescan.org/address/0x09ED29b4b822a41bf14B2efE8C54bA753A35d5B6)
- **Collection**: [OpenSea](https://opensea.io/collection/pixeloracle-413427511)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PixelOracle Agent                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │Google Gemini│  │   Pinata    │  │    Base     │         │
│  │ (FREE AI!)  │  │   (IPFS)    │  │ (Blockchain)│         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────────────────────────────────────────┐       │
│  │              Autonomous Loop                     │       │
│  │  1. Generate Art Concept (Gemini/GPT-4)          │       │
│  │  2. Create Image (Imagen 3/DALL-E 3)             │       │
│  │  3. Upload to IPFS (Pinata)                     │       │
│  │  4. Mint NFT (Base)                             │       │
│  │  5. Post to Social (Farcaster/X)                │       │
│  │  6. Wait & Repeat                               │       │
│  └─────────────────────────────────────────────────┘       │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  Farcaster  │                                            │
│  │  (Neynar)   │                                            │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

> Once deployed, the autonomous loop runs indefinitely without prompts, approvals, or human triggers.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A wallet with ETH on Base (for gas fees)
- Google Gemini API key (FREE at https://aistudio.google.com/apikey) OR OpenAI key
- Pinata API key (for IPFS)
- Neynar API key (for Farcaster)

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
GEMINI_API_KEY=your_gemini_key      # FREE! Get at https://aistudio.google.com/apikey
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret

# Farcaster
NEYNAR_API_KEY=your_neynar_key
FARCASTER_SIGNER_UUID=your_signer_uuid
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

### Twitter/X Note

Twitter/X posting is implemented using API v2. Due to X's paid API requirements, write actions may return HTTP 402 on free tiers. This does not affect the agent's autonomy or on-chain behavior. Farcaster serves as the primary live social proof.

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

- ✅ **Autonomous Operation** - No human in the loop, runs 24/7
- ✅ **On-Chain Transactions** - Mints NFTs + heartbeat proofs on Base
- ✅ **Smart Contract Implementation** - Custom ERC-721 with theme tracking
- ✅ **Social Integration** - Posts to Farcaster + X with AI-powered replies
- ✅ **Community Interaction** - Theme voting via mentions
- ✅ **Collector Engagement** - Auto-thanks new minters
- ✅ **Novel Use Case** - AI artist with on-chain provenance + community governance
- ✅ **Free AI** - Runs on Google Gemini free tier (no API costs!)

## 📄 License

MIT License - feel free to fork and build your own autonomous agents!

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

---

**Built with ✨ for the Base ecosystem**

[Farcaster](https://warpcast.com/pixel-oracle) | [OpenSea](https://opensea.io/collection/pixeloracle-413427511) | [BaseScan](https://basescan.org/address/0x09ED29b4b822a41bf14B2efE8C54bA753A35d5B6)
