import { keccak256, toBytes, formatEther } from "viem";
import {
  config,
  chain,
  publicClient,
  walletClient,
  account,
  pixelOracleABI,
} from "../config.js";

// ============================================
// Get Contract Instance
// ============================================

function getContractAddress(): `0x${string}` {
  if (!config.contractAddress) {
    throw new Error(
      "❌ NFT_CONTRACT_ADDRESS not set. Deploy the contract first!"
    );
  }
  return config.contractAddress;
}

// ============================================
// Read Functions
// ============================================

export async function getTotalMinted(): Promise<bigint> {
  const result = await publicClient.readContract({
    address: getContractAddress(),
    abi: pixelOracleABI,
    functionName: "totalSupply",
  });
  return result as bigint;
}

export async function getContractOwner(): Promise<string> {
  const result = await publicClient.readContract({
    address: getContractAddress(),
    abi: pixelOracleABI,
    functionName: "owner",
  });
  return result as string;
}

export async function getWalletBalance(): Promise<string> {
  const balance = await publicClient.getBalance({
    address: account.address,
  });
  return formatEther(balance);
}

// ============================================
// Write Functions
// ============================================

export async function mintArtwork(
  metadataUri: string,
  prompt: string,
  theme: string = "autonomous"
): Promise<{ tokenId: bigint; txHash: string }> {
  console.log("🔗 Minting NFT on Base...");

  // Create hash of the prompt for on-chain storage
  const promptHash = keccak256(toBytes(prompt));

  // Get current token ID before minting
  const currentTotal = await getTotalMinted();
  const tokenId = currentTotal;

  // Execute mint transaction
  const hash = await walletClient.writeContract({
    account,
    chain,
    address: getContractAddress(),
    abi: pixelOracleABI,
    functionName: "mintArtwork",
    args: [account.address, metadataUri, promptHash, theme],
  });

  console.log(`📝 Transaction submitted: ${hash}`);

  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status === "success") {
    console.log(`✅ NFT minted successfully!`);
    console.log(`   Token ID: ${tokenId}`);
    console.log(`   Tx Hash: ${hash}`);
  } else {
    throw new Error("Transaction failed");
  }

  return { tokenId, txHash: hash };
}

// ============================================
// Utility Functions
// ============================================

export function getBaseScanUrl(txHash: string): string {
  const baseUrl =
    config.network === "base"
      ? "https://basescan.org"
      : "https://sepolia.basescan.org";
  return `${baseUrl}/tx/${txHash}`;
}

export function getOpenSeaUrl(tokenId: bigint): string {
  if (config.network === "base") {
    return `https://opensea.io/assets/base/${getContractAddress()}/${tokenId}`;
  }
  // Testnet - OpenSea testnets
  return `https://testnets.opensea.io/assets/base-sepolia/${getContractAddress()}/${tokenId}`;
}

export async function checkBalance(): Promise<boolean> {
  const balance = await getWalletBalance();
  const balanceNum = parseFloat(balance);
  
  // Base has very low gas fees, ~0.00001-0.00003 ETH per tx
  if (balanceNum < 0.00003) {
    console.warn(`⚠️ Low balance: ${balance} ETH`);
    console.warn("   Top up your wallet to continue minting!");
    return false;
  }
  
  console.log(`💰 Wallet balance: ${balance} ETH`);
  return true;
}
