require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const { getSubscriptions, getTotalMonthly, owsPolicy, updatePolicy, resetSubscriptions } = require('./subscriptions');
const { analyzeSubscriptions, approveAction, rejectAction, getHistory, getStats, resetAll: agentReset } = require('./agent');
const app = express();
app.use(express.json());

const fs = require('fs');
const path = require('path');

app.get('/', (_req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(htmlPath)) return res.sendFile(htmlPath);
  res.send('<h1>SubGuard AI</h1><p>public/index.html not found</p>');
});

app.get('/api/subscriptions', (_req, res) => res.json({
  subscriptions: getSubscriptions(), total: getTotalMonthly(),
  policy: owsPolicy, wallet: process.env.OWS_WALLET_ADDRESS || '0xfeA48a13fC4785B253D0445C6380B86B8BE89546'
}));
app.post('/api/policy', (req, res) => res.json(updatePolicy(req.body)));
app.post('/api/analyze', (_req, res) => res.json(analyzeSubscriptions()));
app.post('/api/approve/:id', (req, res) => res.json(approveAction(req.params.id)));
app.post('/api/reject/:id', (req, res) => res.json(rejectAction(req.params.id)));
app.get('/api/history', (_req, res) => res.json(getHistory()));
app.get('/api/stats', (_req, res) => res.json(getStats()));
app.post('/api/reset', (_req, res) => { resetSubscriptions(); agentReset(); res.json({ ok: true }); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('SubGuard AI at http://localhost:' + PORT);
  console.log('OWS Wallet: ' + (process.env.OWS_WALLET_ADDRESS || 'not set'));
});
