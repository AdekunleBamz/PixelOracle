import * as dotenv from "dotenv";
import { createPublicClient, createWalletClient, http, type WalletClient, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

dotenv.config();

// ============================================
// Environment Validation
// ============================================

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string = ""): string {
  return process.env[key] || defaultValue;
}

// ============================================
// Configuration Export
// ============================================

export const config = {
  // Blockchain
  privateKey: requireEnv("PRIVATE_KEY") as `0x${string}`,
  contractAddress: optionalEnv("NFT_CONTRACT_ADDRESS") as `0x${string}`,
  network: optionalEnv("NETWORK", "baseSepolia") as "base" | "baseSepolia",

  // OpenAI
  openaiApiKey: requireEnv("OPENAI_API_KEY"),

  // Pinata (IPFS)
  pinataApiKey: requireEnv("PINATA_API_KEY"),
  pinataSecretKey: requireEnv("PINATA_SECRET_KEY"),

  // Farcaster (Neynar)
  neynarApiKey: optionalEnv("NEYNAR_API_KEY"),
  farcasterSignerUuid: optionalEnv("FARCASTER_SIGNER_UUID"),

  // Twitter/X
  twitterApiKey: optionalEnv("TWITTER_API_KEY"),
  twitterApiSecret: optionalEnv("TWITTER_API_SECRET"),
  twitterAccessToken: optionalEnv("TWITTER_ACCESS_TOKEN"),
  twitterAccessSecret: optionalEnv("TWITTER_ACCESS_SECRET"),

  // Agent Settings
  creationIntervalMinutes: parseInt(optionalEnv("CREATION_INTERVAL_MINUTES", "60")),
  artThemes: optionalEnv("ART_THEMES", "surreal,cyberpunk,abstract,cosmic,dreamscape").split(","),
};

// ============================================
// Chain Configuration
// ============================================

export const chain = config.network === "base" ? base : baseSepolia;

export const account = privateKeyToAccount(config.privateKey);

export const publicClient = createPublicClient({
  chain,
  transport: http(),
});

export const walletClient: WalletClient = createWalletClient({
  account,
  chain,
  transport: http(),
});

// ============================================
// Contract ABI (simplified for our needs)
// ============================================

export const pixelOracleABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "metadataURI", type: "string" },
      { name: "_promptHash", type: "bytes32" },
      { name: "theme", type: "string" },
    ],
    name: "mintArtwork",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "metadataURI", type: "string" },
    ],
    name: "mint",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentTokenId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // Events for listening
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

console.log("⚙️ Configuration loaded");
console.log(`   Network: ${config.network}`);
console.log(`   Wallet: ${account.address}`);
