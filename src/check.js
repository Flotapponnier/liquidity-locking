#!/usr/bin/env node

import { fetchTokenSecurity, calculateSecurityScore } from './security.js';
import { printSecurityReport } from './logger.js';

const DEFAULT_BLOCKCHAIN = process.env.DEFAULT_BLOCKCHAIN || 'solana:solana';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('\n❌ Usage: node src/check.js <token_address> [blockchain]\n');
  console.error('Examples:');
  console.error('  node src/check.js FMhPkAX5XLA2n6KvBqUTML5JLCdHZ7v2H4BfAbUucSuz');
  console.error('  node src/check.js 0xe538905cf8410324e03a5a23c1c177a474d59b2b evm:1\n');
  process.exit(1);
}

const address = args[0];
const blockchain = args[1] || DEFAULT_BLOCKCHAIN;

async function main() {
  try {
    console.log(`\n⏳ Fetching security data for ${address}...`);

    const secData = await fetchTokenSecurity(address, blockchain);
    const scoreData = calculateSecurityScore(secData);

    printSecurityReport(address, blockchain, secData, scoreData);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();
