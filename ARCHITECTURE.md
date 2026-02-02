# PixelOracle Architecture

## 🎯 Overview

PixelOracle is an **autonomous AI artist agent** that operates 24/7 without human intervention. It creates unique generative artwork, mints NFTs on Base blockchain, and shares them across social platforms.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PIXELORACLE AUTONOMOUS AGENT                 │
│                                                                 │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────────┐  │
│  │   OpenAI    │   │    DALL-E 3  │   │   Agent Core Loop   │  │
│  │   GPT-4     │──▶│   Image Gen  │──▶│   (Autonomous)      │  │
│  │  (Concepts) │   │              │   │                     │  │
│  └─────────────┘   └──────────────┘   └──────────┬──────────┘  │
│                                                   │             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Autonomous Cycle                      │   │
│  │  1. Generate Art Concept (GPT-4)                        │   │
│  │  2. Create Image (DALL-E 3)                             │   │
│  │  3. Upload to IPFS (Pinata)                             │   │
│  │  4. Mint NFT on Base (ERC-721)                          │   │
│  │  5. Post to Social Media (X + Farcaster)                │   │
│  │  6. Wait for next interval                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Autonomous Workflow

### Creation Cycle (Every 60 minutes by default)

```
START
  │
  ▼
┌─────────────────────┐
│ Check Wallet Balance │
│ (Min 0.0001 ETH)    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Generate Art Concept│◀──── GPT-4 creates unique theme,
│                     │      title, and visual prompt
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Generate Artwork    │◀──── DALL-E 3 creates image
│                     │      from the concept
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Upload to IPFS      │◀──── Pinata stores image +
│                     │      ERC-721 metadata JSON
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Mint NFT on Base    │◀──── On-chain transaction
│                     │      with metadata URI
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Generate Oracle     │◀──── GPT-4 creates poetic
│ Message             │      social post text
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Post to Social      │◀──── Farcaster + X/Twitter
│                     │      with image + message
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Wait for Interval   │◀──── 60 min default
└─────────┬───────────┘
          │
          └──────────────────▶ REPEAT
```

## 🏗️ System Components

### 1. Agent Core (`src/agent.ts`)
- **Purpose**: Main autonomous loop controller
- **Responsibilities**:
  - Orchestrates the creation cycle
  - Manages timing intervals
  - Handles error recovery
  - Exposes `/status` HTTP endpoint for monitoring
- **Key Features**:
  - State tracking (idle/creating/minting/posting)
  - Cycle counting
  - Uptime monitoring

### 2. Art Generator (`src/services/artGenerator.ts`)
- **Purpose**: AI-powered content creation
- **Uses**: OpenAI GPT-4 + DALL-E 3
- **Functions**:
  - `generateArtPrompt()` - Creates unique art concepts
  - `generateImage()` - Renders artwork from prompts
  - `generateOracleMessage()` - Crafts social media posts

### 3. Blockchain Service (`src/services/blockchain.ts`)
- **Purpose**: Base blockchain interactions
- **Contract**: ERC-721 at `0x09ED29b4b822a41bf14B2efE8C54bA753A35d5B6`
- **Functions**:
  - `mintArtwork()` - Mints new NFT
  - `getTotalMinted()` - Reads token count
  - `getWalletBalance()` - Checks ETH balance
  - `emitHeartbeat()` - On-chain liveness signal

### 4. IPFS Uploader (`src/services/ipfsUploader.ts`)
- **Purpose**: Decentralized storage
- **Uses**: Pinata API
- **Functions**:
  - `uploadImage()` - Stores artwork
  - `uploadMetadata()` - Stores ERC-721 JSON
  - `createAndUploadNFTMetadata()` - Full pipeline

### 5. Social Service (`src/services/social.ts`)
- **Purpose**: Multi-platform posting
- **Platforms**: X (Twitter) + Farcaster
- **Functions**:
  - `postToFarcaster()` - Posts via Neynar
  - `postToTwitter()` - Posts via Twitter API v2
  - `postToAllPlatforms()` - Parallel posting

## 📡 API Endpoints

The agent exposes HTTP endpoints for monitoring:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check (returns "PixelOracle is alive!") |
| `/health` | GET | Detailed health status JSON |
| `/status` | GET | Full agent state and metrics |
| `/proof` | GET | Cryptographic proof of autonomy |

### Example `/status` Response
```json
{
  "agent": "PixelOracle",
  "version": "1.0.0",
  "status": "idle",
  "uptime": "2d 5h 30m",
  "metrics": {
    "cycleCount": 52,
    "totalMinted": 15,
    "lastCycleTime": "2024-01-15T10:30:00.000Z",
    "nextCycleIn": "45m 30s"
  },
  "lastMint": {
    "tokenId": 14,
    "txHash": "0x...",
    "basescanUrl": "https://basescan.org/tx/0x..."
  },
  "wallet": {
    "address": "0x...",
    "balance": "0.045 ETH"
  },
  "contract": "0x09ED29b4b822a41bf14B2efE8C54bA753A35d5B6",
  "network": "Base Mainnet"
}
```

## 🔐 Security Model

- **Private Key**: Environment variable only, never logged
- **API Keys**: All credentials via env vars
- **No Admin Functions**: Agent only mints, cannot modify contract
- **Balance Checks**: Prevents operations when low on gas

## 🌐 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      RENDER.COM                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              PixelOracle Container                   │   │
│  │  - Node.js Runtime                                   │   │
│  │  - HTTP Server (port 10000)                         │   │
│  │  - Autonomous Loop                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │   OpenAI    │    │   Pinata    │    │    Base     │
   │   API       │    │   IPFS      │    │  Blockchain │
   └─────────────┘    └─────────────┘    └─────────────┘
          │                                      │
          ▼                                      ▼
   ┌─────────────┐                       ┌─────────────┐
   │ Farcaster   │                       │   OpenSea   │
   │ (Neynar)    │                       │   (View)    │
   └─────────────┘                       └─────────────┘
          │
          ▼
   ┌─────────────┐
   │  X/Twitter  │
   └─────────────┘
```

## 🤖 OpenClaw Integration

PixelOracle can be controlled via the OpenClaw personal AI assistant framework:

### Skill Commands
- `check pixeloracle status` - View agent metrics
- `trigger pixeloracle to create art` - Manual creation
- `show pixeloracle wallet balance` - Check ETH balance

### Configuration
See `~/.openclaw/workspace/skills/pixeloracle/SKILL.md` for skill definition.

## 📊 On-Chain Proof of Autonomy

The agent provides verifiable proof of autonomous operation:

1. **Regular Minting Pattern**: Consistent intervals visible on BaseScan
2. **Heartbeat Transactions**: Periodic 0-value txs with "PixelOracle heartbeat" data
3. **Unique Artwork**: Each piece has AI-generated metadata proving non-human origin
4. **Contract Events**: All mints emit `ArtworkCreated` events with timestamps

### Verification Links
- **Contract**: [BaseScan](https://basescan.org/address/0x09ED29b4b822a41bf14B2efE8C54bA753A35d5B6)
- **Collection**: [OpenSea](https://opensea.io/collection/pixeloracle)

## 🛠️ Development

### Local Setup
```bash
npm install
cp .env.example .env  # Add your API keys
npm run dev           # Single creation cycle
npm run auto          # Autonomous mode
```

### Environment Variables
| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Wallet private key (with ETH on Base) |
| `OPENAI_API_KEY` | OpenAI API key (GPT-4 + DALL-E 3) |
| `PINATA_API_KEY` | Pinata API key for IPFS |
| `PINATA_SECRET_KEY` | Pinata secret |
| `NEYNAR_API_KEY` | Neynar API for Farcaster |
| `FARCASTER_SIGNER_UUID` | Farcaster signer |
| `TWITTER_*` | Twitter API v2 credentials |

## 📝 License

MIT License - See LICENSE file.

---

*PixelOracle: Where AI creativity meets blockchain permanence.*
