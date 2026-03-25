# Token Shield

Open-source CLI tool to analyze token security using the [Mobula API](https://developer.mobula.io).

Detects honeypots, rug pulls, liquidity locks, and other risks for Solana & EVM tokens.

## Features

- **Real-time security scoring** (0-10) based on 20+ risk factors
- **Liquidity lock monitoring** — detect when LP tokens are removed
- **Multi-chain support** — Solana, Ethereum, BSC, and all EVM chains
- **3 modes:**
  - `check` — analyze one token
  - `scan` — batch analyze multiple tokens
  - `watch` — monitor a token in real-time for rug pull signals

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/token-shield.git
cd token-shield
npm install
```

## Setup

Get your Mobula API key at [developer.mobula.io](https://developer.mobula.io).

```bash
export MOBULA_API_KEY=your_key_here
```

Optional environment variables:

```bash
export DEFAULT_BLOCKCHAIN=solana:solana  # default blockchain
export SCAN_INTERVAL_MS=30000            # watch mode interval (ms)
```

## Usage

### Mode 1: Check a single token

```bash
npm run check FMhPkAX5XLA2n6KvBqUTML5JLCdHZ7v2H4BfAbUucSuz
```

Or specify blockchain:

```bash
npm run check 0xe538905cf8410324e03a5a23c1c177a474d59b2b evm:1
```

**Output:**

```
══════════════════════════════════════════════════════════════
 TOKEN SECURITY REPORT
 FMhPkAX5X...cSuz  |  solana:solana
══════════════════════════════════════════════════════════════

🔒 LIQUIDITY LOCK
   Locked:          85.0%  ✅
   LP Burned:       42.3%  ✅
   Supply Burned:   15.2%
   Low Liquidity:   No     ✅

🚨 CONTRACT FLAGS
   Honeypot:        ✅ NO   ✅
   Balance Mutable: ✅ NO   ✅
   Self Destruct:   ✅ NO   ✅
   ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 SCORE BREAKDOWN
   Base:             10.0
   Flags deducted:    0.0
   Lock bonus:       +1.7
   Burn bonus:       +0.4
   ─────────────────────
   FINAL: 10.0/10
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 VERDICT: SAFE  (10.0/10)
══════════════════════════════════════════════════════════════
```

### Mode 2: Scan multiple tokens

```bash
npm run scan TOKEN1 TOKEN2 TOKEN3
```

**Output:**

```
TOKEN SECURITY SCAN — 3 tokens
──────────────────────────────────────────────────────────────
  TOKEN              SCORE   LOCKED   HONEYPOT   MINTABLE   VERDICT
──────────────────────────────────────────────────────────────
  FMhPkAX5X...cSuz   9.7/10  85%      ✅ NO      ✅ NO      🟢 SAFE
  9BB6NFEcj...pump   3.2/10  0%       ✅ NO      🔴 YES     🟠 RISKY
  EKpQGSJtj...anSq   0.5/10  10%      🔴 YES     🔴 YES     🔴 DANGER
──────────────────────────────────────────────────────────────
```

### Mode 3: Watch for rug pulls

```bash
npm run watch FMhPkAX5XLA2n6KvBqUTML5JLCdHZ7v2H4BfAbUucSuz
```

Monitor a token every 30 seconds (configurable). Alerts when:

- Honeypot flag becomes true
- Liquidity lock % drops
- Security score drops by >2 points

**Output:**

```
🔍 WATCHING TOKEN (polling every 30s)
   FMhPkAX5XLA2n6KvBqUTML5JLCdHZ7v2H4BfAbUucSuz
   solana:solana

[14:22:00] Score: 9.7/10 🟢  locked: 85.0%  — stable
[14:22:30] Score: 9.7/10 🟢  locked: 85.0%  — stable
[14:23:00] Score: 4.1/10 🟠  locked: 31.0%  — ⚠️  LOCK DROPPED 54%
[14:23:30] Score: 1.2/10 🔴  locked: 2.0%   — 🚨 HONEYPOT DETECTED
```

## Security Score Algorithm

Starts at **10**, deducts for risks, adds for locks:

### Deductions

| Risk                 | Points |
|----------------------|--------|
| 🔴 Honeypot          | -5     |
| 🔴 Balance Mutable   | -4     |
| 🔴 Self Destruct     | -4     |
| 🟠 Transfer Pausable | -2     |
| 🟠 Tax Modifiable    | -2     |
| 🟠 Not Open Source   | -2     |
| 🟠 Mintable          | -2     |
| 🟠 Freezable         | -2     |
| 🟡 Blacklist         | -1     |
| 🟡 Whitelist         | -1     |
| 🟡 Not Renounced     | -1     |
| 🟡 Sell Tax >10%     | -1     |

### Bonuses

- **Liquidity locked:** +0 to +2 (e.g., 85% locked = +1.7)
- **LP burned:** +0 to +1 (e.g., 42% burned = +0.42)

Final score is clamped to **0-10**.

### Verdict Ranges

- **8-10** → 🟢 SAFE
- **5-7** → 🟡 CAUTION
- **2-4** → 🟠 RISKY
- **0-1** → 🔴 DANGER

## Supported Blockchains

Use the `blockchain` parameter:

- `solana:solana` — Solana
- `evm:1` or `ethereum` — Ethereum
- `evm:56` or `bsc` — Binance Smart Chain
- `evm:137` — Polygon
- `evm:8453` — Base
- And all other EVM chains

See [Mobula docs](https://developer.mobula.io) for full list.

## API Reference

This tool uses the [Mobula Token Security API](https://developer.mobula.io/reference/gettokensecurity):

```
GET https://api.mobula.io/api/2/token/security
  ?blockchain=<blockchain>
  &address=<token_address>
  Header: Authorization: YOUR_API_KEY
```

## License

MIT

## Contributing

PRs welcome! Please open an issue first to discuss major changes.

---

Built with [Mobula API](https://mobula.io) — the fastest way to access on-chain data.
