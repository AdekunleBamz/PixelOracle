#!/usr/bin/env node
/**
 * 🔮 PixelOracle - OpenClaw Integration Script
 * 
 * This script allows OpenClaw to trigger PixelOracle actions.
 * Usage: node openclaw-action.mjs <action>
 * 
 * Actions:
 *   create   - Create a single artwork (mint + post)
 *   status   - Check wallet balance and total minted
 *   start    - Start autonomous mode
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectDir = __dirname;

function runCommand(command) {
  try {
    execSync(command, {
      cwd: projectDir,
      stdio: 'inherit',
      env: process.env
    });
  } catch (error) {
    console.error('Command failed:', error.message);
    process.exit(1);
  }
}

async function main() {
  const action = process.argv[2] || 'status';
  
  console.log(`\n🔮 PixelOracle - Action: ${action}\n`);
  
  switch (action) {
    case 'create':
      console.log('Creating new artwork...\n');
      runCommand('npm run agent -- --once');
      break;
      
    case 'status':
      console.log('Checking status...\n');
      runCommand('npx tsx scripts/status.ts');
      break;
      
    case 'start':
      console.log('Starting autonomous mode...\n');
      runCommand('npm run agent');
      break;
      
    default:
      console.log('Unknown action. Available: create, status, start');
      process.exit(1);
  }
}

main().catch(console.error);
