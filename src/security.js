import https from 'https';

const MOBULA_API_KEY = process.env.MOBULA_API_KEY;
const DEFAULT_BLOCKCHAIN = process.env.DEFAULT_BLOCKCHAIN || 'solana:solana';

if (!MOBULA_API_KEY) {
  console.error('\n❌ ERROR: MOBULA_API_KEY environment variable is not set.\n');
  console.error('Usage: export MOBULA_API_KEY=your_key_here\n');
  process.exit(1);
}

/**
 * Fetch token security data from Mobula API
 */
export async function fetchTokenSecurity(address, blockchain = DEFAULT_BLOCKCHAIN) {
  return new Promise((resolve, reject) => {
    const url = `https://api.mobula.io/api/2/token/security?blockchain=${blockchain}&address=${address}`;

    const options = {
      headers: {
        'Authorization': MOBULA_API_KEY
      }
    };

    https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API returned ${res.statusCode}: ${data}`));
          return;
        }

        try {
          const json = JSON.parse(data);
          resolve(json.data || json);
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', (e) => {
      reject(e);
    });
  });
}

/**
 * Calculate security score (0-10) based on Mobula security data
 */
export function calculateSecurityScore(sec) {
  let score = 10;
  const flags = [];

  // 🔴 CRITICAL (-5, -4)
  if (sec.isHoneypot) {
    score -= 5;
    flags.push('🔴 HONEYPOT DETECTED');
  }
  if (sec.balanceMutable) {
    score -= 4;
    flags.push('🔴 Balance mutable');
  }
  if (sec.selfDestruct) {
    score -= 4;
    flags.push('🔴 Self-destruct present');
  }

  // 🟠 HIGH RISK (-2)
  if (sec.transferPausable) {
    score -= 2;
    flags.push('🟠 Transfers pausable');
  }
  if (sec.modifyableTax) {
    score -= 2;
    flags.push('🟠 Tax modifiable');
  }
  if (sec.isNotOpenSource) {
    score -= 2;
    flags.push('🟠 Not open source');
  }
  if (sec.isMintable) {
    score -= 2;
    flags.push('🟠 Mintable');
  }
  if (sec.isFreezable) {
    score -= 2;
    flags.push('🟠 Freezable');
  }

  // 🟡 MEDIUM RISK (-1)
  if (sec.isBlacklisted) {
    score -= 1;
    flags.push('🟡 Blacklist exists');
  }
  if (sec.isWhitelisted) {
    score -= 1;
    flags.push('🟡 Whitelist exists');
  }
  if (!sec.renounced) {
    score -= 1;
    flags.push('🟡 Ownership not renounced');
  }
  if ((sec.sellFeePercentage || 0) > 10) {
    score -= 1;
    flags.push(`🟡 Sell tax ${sec.sellFeePercentage}%`);
  }

  // ✅ BONUSES
  const lockedPct = parseFloat(sec.locked || '0');
  const burnPct = (sec.liquidityBurnPercentage || 0) / 100;

  const lockBonus = lockedPct * 2;  // max +2
  const burnBonus = burnPct;        // max +1

  score += lockBonus + burnBonus;

  // Clamp to [0, 10]
  score = Math.max(0, Math.min(10, score));

  return {
    score: parseFloat(score.toFixed(1)),
    flags,
    lockBonus: parseFloat(lockBonus.toFixed(1)),
    burnBonus: parseFloat(burnBonus.toFixed(1))
  };
}

/**
 * Get verdict emoji and label based on score
 */
export function getVerdict(score) {
  if (score >= 8) return { emoji: '🟢', label: 'SAFE' };
  if (score >= 5) return { emoji: '🟡', label: 'CAUTION' };
  if (score >= 2) return { emoji: '🟠', label: 'RISKY' };
  return { emoji: '🔴', label: 'DANGER' };
}
