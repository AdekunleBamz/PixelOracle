import { config } from "../config.js";

const PINATA_API_URL = "https://api.pinata.cloud";

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  animation_url?: string;
}

// ============================================
// Upload Image to IPFS
// ============================================

export async function uploadImageToIPFS(
  imageBuffer: Buffer,
  fileName: string
): Promise<string> {
  console.log("📤 Uploading image to IPFS via Pinata...");

  const formData = new FormData();
  const uint8Array = new Uint8Array(imageBuffer);
  const blob = new Blob([uint8Array], { type: "image/png" });
  formData.append("file", blob, fileName);

  const metadata = JSON.stringify({
    name: fileName,
    keyvalues: {
      project: "PixelOracle",
      type: "artwork",
    },
  });
  formData.append("pinataMetadata", metadata);

  const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
    method: "POST",
    headers: {
      pinata_api_key: config.pinataApiKey,
      pinata_secret_api_key: config.pinataSecretKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinata upload failed: ${error}`);
  }

  const data: PinataResponse = await response.json();
  const ipfsUrl = `ipfs://${data.IpfsHash}`;
  
  console.log(`✅ Image uploaded: ${ipfsUrl}`);
  return ipfsUrl;
}

// ============================================
// Upload Metadata to IPFS
// ============================================

export async function uploadMetadataToIPFS(
  metadata: NFTMetadata,
  fileName: string
): Promise<string> {
  console.log("📤 Uploading metadata to IPFS...");

  const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: config.pinataApiKey,
      pinata_secret_api_key: config.pinataSecretKey,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: fileName,
        keyvalues: {
          project: "PixelOracle",
          type: "metadata",
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinata metadata upload failed: ${error}`);
  }

  const data: PinataResponse = await response.json();
  const ipfsUrl = `ipfs://${data.IpfsHash}`;
  
  console.log(`✅ Metadata uploaded: ${ipfsUrl}`);
  return ipfsUrl;
}

// ============================================
// Create Full NFT Metadata
// ============================================

export async function createAndUploadNFTMetadata(
  imageBuffer: Buffer,
  title: string,
  description: string,
  theme: string,
  tokenId: number
): Promise<{ metadataUri: string; imageUri: string }> {
  // Upload image first
  const imageUri = await uploadImageToIPFS(
    imageBuffer,
    `pixeloracle-${tokenId}.png`
  );

  // Create metadata
  const metadata: NFTMetadata = {
    name: title,
    description: `${description}\n\n🔮 Created autonomously by PixelOracle - an AI artist living on Base.`,
    image: imageUri,
    external_url: "https://pixeloracle.art", // Update with your actual URL
    attributes: [
      {
        trait_type: "Theme",
        value: theme,
      },
      {
        trait_type: "Artist",
        value: "PixelOracle AI",
      },
      {
        trait_type: "Generation",
        value: tokenId,
      },
      {
        trait_type: "Chain",
        value: "Base",
      },
      {
        trait_type: "Created",
        value: new Date().toISOString().split("T")[0],
      },
    ],
  };

  // Upload metadata
  const metadataUri = await uploadMetadataToIPFS(
    metadata,
    `pixeloracle-metadata-${tokenId}.json`
  );

  return { metadataUri, imageUri };
}

// ============================================
// Helper: Convert IPFS to HTTP gateway URL
// ============================================

export function ipfsToHttp(ipfsUri: string): string {
  if (ipfsUri.startsWith("ipfs://")) {
    return ipfsUri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  }
  return ipfsUri;
}
