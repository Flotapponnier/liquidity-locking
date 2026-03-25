#!/usr/bin/env node

import { fetchTokenSecurity, calculateSecurityScore } from './security.js';
import { printWatchHeader, printWatchUpdate } from './logger.js';

const DEFAULT_BLOCKCHAIN = process.env.DEFAULT_BLOCKCHAIN || 'solana:solana';
const SCAN_INTERVAL_MS = parseInt(process.env.SCAN_INTERVAL_MS) || 30000;

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('\n❌ Usage: node src/watch.js <token_address> [blockchain]\n');
  console.error('Examples:');
  console.error('  node src/watch.js FMhPkAX5XLA2n6KvBqUTML5JLCdHZ7v2H4BfAbUucSuz');
  console.error('  SCAN_INTERVAL_MS=10000 node src/watch.js TOKEN_ADDRESS\n');
  process.exit(1);
}

const address = args[0];
const blockchain = args[1] || DEFAULT_BLOCKCHAIN;

let lastScore = null;
let lastLocked = null;

async function poll() {
  try {
    const secData = await fetchTokenSecurity(address, blockchain);
    const scoreData = calculateSecurityScore(secData);

    const time = new Date().toLocaleTimeString();
    const score = scoreData.score;
    const locked = parseFloat(secData.locked || 0);

    let alert = null;

    // Detect alerts
    if (secData.isHoneypot && (!lastScore || lastScore > 2)) {
      alert = '🚨 HONEYPOT DETECTED';
    } else if (lastLocked !== null && locked < lastLocked - 0.05) {
      const drop = ((lastLocked - locked) * 100).toFixed(0);
      alert = `⚠️  LOCK DROPPED ${drop}%`;
    } else if (lastScore !== null && score < lastScore - 2) {
      alert = `⚠️  SCORE DROPPED ${(lastScore - score).toFixed(1)} points`;
    }

    printWatchUpdate(time, score, locked, alert);

    lastScore = score;
    lastLocked = locked;
  } catch (error) {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ❌ Error: ${error.message}`);
  }
}

async function main() {
  printWatchHeader(address, blockchain);

  // Initial poll
  await poll();

  // Set up interval
  setInterval(poll, SCAN_INTERVAL_MS);
}

main();
