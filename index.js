require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const { getSubscriptions, getTotalMonthly, owsPolicy, updatePolicy, resetSubscriptions } = require('./subscriptions');
const { analyzeSubscriptions } = require('./agent');
const app = express();
app.use(express.json());

// Serve UI
const fs = require('fs');
const path = require('path');
const PAGE = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');

app.get('/', (_req, res) => res.send(PAGE));
app.get('/api/subscriptions', (_req, res) => res.json({ subscriptions: getSubscriptions(), total: getTotalMonthly(), policy: owsPolicy, wallet: process.env.OWS_WALLET_ADDRESS || '0xfeA48a13fC4785B253D0445C6380B86B8BE89546' }));
app.post('/api/policy', (req, res) => res.json(updatePolicy(req.body)));
app.post('/api/analyze', (_req, res) => res.json(analyzeSubscriptions()));
app.post('/api/reset', (_req, res) => { resetSubscriptions(); res.json({ ok: true }); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('SubGuard AI running at http://localhost:' + PORT);
  console.log('OWS Wallet: ' + (process.env.OWS_WALLET_ADDRESS || 'not set'));
});
