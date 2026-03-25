import chalk from 'chalk';

const BAR = '═'.repeat(62);
const LINE = '─'.repeat(62);

/**
 * Format percentage display
 */
function formatPct(value) {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? 'N/A' : `${(num * 100).toFixed(1)}%`;
  }
  return `${value.toFixed(1)}%`;
}

/**
 * Format boolean flag with emoji
 */
function formatFlag(value, inverse = false) {
  if (value === null || value === undefined) return chalk.gray('N/A');
  const good = inverse ? value : !value;
  if (good) {
    return chalk.green(`✅ ${value ? 'YES' : 'NO'}`);
  }
  return chalk.red(`🔴 ${value ? 'YES' : 'NO'}`);
}

/**
 * Print full security report for one token
 */
export function printSecurityReport(address, blockchain, secData, scoreData) {
  const { score, flags, lockBonus, burnBonus } = scoreData;
  const { emoji, label } = getVerdict(score);

  console.log('\n' + BAR);
  console.log(chalk.bold(' TOKEN SECURITY REPORT'));
  console.log(` ${address.substring(0, 12)}...${address.slice(-6)}  |  ${blockchain}`);
  console.log(BAR + '\n');

  // 🔒 LIQUIDITY LOCK
  console.log(chalk.bold('🔒 LIQUIDITY LOCK'));
  const lockedPct = parseFloat(secData.locked || 0) * 100;
  console.log(`   Locked:          ${formatPct(lockedPct)}  ${lockedPct >= 80 ? chalk.green('✅') : lockedPct >= 50 ? chalk.yellow('⚠️') : chalk.red('❌')}`);
  console.log(`   LP Burned:       ${formatPct(secData.liquidityBurnPercentage)}  ${(secData.liquidityBurnPercentage || 0) >= 30 ? chalk.green('✅') : chalk.gray('—')}`);
  console.log(`   Supply Burned:   ${formatPct(parseFloat(secData.burnRate || 0) * 100)}`);
  console.log(`   Low Liquidity:   ${secData.lowLiquidity ? chalk.red('Yes ❌') : chalk.green('No  ✅')}\n`);

  // 🚨 CONTRACT FLAGS
  console.log(chalk.bold('🚨 CONTRACT FLAGS'));
  console.log(`   Honeypot:        ${formatFlag(secData.isHoneypot)}`);
  console.log(`   Balance Mutable: ${formatFlag(secData.balanceMutable)}`);
  console.log(`   Self Destruct:   ${formatFlag(secData.selfDestruct)}`);
  console.log(`   Transfer Pause:  ${formatFlag(secData.transferPausable)}`);
  console.log(`   Tax Modifiable:  ${formatFlag(secData.modifyableTax)}`);
  console.log(`   Mintable:        ${formatFlag(secData.isMintable)}`);
  console.log(`   Freezable:       ${formatFlag(secData.isFreezable)}`);
  console.log(`   Open Source:     ${formatFlag(secData.isNotOpenSource, true)}`);
  console.log(`   Renounced:       ${formatFlag(!secData.renounced, true)}`);
  console.log(`   Blacklist:       ${formatFlag(secData.isBlacklisted)}\n`);

  // 💸 FEES & LIMITS
  console.log(chalk.bold('💸 FEES & LIMITS'));
  console.log(`   Buy Tax:         ${secData.buyFeePercentage ?? 'N/A'}%`);
  console.log(`   Sell Tax:        ${secData.sellFeePercentage ?? 'N/A'}%`);
  console.log(`   Max Wallet:      ${secData.maxWalletAmountRaw || 'none'}`);
  console.log(`   Max Sell:        ${secData.maxSellAmountRaw || 'none'}\n`);

  // 👥 HOLDER DISTRIBUTION
  console.log(chalk.bold('👥 HOLDER DISTRIBUTION'));
  const t10 = secData.top10HoldingsPercentage;
  const t50 = secData.top50HoldingsPercentage;
  const t100 = secData.top100HoldingsPercentage;
  console.log(`   Top 10:  ${t10 !== null && t10 !== undefined ? t10.toFixed(1) + '%' : 'N/A'}  ${t10 < 30 ? '🟢' : t10 < 50 ? '🟡' : '🔴'}`);
  console.log(`   Top 50:  ${t50 !== null && t50 !== undefined ? t50.toFixed(1) + '%' : 'N/A'}  ${t50 < 55 ? '🟢' : t50 < 75 ? '🟡' : '🔴'}`);
  console.log(`   Top 100: ${t100 !== null && t100 !== undefined ? t100.toFixed(1) + '%' : 'N/A'}  ${t100 < 70 ? '🟢' : t100 < 85 ? '🟡' : '🔴'}\n`);

  // 🤖 STATIC ANALYSIS (EVM only)
  if (secData.staticAnalysisStatus) {
    console.log(chalk.bold('🤖 STATIC ANALYSIS'));
    console.log(`   Status: ${secData.staticAnalysisStatus} ${secData.staticAnalysisDate ? `(${secData.staticAnalysisDate.split('T')[0]})` : ''}`);
    console.log(`   Pro trader vol: ${secData.proTraderVolume24hPercentage?.toFixed(1) || 'N/A'}%\n`);
  }

  // 📐 SCORE BREAKDOWN
  console.log(LINE);
  console.log(chalk.bold('📐 SCORE BREAKDOWN'));
  console.log(`   Base:             10.0`);
  const deductions = flags.length > 0 ? 10 - score + lockBonus + burnBonus : 0;
  console.log(`   Flags deducted:   -${deductions.toFixed(1)}`);
  console.log(`   Lock bonus:       +${lockBonus}  (locked ${(lockedPct).toFixed(0)}%)`);
  console.log(`   Burn bonus:       +${burnBonus}  (LP burned ${(secData.liquidityBurnPercentage || 0).toFixed(0)}%)`);
  console.log(`   ${'─'.repeat(25)}`);
  console.log(chalk.bold(`   FINAL: ${score}/10`));
  console.log(LINE);

  // 🟢 VERDICT
  console.log(chalk.bold(`${emoji} VERDICT: ${label}  (${score}/10)`));
  if (flags.length > 0) {
    console.log('   ' + flags.join('\n   '));
  } else {
    console.log('   No red flags detected');
    if (lockedPct >= 80) {
      console.log('   Liquidity is locked and partially burned');
    }
  }
  console.log(BAR + '\n');
}

/**
 * Print summary table for scan mode
 */
export function printScanSummary(results) {
  console.log(`\n${chalk.bold('TOKEN SECURITY SCAN')} — ${results.length} tokens`);
  console.log(LINE);
  console.log(chalk.bold('  TOKEN              SCORE   LOCKED   HONEYPOT   MINTABLE   VERDICT'));
  console.log(LINE);

  for (const { address, score, secData } of results) {
    const short = `${address.substring(0, 9)}...${address.slice(-4)}`;
    const { emoji, label } = getVerdict(score);
    const locked = (parseFloat(secData.locked || 0) * 100).toFixed(0) + '%';
    const honeypot = secData.isHoneypot ? '🔴 YES' : '✅ NO';
    const mintable = secData.isMintable ? '🔴 YES' : '✅ NO';

    console.log(`  ${short.padEnd(18)} ${score.toFixed(1).padStart(4)}/10  ${locked.padEnd(7)} ${honeypot.padEnd(10)} ${mintable.padEnd(10)} ${emoji} ${label}`);
  }

  console.log(LINE + '\n');
}

/**
 * Print watch mode header
 */
export function printWatchHeader(address, blockchain) {
  console.log('\n' + chalk.bold('🔍 WATCHING TOKEN') + ` (polling every ${(parseInt(process.env.SCAN_INTERVAL_MS) || 30000) / 1000}s)`);
  console.log(`   ${address}`);
  console.log(`   ${blockchain}\n`);
  console.log('Press Ctrl+C to stop\n');
}

/**
 * Print watch mode update
 */
export function printWatchUpdate(time, score, locked, alert = null) {
  const { emoji, label } = getVerdict(score);
  const lockedPct = (parseFloat(locked || 0) * 100).toFixed(1);

  let line = `[${time}] Score: ${score}/10 ${emoji}  locked: ${lockedPct}%`;

  if (alert) {
    line += chalk.red(`  — ${alert}`);
  } else {
    line += chalk.gray('  — stable');
  }

  console.log(line);
}

/**
 * Get verdict based on score
 */
function getVerdict(score) {
  if (score >= 8) return { emoji: '🟢', label: 'SAFE' };
  if (score >= 5) return { emoji: '🟡', label: 'CAUTION' };
  if (score >= 2) return { emoji: '🟠', label: 'RISKY' };
  return { emoji: '🔴', label: 'DANGER' };
}
