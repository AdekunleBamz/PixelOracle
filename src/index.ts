// ============================================
// 🔮 PixelOracle - Entry Point
// ============================================

export * from "./config.js";
export * from "./services/artGenerator.js";
export * from "./services/blockchain.js";
export * from "./services/ipfsUploader.js";
export * from "./services/social.js";

// Re-export for programmatic usage
import { config } from "./config.js";

console.log(`
🔮 PixelOracle SDK loaded
   Network: ${config.network}
   
To run the autonomous agent:
   npm run agent

To run a single creation:
   npm run agent -- --once
`);
