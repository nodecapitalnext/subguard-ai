require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const { getSubscriptions, getTotalMonthly, owsPolicy, updatePolicy, resetSubscriptions } = require('./subscriptions');
const { analyzeSubscriptions } = require('./agent');
const app = express();
app.use(express.json());

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SubGuard AI - OWS Powered</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:#080812;color:#e2e2f0;min-height:100vh}
    :root{--purple:#7c3aed;--pl:#a78bfa;--pd:#2d1b69;--green:#22c55e;--red:#ef4444;--yellow:#f59e0b;--card:#111127;--border:#1e1e42}
    header{background:linear-gradient(135deg,#0d0d2b,#1a0d3d);padding:20px 40px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
    .logo{display:flex;align-items:center;gap:12px}
    .logo-icon{width:40px;height:40px;background:linear-gradient(135deg,var(--purple),#4f46e5);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.3rem}
    .logo h1{font-size:1.2rem;color:#fff;font-weight:700}
    .logo p{font-size:0.75rem;color:#8b8bcc;margin-top:1px}
    .ows-pill{background:var(--pd);border:1px solid var(--purple);color:var(--pl);padding:6px 14px;border-radius:20px;font-size:0.75rem;font-weight:600}
    main{max-width:1000px;margin:0 auto;padding:28px 20px}
    .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px}
    .stat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;text-align:center;position:relative;overflow:hidden}
    .stat::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--purple),#4f46e5)}
    .stat .val{font-size:1.9rem;font-weight:700;color:var(--pl)}
    .stat .lbl{color:#6b6baa;font-size:0.8rem;margin-top:4px}
    .wallet-bar{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:28px;display:flex;align-items:center;gap:10px;font-size:0.82rem}
    .wallet-bar .dot{width:8px;height:8px;background:var(--green);border-radius:50%;flex-shrink:0}
    .wallet-bar code{color:var(--pl);font-size:0.78rem;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .key-safe{color:var(--green);font-weight:600;font-size:0.78rem}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px}
    .panel{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px}
    .panel-title{font-size:0.85rem;font-weight:600;color:var(--pl);margin-bottom:14px;text-transform:uppercase;letter-spacing:.05em}
    .policy-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)}
    .policy-row:last-child{border-bottom:none}
    .policy-row label{font-size:0.85rem;color:#aaa}
    .policy-row input{width:80px;background:#0d0d22;border:1px solid var(--border);color:#fff;padding:5px 8px;border-radius:6px;font-size:0.85rem;text-align:right}
    .policy-row input:focus{outline:none;border-color:var(--purple)}
    .btn-save{width:100%;margin-top:14px;padding:9px;background:var(--pd);border:1px solid var(--purple);color:var(--pl);border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer;transition:.2s}
    .btn-save:hover{background:var(--purple)}
    .sub-item{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)}
    .sub-item:last-child{border-bottom:none}
    .sub-item.inactive{opacity:.35}
    .sub-left .name{font-size:0.9rem;font-weight:600}
    .sub-left .meta{font-size:0.75rem;color:#6b6baa;margin-top:2px}
    .bar-wrap{width:70px;height:4px;background:#1e1e42;border-radius:2px;margin-top:5px}
    .bar-fill{height:100%;border-radius:2px}
    .sub-right{text-align:right}
    .sub-price{font-size:0.95rem;font-weight:700;color:var(--pl)}
    .sub-score{font-size:0.72rem;color:#6b6baa;margin-top:2px}
    .btn-run{width:100%;padding:15px;background:linear-gradient(135deg,var(--purple),#4f46e5);color:#fff;border:none;border-radius:12px;font-size:1rem;font-weight:700;cursor:pointer;margin-bottom:20px;transition:.2s}
    .btn-run:hover{opacity:.9}
    .btn-run:disabled{opacity:.4;cursor:not-allowed}
    .btn-reset{width:100%;padding:10px;background:transparent;border:1px solid var(--border);color:#6b6baa;border-radius:10px;font-size:0.85rem;cursor:pointer;margin-bottom:24px;transition:.2s}
    .btn-reset:hover{border-color:var(--pl);color:var(--pl)}
    .loader{text-align:center;padding:20px;color:#6b6baa;display:none;font-size:0.9rem}
    .loader span{display:inline-block;animation:pulse 1.2s infinite}
    @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
    #results{display:none}
    .result-panel{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;margin-bottom:16px}
    .insight-row{padding:7px 0;border-bottom:1px solid var(--border);font-size:0.88rem;color:#c4b5fd}
    .insight-row:last-child{border-bottom:none}
    .tx-item{padding:12px 14px;border-radius:10px;margin-bottom:8px;font-size:0.88rem}
    .tx-item.cancelled{background:#1a0808;border-left:3px solid var(--red)}
    .tx-item.paid{background:#081a08;border-left:3px solid var(--green)}
    .tx-item.blocked{background:#1a1a08;border-left:3px solid var(--yellow)}
    .tx-top{display:flex;align-items:center;gap:8px;margin-bottom:4px}
    .tx-name{font-weight:600}
    .ows-chip{background:#1a0d3d;border:1px solid var(--purple);color:var(--pl);padding:2px 7px;border-radius:4px;font-size:0.7rem}
    .tx-reason{color:#888;font-size:0.8rem}
    .tx-hash{font-family:monospace;font-size:0.72rem;color:#444;margin-top:3px;word-break:break-all}
    .saving-box{text-align:center;padding:18px;font-size:1.3rem;font-weight:700;color:var(--green)}
    .section-title{font-size:0.95rem;font-weight:600;color:var(--pl);margin-bottom:12px}
  </style>
</head>
<body>
<header>
  <div class="logo">
    <div class="logo-icon">🛡️</div>
    <div><h1>SubGuard AI</h1><p>AI-powered Web3 Subscription Manager</p></div>
  </div>
  <div class="ows-pill">⚡ Open Wallet Standard</div>
</header>
<main>
  <div class="grid-3">
    <div class="stat"><div class="val" id="s-total">-</div><div class="lbl">Monthly Spend (USDC)</div></div>
    <div class="stat"><div class="val" id="s-count">-</div><div class="lbl">Active Subscriptions</div></div>
    <div class="stat"><div class="val" id="s-budget">-</div><div class="lbl">OWS Budget Limit</div></div>
  </div>
  <div class="wallet-bar">
    <div class="dot"></div>
    <span style="color:#6b6baa">OWS Wallet:</span>
    <code id="wallet-addr">loading...</code>
    <span class="key-safe">🔒 Private key never exposed</span>
  </div>
  <div class="two-col">
    <div class="panel">
      <div class="panel-title">OWS Policy Rules</div>
      <div class="policy-row"><label>Monthly Budget (USDC)</label><input id="p-budget" type="number" value="40"></div>
      <div class="policy-row"><label>Cancel if usage below (%)</label><input id="p-cancel" type="number" value="30"></div>
      <div class="policy-row"><label>Approval required above ($)</label><input id="p-approval" type="number" value="15"></div>
      <div class="policy-row"><label>Private Key Access</label><span style="color:#22c55e;font-size:.85rem;font-weight:600">Never ✓</span></div>
      <button class="btn-save" onclick="savePolicy()">Save Policy</button>
    </div>
    <div class="panel">
      <div class="panel-title">Subscriptions</div>
      <div id="sub-list"></div>
    </div>
  </div>
  <button class="btn-run" id="run-btn" onclick="runAgent()">🤖 Run AI Agent Analysis</button>
  <button class="btn-reset" onclick="resetAll()">↺ Reset Demo</button>
  <div class="loader" id="loader"><span>Analyzing via OWS...</span></div>
  <div id="results">
    <div class="section-title">Agent Insights</div>
    <div class="result-panel" id="insights-box"></div>
    <div class="section-title" style="margin-top:16px">OWS Transaction Log</div>
    <div id="tx-box"></div>
    <div class="result-panel"><div class="saving-box" id="saving-box"></div></div>
  </div>
</main>
<script>
async function load() {
  const r = await fetch('/api/subscriptions');
  const d = await r.json();
  document.getElementById('s-total').textContent = '$' + d.total.toFixed(2);
  document.getElementById('s-count').textContent = d.subscriptions.filter(s=>s.active).length;
  document.getElementById('s-budget').textContent = '$' + d.policy.monthlyBudgetUSDC;
  document.getElementById('wallet-addr').textContent = d.wallet;
  document.getElementById('p-budget').value = d.policy.monthlyBudgetUSDC;
  document.getElementById('p-cancel').value = d.policy.cancelIfUsageBelow;
  document.getElementById('p-approval').value = d.policy.requireApprovalAbove;
  const list = document.getElementById('sub-list');
  list.innerHTML = d.subscriptions.map(s => {
    const c = s.usageScore>=60?'#22c55e':s.usageScore>=30?'#f59e0b':'#ef4444';
    return '<div class="sub-item' + (s.active?'':' inactive') + '">' +
      '<div class="sub-left"><div class="name">' + s.name + (s.active?'':' <span style="color:#ef4444;font-size:.7rem">(cancelled)</span>') + '</div>' +
      '<div class="meta">' + s.category + '</div>' +
      '<div class="bar-wrap"><div class="bar-fill" style="width:' + s.usageScore + '%;background:' + c + '"></div></div></div>' +
      '<div class="sub-right"><div class="sub-price">$' + s.monthlyUSDC + '</div><div class="sub-score">' + s.usageScore + '% usage</div></div></div>';
  }).join('');
}
async function savePolicy() {
  const body = {
    monthlyBudgetUSDC: document.getElementById('p-budget').value,
    cancelIfUsageBelow: document.getElementById('p-cancel').value,
    requireApprovalAbove: document.getElementById('p-approval').value
  };
  await fetch('/api/policy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  await load();
  alert('Policy saved!');
}
async function runAgent() {
  const btn = document.getElementById('run-btn');
  btn.disabled = true;
  document.getElementById('loader').style.display = 'block';
  document.getElementById('results').style.display = 'none';
  const r = await fetch('/api/analyze',{method:'POST'});
  const d = await r.json();
  document.getElementById('loader').style.display = 'none';
  document.getElementById('results').style.display = 'block';
  document.getElementById('insights-box').innerHTML = d.insights.map(i=>'<div class="insight-row">'+i+'</div>').join('');
  document.getElementById('tx-box').innerHTML = d.actions.map(a => {
    const icon = a.type==='cancelled'?'🚫':a.type==='paid'?'✅':'⚠️';
    const chip = '<span class="ows-chip">OWS '+(a.owsApproved?'✓ signed':'✗ blocked')+'</span>';
    const detail = a.type==='cancelled'?'Saving $'+a.saving+'/mo':'$'+a.amount+' USDC';
    return '<div class="tx-item '+a.type+'"><div class="tx-top">'+icon+' <span class="tx-name">'+a.subscription+'</span>'+chip+'</div>'+
      '<div class="tx-reason">'+detail+' - '+a.reason+'</div>'+
      (a.txHash?'<div class="tx-hash">sig: '+a.txHash+'</div>':'')+
      '</div>';
  }).join('');
  document.getElementById('saving-box').textContent = d.monthlySaving>0
    ? '💰 AI saved you $'+d.monthlySaving.toFixed(2)+'/month'
    : '✅ All subscriptions within budget';
  await load();
  btn.disabled = false;
}
async function resetAll() {
  await fetch('/api/reset',{method:'POST'});
  document.getElementById('results').style.display = 'none';
  await load();
}
load();
</script>
</body>
</html>`;

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
