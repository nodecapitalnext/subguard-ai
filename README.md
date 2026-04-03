# SubGuard AI — OWS Powered Subscription Manager

> AI agent that manages your Web3 subscriptions without ever touching your private key.

## What it does

SubGuard AI analyzes your on-chain subscriptions and automatically:
- Cancels low-usage subscriptions (usage score below threshold)
- Approves or blocks payments based on OWS policy rules
- Enforces monthly budget limits
- Signs all transactions via OWS — private key never exposed to AI

## How OWS is used

The AI agent decides **WHAT** to do. OWS decides **IF** it can do it.

```
AI Agent → "cancel MusicDAO" → OWS Policy Check → Sign & Execute
AI Agent → "pay $19.99 GameFi" → OWS Policy Check → BLOCKED (over limit)
```

OWS wallet: `0xfeA48a13fC4785B253D0445C6380B86B8BE89546`

## Setup

```bash
# Install dependencies
npm install

# Configure
cp .env.example .env
# Add your OWS_API_KEY and OWS_WALLET_ADDRESS

# Run
node index.js
```

Open http://localhost:3000

## OWS Policy Rules (editable in UI)

| Rule | Default |
|------|---------|
| Monthly Budget | $40 USDC |
| Auto-cancel if usage below | 30% |
| Require approval above | $15 USDC |
| Private Key Access | Never |

## Demo Flow

1. Open http://localhost:3000
2. Review subscriptions and usage scores
3. Adjust OWS policy rules if needed
4. Click **Run AI Agent Analysis**
5. Watch OWS sign/block each transaction
6. Click **Reset Demo** to start over

## Tech Stack

- Node.js + Express
- OWS CLI (`ows sign` for transaction signing)
- Vanilla JS frontend
- No private key ever stored or transmitted

## Hackathon

Built for **OWS Hackathon 2026** — Track: AI Agent Security
