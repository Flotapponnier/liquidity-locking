#!/usr/bin/env node

import { fetchTokenSecurity, calculateSecurityScore } from './security.js';
import { printScanSummary } from './logger.js';

const DEFAULT_BLOCKCHAIN = process.env.DEFAULT_BLOCKCHAIN || 'solana:solana';
const MAX_CONCURRENT = 5;

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('\n❌ Usage: node src/scan.js <address1> <address2> <address3> ...\n');
  console.error('Example:');
  console.error('  node src/scan.js ADDR1 ADDR2 ADDR3\n');
  process.exit(1);
}

async function scanToken(address) {
  try {
    const secData = await fetchTokenSecurity(address, DEFAULT_BLOCKCHAIN);
    const scoreData = calculateSecurityScore(secData);
    return { address, score: scoreData.score, secData, error: null };
  } catch (error) {
    return { address, score: 0, secData: {}, error: error.message };
  }
}

async function main() {
  console.log(`\n⏳ Scanning ${args.length} token(s)...\n`);

  const results = [];

  // Process in batches of MAX_CONCURRENT
  for (let i = 0; i < args.length; i += MAX_CONCURRENT) {
    const batch = args.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(batch.map(scanToken));
    results.push(...batchResults);
  }

  // Filter out errors for display
  const successResults = results.filter(r => !r.error);
  const errorResults = results.filter(r => r.error);

  if (successResults.length > 0) {
    printScanSummary(successResults);
  }

  if (errorResults.length > 0) {
    console.log('❌ Failed to fetch:');
    errorResults.forEach(({ address, error }) => {
      console.log(`   ${address}: ${error}`);
    });
    console.log('');
  }
}

main();
