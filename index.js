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
  <title>SubGuard AI — OWS Powered</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:#05050f;color:#e2e2f0;min-height:100vh}
    :root{--purple:#7c3aed;--pl:#a78bfa;--pd:#1e0d42;--green:#22c55e;--red:#ef4444;--orange:#f97316;--yellow:#f59e0b;--card:#0d0d1f;--card2:#111127;--border:#1a1a38}
    /* HEADER */
    header{background:linear-gradient(135deg,#080818,#120830);padding:16px 40px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
    .logo{display:flex;align-items:center;gap:12px}
    .logo-icon{width:36px;height:36px;background:linear-gradient(135deg,var(--purple),#4f46e5);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;box-shadow:0 0 20px #7c3aed44}
    .logo h1{font-size:1.1rem;color:#fff;font-weight:800;letter-spacing:-.02em}
    .logo p{font-size:0.7rem;color:#6b6baa;margin-top:1px}
    .header-right{display:flex;align-items:center;gap:12px}
    .ows-pill{background:var(--pd);border:1px solid #3d1f8a;color:var(--pl);padding:5px 12px;border-radius:20px;font-size:0.72rem;font-weight:600;display:flex;align-items:center;gap:5px}
    .status-dot{width:6px;height:6px;background:var(--green);border-radius:50%;animation:blink 2s infinite}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
    /* MAIN */
    main{max-width:1040px;margin:0 auto;padding:28px 20px}
    /* STATS */
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
    .stat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;position:relative;overflow:hidden;transition:.2s}
    .stat:hover{border-color:#3d2b8a;transform:translateY(-1px)}
    .stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
    .stat.purple::before{background:linear-gradient(90deg,var(--purple),#4f46e5)}
    .stat.green::before{background:linear-gradient(90deg,var(--green),#16a34a)}
    .stat.orange::before{background:linear-gradient(90deg,var(--orange),#dc2626)}
    .stat.blue::before{background:linear-gradient(90deg,#3b82f6,#6366f1)}
    .stat .val{font-size:1.7rem;font-weight:800;color:#fff;letter-spacing:-.03em}
    .stat .lbl{color:#6b6baa;font-size:0.75rem;margin-top:3px;font-weight:500}
    .stat .sub-val{font-size:0.72rem;color:#4b4b7a;margin-top:6px}
    /* WALLET BAR */
    .wallet-bar{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 18px;margin-bottom:24px;display:flex;align-items:center;gap:10px;font-size:0.8rem}
    .wallet-bar .dot{width:7px;height:7px;background:var(--green);border-radius:50%;flex-shrink:0;box-shadow:0 0 8px var(--green)}
    .wallet-bar code{color:var(--pl);font-size:0.75rem;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace}
    .key-safe{color:var(--green);font-weight:600;font-size:0.75rem;white-space:nowrap}
    /* GRID */
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
    .panel{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px}
    .panel-title{font-size:0.75rem;font-weight:700;color:#6b6baa;margin-bottom:14px;text-transform:uppercase;letter-spacing:.08em}
    /* POLICY */
    .policy-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border)}
    .policy-row:last-child{border-bottom:none}
    .policy-row label{font-size:0.82rem;color:#aaa}
    .policy-row input{width:76px;background:#080818;border:1px solid var(--border);color:#fff;padding:5px 8px;border-radius:7px;font-size:0.82rem;text-align:right;transition:.2s}
    .policy-row input:focus{outline:none;border-color:var(--purple);box-shadow:0 0 0 3px #7c3aed22}
    .btn-save{width:100%;margin-top:12px;padding:9px;background:linear-gradient(135deg,#1e0d42,#2d1b69);border:1px solid #3d2b8a;color:var(--pl);border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;transition:.2s}
    .btn-save:hover{background:var(--purple);color:#fff;border-color:var(--purple)}
    /* SUBSCRIPTIONS */
    .sub-item{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);transition:.2s}
    .sub-item:last-child{border-bottom:none}
    .sub-item.inactive{opacity:.3}
    .sub-left .name{font-size:0.88rem;font-weight:600;display:flex;align-items:center;gap:6px}
    .sub-left .meta{font-size:0.72rem;color:#6b6baa;margin-top:2px}
    .risk-badge{font-size:0.62rem;padding:1px 6px;border-radius:4px;font-weight:600}
    .risk-critical{background:#2d0808;color:#ef4444;border:1px solid #ef444433}
    .risk-high{background:#2d1508;color:#f97316;border:1px solid #f9731633}
    .risk-medium{background:#2d2508;color:#f59e0b;border:1px solid #f59e0b33}
    .risk-low{background:#082d08;color:#22c55e;border:1px solid #22c55e33}
    .bar-wrap{width:60px;height:3px;background:#1a1a38;border-radius:2px;margin-top:6px}
    .bar-fill{height:100%;border-radius:2px;transition:width .5s ease}
    .sub-right{text-align:right}
    .sub-price{font-size:0.9rem;font-weight:700;color:#fff}
    .sub-score{font-size:0.68rem;color:#6b6baa;margin-top:2px}
    /* BUTTONS */
    .btn-run{width:100%;padding:14px;background:linear-gradient(135deg,var(--purple),#4f46e5);color:#fff;border:none;border-radius:12px;font-size:0.95rem;font-weight:700;cursor:pointer;margin-bottom:12px;transition:.2s;letter-spacing:.01em;position:relative;overflow:hidden}
    .btn-run::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#ffffff11,transparent);opacity:0;transition:.2s}
    .btn-run:hover::after{opacity:1}
    .btn-run:hover{transform:translateY(-1px);box-shadow:0 8px 24px #7c3aed44}
    .btn-run:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}
    .btn-reset{width:100%;padding:9px;background:transparent;border:1px solid var(--border);color:#4b4b7a;border-radius:10px;font-size:0.8rem;cursor:pointer;margin-bottom:24px;transition:.2s}
    .btn-reset:hover{border-color:#3d2b8a;color:var(--pl)}
    /* LOADER */
    .loader{display:none;padding:24px;text-align:center}
    .ai-thinking{display:flex;align-items:center;justify-content:center;gap:10px;color:#6b6baa;font-size:0.85rem}
    .ai-thinking .dots{display:flex;gap:4px}
    .ai-thinking .dot-anim{width:6px;height:6px;background:var(--purple);border-radius:50%;animation:dotBounce 1.2s infinite}
    .ai-thinking .dot-anim:nth-child(2){animation-delay:.2s}
    .ai-thinking .dot-anim:nth-child(3){animation-delay:.4s}
    @keyframes dotBounce{0%,80%,100%{transform:scale(0.6);opacity:.4}40%{transform:scale(1);opacity:1}}
    /* RESULTS */
    #results{display:none}
    .section-title{font-size:0.75rem;font-weight:700;color:#6b6baa;margin-bottom:12px;text-transform:uppercase;letter-spacing:.08em}
    .insights-grid{display:flex;flex-direction:column;gap:6px;margin-bottom:20px}
    .insight-row{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:var(--card);border:1px solid var(--border);border-radius:10px;font-size:0.84rem}
    .insight-row.warning{border-color:#f59e0b33;background:#1a1500}
    .insight-row.success{border-color:#22c55e33;background:#001a00}
    .insight-row.info{border-color:#3b82f633;background:#00081a}
    .insight-icon{font-size:1rem;flex-shrink:0;margin-top:1px}
    .insight-text{color:#c4b5fd;line-height:1.4}
    .insight-row.warning .insight-text{color:#fcd34d}
    .insight-row.success .insight-text{color:#86efac}
    .insight-row.info .insight-text{color:#93c5fd}
    /* TX LOG */
    .tx-item{border-radius:12px;margin-bottom:10px;overflow:hidden;border:1px solid var(--border);transition:.2s}
    .tx-item:hover{transform:translateX(2px)}
    .tx-item.cancelled{border-color:#ef444433;background:linear-gradient(135deg,#1a0808,#0d0d1f)}
    .tx-item.paid{border-color:#22c55e33;background:linear-gradient(135deg,#081a08,#0d0d1f)}
    .tx-item.blocked{border-color:#f59e0b33;background:linear-gradient(135deg,#1a1500,#0d0d1f)}
    .tx-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #ffffff08}
    .tx-header-left{display:flex;align-items:center;gap:8px}
    .tx-icon{font-size:1rem}
    .tx-name{font-weight:700;font-size:0.9rem}
    .tx-category{font-size:0.7rem;color:#6b6baa;background:#ffffff08;padding:2px 7px;border-radius:4px}
    .tx-header-right{display:flex;align-items:center;gap:8px}
    .ows-chip{background:#1a0d3d;border:1px solid #3d2b8a;color:var(--pl);padding:3px 8px;border-radius:5px;font-size:0.68rem;font-weight:600}
    .ows-chip.blocked{background:#1a1500;border-color:#f59e0b44;color:#f59e0b}
    .tx-amount{font-weight:700;font-size:0.88rem}
    .tx-body{padding:10px 16px}
    .tx-reason{color:#888;font-size:0.8rem;line-height:1.4;margin-bottom:8px}
    .tx-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .tx-hash{font-family:monospace;font-size:0.68rem;color:#3d3d6a;background:#ffffff04;padding:3px 8px;border-radius:4px;border:1px solid #1a1a38}
    .tx-time{font-size:0.68rem;color:#3d3d6a}
    .tx-block{font-size:0.68rem;color:#3d3d6a}
    /* SAVING */
    .saving-card{background:linear-gradient(135deg,#082d08,#0d0d1f);border:1px solid #22c55e33;border-radius:14px;padding:24px;text-align:center;margin-bottom:16px}
    .saving-amount{font-size:2rem;font-weight:800;color:var(--green);letter-spacing:-.03em}
    .saving-label{color:#86efac;font-size:0.85rem;margin-top:4px}
    /* RESPONSIVE */
    @media(max-width:640px){
      .stats{grid-template-columns:repeat(2,1fr)}
      .two-col{grid-template-columns:1fr}
      header{padding:14px 16px}
      main{padding:16px}
    }
  </style>
</head>
<body>
<header>
  <div class="logo">
    <div class="logo-icon">🛡️</div>
    <div>
      <h1>SubGuard AI</h1>
      <p>AI-powered Web3 Subscription Manager</p>
    </div>
  </div>
  <div class="header-right">
    <div class="ows-pill"><div class="status-dot"></div>Open Wallet Standard</div>
  </div>
</header>

<main>
  <div class="stats">
    <div class="stat purple">
      <div class="val" id="s-total">-</div>
      <div class="lbl">Monthly Spend</div>
      <div class="sub-val">USDC / month</div>
    </div>
    <div class="stat green">
      <div class="val" id="s-count">-</div>
      <div class="lbl">Active Subscriptions</div>
      <div class="sub-val">on-chain services</div>
    </div>
    <div class="stat orange">
      <div class="val" id="s-risk">-</div>
      <div class="lbl">At Risk</div>
      <div class="sub-val">low usage detected</div>
    </div>
    <div class="stat blue">
      <div class="val" id="s-budget">-</div>
      <div class="lbl">OWS Budget Limit</div>
      <div class="sub-val">policy enforced</div>
    </div>
  </div>

  <div class="wallet-bar">
    <div class="dot"></div>
    <span style="color:#4b4b7a;font-size:.75rem">OWS Wallet</span>
    <code id="wallet-addr">loading...</code>
    <span class="key-safe">🔒 Private key never exposed to AI</span>
  </div>

  <div class="two-col">
    <div class="panel">
      <div class="panel-title">OWS Policy Rules</div>
      <div class="policy-row"><label>Monthly Budget (USDC)</label><input id="p-budget" type="number" value="40"></div>
      <div class="policy-row"><label>Cancel if usage below (%)</label><input id="p-cancel" type="number" value="30"></div>
      <div class="policy-row"><label>Approval required above ($)</label><input id="p-approval" type="number" value="15"></div>
      <div class="policy-row"><label>Private Key Access</label><span style="color:#22c55e;font-size:.8rem;font-weight:700">Never ✓</span></div>
      <button class="btn-save" onclick="savePolicy()">Update Policy</button>
    </div>
    <div class="panel">
      <div class="panel-title">Subscriptions</div>
      <div id="sub-list"></div>
    </div>
  </div>

  <button class="btn-run" id="run-btn" onclick="runAgent()">🤖 Run AI Agent Analysis</button>
  <button class="btn-reset" onclick="resetAll()">↺ Reset Demo</button>

  <div class="loader" id="loader">
    <div class="ai-thinking">
      <span>AI agent analyzing via OWS</span>
      <div class="dots">
        <div class="dot-anim"></div>
        <div class="dot-anim"></div>
        <div class="dot-anim"></div>
      </div>
    </div>
  </div>

  <div id="results">
    <div class="section-title">Agent Insights</div>
    <div class="insights-grid" id="insights-box"></div>
    <div class="section-title">OWS Transaction Log</div>
    <div id="tx-box"></div>
    <div id="saving-wrap"></div>
  </div>
</main>

<script>
const ICONS = { wallet: '💳', shield: '🛡️', alert: '⚠️', money: '💰', info: 'ℹ️' };

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
  const atRisk = d.subscriptions.filter(s => s.active && s.usageScore < d.policy.cancelIfUsageBelow).length;
  document.getElementById('s-risk').textContent = atRisk;
  const list = document.getElementById('sub-list');
  list.innerHTML = d.subscriptions.map(s => {
    const c = s.usageScore>=60?'#22c55e':s.usageScore>=30?'#f59e0b':s.usageScore>=15?'#f97316':'#ef4444';
    const riskClass = s.usageScore>=60?'low':s.usageScore>=30?'medium':s.usageScore>=15?'high':'critical';
    const riskLabel = s.usageScore>=60?'Low Risk':s.usageScore>=30?'Medium':s.usageScore>=15?'High Risk':'Critical';
    return '<div class="sub-item' + (s.active?'':' inactive') + '">' +
      '<div class="sub-left">' +
        '<div class="name">' + s.name + (s.active?'':' <span style="color:#ef4444;font-size:.65rem">(cancelled)</span>') +
        ' <span class="risk-badge risk-' + riskClass + '">' + riskLabel + '</span></div>' +
        '<div class="meta">' + s.category + ' · ' + s.usageScore + '% usage</div>' +
        '<div class="bar-wrap"><div class="bar-fill" style="width:' + s.usageScore + '%;background:' + c + '"></div></div>' +
      '</div>' +
      '<div class="sub-right"><div class="sub-price">$' + s.monthlyUSDC + '</div><div class="sub-score">/month</div></div>' +
    '</div>';
  }).join('');
}

async function savePolicy() {
  const body = { monthlyBudgetUSDC: document.getElementById('p-budget').value, cancelIfUsageBelow: document.getElementById('p-cancel').value, requireApprovalAbove: document.getElementById('p-approval').value };
  await fetch('/api/policy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  await load();
  const btn = document.querySelector('.btn-save');
  btn.textContent = '✓ Saved';
  setTimeout(() => { btn.textContent = 'Update Policy'; }, 1500);
}

async function runAgent() {
  const btn = document.getElementById('run-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Analyzing...';
  document.getElementById('loader').style.display = 'block';
  document.getElementById('results').style.display = 'none';
  const r = await fetch('/api/analyze',{method:'POST'});
  const d = await r.json();
  document.getElementById('loader').style.display = 'none';
  document.getElementById('results').style.display = 'block';

  document.getElementById('insights-box').innerHTML = d.insights.map(i => {
    const icon = ICONS[i.icon] || 'ℹ️';
    return '<div class="insight-row ' + i.type + '"><span class="insight-icon">' + icon + '</span><span class="insight-text">' + i.text + '</span></div>';
  }).join('');

  document.getElementById('tx-box').innerHTML = d.actions.map(a => {
    const icon = a.type==='cancelled'?'🚫':a.type==='paid'?'✅':'⚠️';
    const chipClass = a.owsApproved ? '' : ' blocked';
    const chipText = a.owsApproved ? '✓ OWS Signed' : '✗ OWS Blocked';
    const amountText = a.type==='cancelled' ? '-$'+a.saving+'/mo saved' : '$'+a.amount+' USDC';
    const amountColor = a.type==='cancelled'?'#22c55e':a.type==='paid'?'#a78bfa':'#f59e0b';
    const time = a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : '';
    return '<div class="tx-item ' + a.type + '">' +
      '<div class="tx-header">' +
        '<div class="tx-header-left">' +
          '<span class="tx-icon">' + icon + '</span>' +
          '<span class="tx-name">' + a.subscription + '</span>' +
          '<span class="tx-category">' + (a.category||'') + '</span>' +
        '</div>' +
        '<div class="tx-header-right">' +
          '<span class="ows-chip' + chipClass + '">' + chipText + '</span>' +
          '<span class="tx-amount" style="color:' + amountColor + '">' + amountText + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="tx-body">' +
        '<div class="tx-reason">' + a.reason + '</div>' +
        '<div class="tx-meta">' +
          (a.txHash ? '<span class="tx-hash">sig: ' + a.txHash.slice(0,20) + '...</span>' : '') +
          (time ? '<span class="tx-time">🕐 ' + time + '</span>' : '') +
          (a.blockNum ? '<span class="tx-block">⛓ block #' + a.blockNum + '</span>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  const wrap = document.getElementById('saving-wrap');
  if (d.monthlySaving > 0) {
    wrap.innerHTML = '<div class="saving-card"><div class="saving-amount">$' + d.monthlySaving.toFixed(2) + '</div><div class="saving-label">saved per month by AI agent via OWS</div></div>';
  } else {
    wrap.innerHTML = '<div class="saving-card" style="border-color:#22c55e55"><div class="saving-amount" style="font-size:1.4rem">✅ Optimized</div><div class="saving-label">All subscriptions within OWS policy</div></div>';
  }

  await load();
  btn.disabled = false;
  btn.textContent = '🤖 Run AI Agent Analysis';
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
