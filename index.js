require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const { getSubscriptions, getTotalMonthly, owsPolicy, updatePolicy, resetSubscriptions } = require('./subscriptions');
const { analyzeSubscriptions, approveAction, rejectAction, getHistory, getStats, resetAll: agentReset } = require('./agent');
const app = express();
app.use(express.json());

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SubGuard AI - OWS Powered</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#05050f;color:#e2e2f0;min-height:100vh}
:root{--p:#7c3aed;--pl:#a78bfa;--pd:#1e0d42;--g:#22c55e;--r:#ef4444;--o:#f97316;--y:#f59e0b;--c:#0d0d1f;--b:#1a1a38}
header{background:linear-gradient(135deg,#080818,#120830);padding:16px 40px;border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
.logo{display:flex;align-items:center;gap:12px}
.li{width:36px;height:36px;background:linear-gradient(135deg,var(--p),#4f46e5);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;box-shadow:0 0 20px #7c3aed44}
.logo h1{font-size:1.1rem;color:#fff;font-weight:800}
.logo p{font-size:.7rem;color:#6b6baa;margin-top:1px}
.pill{background:var(--pd);border:1px solid #3d1f8a;color:var(--pl);padding:5px 12px;border-radius:20px;font-size:.72rem;font-weight:600;display:flex;align-items:center;gap:5px}
.sd{width:6px;height:6px;background:var(--g);border-radius:50%;animation:blink 2s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
main{max-width:1100px;margin:0 auto;padding:24px 20px}
.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px}
.stat{background:var(--c);border:1px solid var(--b);border-radius:12px;padding:16px;position:relative;overflow:hidden;transition:.2s}
.stat:hover{border-color:#3d2b8a;transform:translateY(-1px)}
.stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.s1::before{background:linear-gradient(90deg,var(--p),#4f46e5)}
.s2::before{background:linear-gradient(90deg,var(--g),#16a34a)}
.s3::before{background:linear-gradient(90deg,var(--o),#dc2626)}
.s4::before{background:linear-gradient(90deg,#3b82f6,#6366f1)}
.s5::before{background:linear-gradient(90deg,var(--y),#d97706)}
.stat .v{font-size:1.5rem;font-weight:800;color:#fff}
.stat .l{color:#6b6baa;font-size:.72rem;margin-top:3px}
.wbar{background:var(--c);border:1px solid var(--b);border-radius:10px;padding:10px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px;font-size:.78rem}
.wd{width:7px;height:7px;background:var(--g);border-radius:50%;box-shadow:0 0 8px var(--g)}
.wbar code{color:var(--pl);font-size:.73rem;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace}
.ks{color:var(--g);font-weight:600;font-size:.73rem;white-space:nowrap}
.layout{display:grid;grid-template-columns:270px 1fr;gap:16px;margin-bottom:20px}
.panel{background:var(--c);border:1px solid var(--b);border-radius:14px;padding:18px;margin-bottom:14px}
.pt{font-size:.7rem;font-weight:700;color:#6b6baa;margin-bottom:12px;text-transform:uppercase;letter-spacing:.08em}
.pr{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b)}
.pr:last-child{border-bottom:none}
.pr label{font-size:.8rem;color:#aaa}
.pr input{width:72px;background:#080818;border:1px solid var(--b);color:#fff;padding:4px 8px;border-radius:6px;font-size:.8rem;text-align:right;transition:.2s}
.pr input:focus{outline:none;border-color:var(--p)}
.bsave{width:100%;margin-top:10px;padding:8px;background:linear-gradient(135deg,#1e0d42,#2d1b69);border:1px solid #3d2b8a;color:var(--pl);border-radius:7px;font-size:.8rem;font-weight:600;cursor:pointer;transition:.2s}
.bsave:hover{background:var(--p);color:#fff}
.si{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--b)}
.si:last-child{border-bottom:none}
.si.inactive{opacity:.3}
.sn{font-size:.85rem;font-weight:600;display:flex;align-items:center;gap:5px}
.sm{font-size:.7rem;color:#6b6baa;margin-top:2px}
.rb{font-size:.6rem;padding:1px 5px;border-radius:3px;font-weight:600}
.rc{background:#2d0808;color:#ef4444;border:1px solid #ef444433}
.rh{background:#2d1508;color:#f97316;border:1px solid #f9731633}
.rm{background:#2d2508;color:#f59e0b;border:1px solid #f59e0b33}
.rl{background:#082d08;color:#22c55e;border:1px solid #22c55e33}
.bw{width:55px;height:3px;background:#1a1a38;border-radius:2px;margin-top:5px}
.bf{height:100%;border-radius:2px}
.sp{font-size:.88rem;font-weight:700;color:#fff;text-align:right}
.ss{font-size:.66rem;color:#6b6baa;text-align:right}
.brun{width:100%;padding:13px;background:linear-gradient(135deg,var(--p),#4f46e5);color:#fff;border:none;border-radius:11px;font-size:.92rem;font-weight:700;cursor:pointer;margin-bottom:10px;transition:.2s}
.brun:hover{transform:translateY(-1px);box-shadow:0 8px 24px #7c3aed44}
.brun:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}
.breset{width:100%;padding:8px;background:transparent;border:1px solid var(--b);color:#4b4b7a;border-radius:9px;font-size:.78rem;cursor:pointer;margin-bottom:20px;transition:.2s}
.breset:hover{border-color:#3d2b8a;color:var(--pl)}
.loader{display:none;padding:20px;text-align:center}
.ait{display:flex;align-items:center;justify-content:center;gap:8px;color:#6b6baa;font-size:.82rem}
.dots{display:flex;gap:4px}
.da{width:5px;height:5px;background:var(--p);border-radius:50%;animation:db 1.2s infinite}
.da:nth-child(2){animation-delay:.2s}
.da:nth-child(3){animation-delay:.4s}
@keyframes db{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}
#results{display:none}
.stitle{font-size:.7rem;font-weight:700;color:#6b6baa;margin-bottom:10px;text-transform:uppercase;letter-spacing:.08em}
.ig{display:flex;flex-direction:column;gap:5px;margin-bottom:16px}
.ir{display:flex;align-items:flex-start;gap:8px;padding:9px 12px;background:var(--c);border:1px solid var(--b);border-radius:9px;font-size:.82rem}
.ir.warning{border-color:#f59e0b33;background:#1a1500}
.ir.success{border-color:#22c55e33;background:#001a00}
.ir.info{border-color:#3b82f633;background:#00081a}
.ir.warning .it{color:#fcd34d}
.ir.success .it{color:#86efac}
.ir.info .it{color:#93c5fd}
.tabs{display:flex;gap:4px;margin-bottom:12px}
.tab{padding:6px 14px;border-radius:7px;font-size:.76rem;font-weight:600;cursor:pointer;border:1px solid var(--b);color:#6b6baa;background:transparent;transition:.2s}
.tab.active{background:var(--pd);border-color:#3d2b8a;color:var(--pl)}
.tc{display:none}
.tc.active{display:block}
.ac{border-radius:12px;margin-bottom:10px;border:1px solid var(--b);background:var(--c);overflow:hidden;transition:.3s}
.ac.approved{border-color:#22c55e44;opacity:.6}
.ac.rejected{border-color:#ef444444;opacity:.6}
.ach{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-bottom:1px solid #ffffff08}
.acl{display:flex;align-items:center;gap:7px}
.acn{font-weight:700;font-size:.88rem}
.acc{font-size:.66rem;color:#6b6baa;background:#ffffff08;padding:2px 6px;border-radius:4px}
.aca{font-size:.68rem;padding:2px 7px;border-radius:4px;font-weight:600}
.aca.cancel{background:#2d0808;color:#ef4444;border:1px solid #ef444433}
.aca.pay{background:#082d08;color:#22c55e;border:1px solid #22c55e33}
.aca.blocked{background:#1a1500;color:#f59e0b;border:1px solid #f59e0b33}
.acr{display:flex;align-items:center;gap:7px}
.ov{font-size:.66rem;padding:2px 7px;border-radius:4px;font-weight:600}
.ov.ok{background:#1a0d3d;border:1px solid #3d2b8a;color:var(--pl)}
.ov.no{background:#1a1500;border:1px solid #f59e0b44;color:#f59e0b}
.acamt{font-weight:700;font-size:.86rem}
.acb{padding:10px 14px}
.acrec{color:#888;font-size:.77rem;line-height:1.4;margin-bottom:9px}
.acbtns{display:flex;gap:7px}
.bapp{flex:1;padding:7px;background:linear-gradient(135deg,#082d08,#0a3d0a);border:1px solid #22c55e44;color:#22c55e;border-radius:7px;font-size:.78rem;font-weight:600;cursor:pointer;transition:.2s}
.bapp:hover{background:#22c55e;color:#000}
.bapp:disabled{opacity:.4;cursor:not-allowed}
.brej{flex:1;padding:7px;background:linear-gradient(135deg,#2d0808,#3d0a0a);border:1px solid #ef444444;color:#ef4444;border-radius:7px;font-size:.78rem;font-weight:600;cursor:pointer;transition:.2s}
.brej:hover{background:#ef4444;color:#fff}
.brej:disabled{opacity:.4;cursor:not-allowed}
.acdone{text-align:center;padding:8px;font-size:.78rem;font-weight:600}
.acdone.approved{color:#22c55e}
.acdone.rejected{color:#ef4444}
.hi{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:8px;margin-bottom:6px;font-size:.78rem;border:1px solid var(--b)}
.hi.cancelled{background:#1a080811;border-color:#ef444422}
.hi.paid{background:#081a0811;border-color:#22c55e22}
.hi.rejected{background:#1a150011;border-color:#f59e0b22}
.hil{display:flex;align-items:center;gap:8px}
.hin{font-weight:600}
.hit{font-size:.66rem;color:#4b4b7a}
.hia{font-weight:700}
.scard{background:linear-gradient(135deg,#082d08,#0d0d1f);border:1px solid #22c55e33;border-radius:14px;padding:20px;text-align:center;margin-top:14px}
.sval{font-size:1.8rem;font-weight:800;color:var(--g)}
.slbl{color:#86efac;font-size:.82rem;margin-top:4px}
@media(max-width:768px){.stats{grid-template-columns:repeat(3,1fr)}.layout{grid-template-columns:1fr}header{padding:12px 16px}main{padding:14px}}
</style>
</head>
<body>
<header>
  <div class="logo"><div class="li">🛡️</div><div><h1>SubGuard AI</h1><p>AI-powered Web3 Subscription Manager</p></div></div>
  <div class="pill"><div class="sd"></div>Open Wallet Standard</div>
</header>
<main>
  <div class="stats">
    <div class="stat s1"><div class="v" id="s-total">-</div><div class="l">Monthly Spend (USDC)</div></div>
    <div class="stat s2"><div class="v" id="s-count">-</div><div class="l">Active Subscriptions</div></div>
    <div class="stat s3"><div class="v" id="s-risk">-</div><div class="l">At Risk</div></div>
    <div class="stat s4"><div class="v" id="s-saved">$0</div><div class="l">Total Saved</div></div>
    <div class="stat s5"><div class="v" id="s-ar">0/0</div><div class="l">Approved / Rejected</div></div>
  </div>
  <div class="wbar">
    <div class="wd"></div>
    <span style="color:#4b4b7a;font-size:.73rem">OWS Wallet</span>
    <code id="wallet-addr">loading...</code>
    <span class="ks">🔒 Private key never exposed to AI</span>
  </div>
  <div class="layout">
    <div>
      <div class="panel">
        <div class="pt">OWS Policy Rules</div>
        <div class="pr"><label>Monthly Budget (USDC)</label><input id="p-budget" type="number" value="40"></div>
        <div class="pr"><label>Cancel if usage below (%)</label><input id="p-cancel" type="number" value="30"></div>
        <div class="pr"><label>Approval required above ($)</label><input id="p-approval" type="number" value="15"></div>
        <div class="pr"><label>Private Key Access</label><span style="color:#22c55e;font-size:.78rem;font-weight:700">Never ✓</span></div>
        <button class="bsave" onclick="savePolicy()">Update Policy</button>
      </div>
      <div class="panel">
        <div class="pt">Subscriptions</div>
        <div id="sub-list"></div>
      </div>
    </div>
    <div>
      <button class="brun" id="run-btn" onclick="runAgent()">🤖 Run AI Agent Analysis</button>
      <button class="breset" onclick="resetAll()">↺ Reset Demo</button>
      <div class="loader" id="loader"><div class="ait"><span>AI analyzing via OWS</span><div class="dots"><div class="da"></div><div class="da"></div><div class="da"></div></div></div></div>
      <div id="results">
        <div class="stitle">Agent Insights</div>
        <div class="ig" id="insights-box"></div>
        <div class="tabs">
          <button class="tab active" onclick="showTab('approvals',this)">⏳ Pending Approvals <span id="pc"></span></button>
          <button class="tab" onclick="showTab('history',this)">📋 Transaction History</button>
        </div>
        <div class="tc active" id="tc-approvals"><div id="approvals-box"></div></div>
        <div class="tc" id="tc-history"><div id="history-box"></div></div>
        <div id="saving-wrap"></div>
      </div>
    </div>
  </div>
</main>
<script>
const ICONS={wallet:'💳',shield:'🛡️',alert:'⚠️',money:'💰',info:'ℹ️'};
async function load(){
  const[sr,str]=await Promise.all([fetch('/api/subscriptions'),fetch('/api/stats')]);
  const d=await sr.json(),st=await str.json();
  document.getElementById('s-total').textContent='$'+d.total.toFixed(2);
  document.getElementById('s-count').textContent=d.subscriptions.filter(s=>s.active).length;
  document.getElementById('s-risk').textContent=d.subscriptions.filter(s=>s.active&&s.usageScore<d.policy.cancelIfUsageBelow).length;
  document.getElementById('s-saved').textContent='$'+st.totalSaved.toFixed(2);
  document.getElementById('s-ar').textContent=st.totalApproved+'/'+st.totalRejected;
  document.getElementById('wallet-addr').textContent=d.wallet;
  document.getElementById('p-budget').value=d.policy.monthlyBudgetUSDC;
  document.getElementById('p-cancel').value=d.policy.cancelIfUsageBelow;
  document.getElementById('p-approval').value=d.policy.requireApprovalAbove;
  document.getElementById('sub-list').innerHTML=d.subscriptions.map(s=>{
    const c=s.usageScore>=60?'#22c55e':s.usageScore>=30?'#f59e0b':s.usageScore>=15?'#f97316':'#ef4444';
    const rc=s.usageScore>=60?'rl':s.usageScore>=30?'rm':s.usageScore>=15?'rh':'rc';
    const rl=s.usageScore>=60?'Low':s.usageScore>=30?'Medium':s.usageScore>=15?'High':'Critical';
    return '<div class="si'+(s.active?'':' inactive')+'"><div><div class="sn">'+s.name+(s.active?'':' <span style="color:#ef4444;font-size:.62rem">(cancelled)</span>')+' <span class="rb '+rc+'">'+rl+'</span></div><div class="sm">'+s.category+' · '+s.usageScore+'%</div><div class="bw"><div class="bf" style="width:'+s.usageScore+'%;background:'+c+'"></div></div></div><div><div class="sp">$'+s.monthlyUSDC+'</div><div class="ss">/mo</div></div></div>';
  }).join('');
}
async function savePolicy(){
  const body={monthlyBudgetUSDC:document.getElementById('p-budget').value,cancelIfUsageBelow:document.getElementById('p-cancel').value,requireApprovalAbove:document.getElementById('p-approval').value};
  await fetch('/api/policy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  await load();
  const btn=document.querySelector('.bsave');
  btn.textContent='✓ Saved';setTimeout(()=>btn.textContent='Update Policy',1500);
}
async function runAgent(){
  const btn=document.getElementById('run-btn');
  btn.disabled=true;btn.textContent='⏳ Analyzing...';
  document.getElementById('loader').style.display='block';
  document.getElementById('results').style.display='none';
  const r=await fetch('/api/analyze',{method:'POST'});
  const d=await r.json();
  document.getElementById('loader').style.display='none';
  document.getElementById('results').style.display='block';
  document.getElementById('insights-box').innerHTML=d.insights.map(i=>'<div class="ir '+i.type+'"><span>'+(ICONS[i.icon]||'ℹ️')+'</span><span class="it">'+i.text+'</span></div>').join('');
  const pending=d.pending||[];
  document.getElementById('pc').textContent=pending.length?'('+pending.length+')':'';
  document.getElementById('approvals-box').innerHTML=pending.map(p=>{
    const al=p.action==='cancel'?'CANCEL':p.owsWouldApprove?'PAY':'BLOCKED';
    const ac=p.action==='cancel'?'cancel':p.owsWouldApprove?'pay':'blocked';
    const ac2=p.owsWouldApprove?'ok':'no';
    const amt=p.action==='cancel'?'-$'+p.amount+'/mo':'$'+p.amount+' USDC';
    const amc=p.action==='cancel'?'#ef4444':p.owsWouldApprove?'#22c55e':'#f59e0b';
    return '<div class="ac" id="ac-'+p.id+'"><div class="ach"><div class="acl"><span class="acn">'+p.subscription+'</span><span class="acc">'+p.category+'</span><span class="aca '+ac+'">'+al+'</span></div><div class="acr"><span class="ov '+ac2+'">OWS '+(p.owsWouldApprove?'✓ allows':'✗ blocks')+'</span><span class="acamt" style="color:'+amc+'">'+amt+'</span></div></div><div class="acb"><div class="acrec">'+p.recommendation+'</div><div class="acbtns"><button class="bapp" onclick="approve(\''+p.id+'\')">✓ Approve</button><button class="brej" onclick="reject(\''+p.id+'\')">✗ Reject</button></div></div></div>';
  }).join('')||'<div style="color:#4b4b7a;font-size:.82rem;padding:12px">No pending actions.</div>';
  await loadHistory();await load();
  btn.disabled=false;btn.textContent='🤖 Run AI Agent Analysis';
}
async function approve(id){
  const card=document.getElementById('ac-'+id);
  card.querySelectorAll('button').forEach(b=>b.disabled=true);
  const r=await fetch('/api/approve/'+id,{method:'POST'});
  const d=await r.json();
  card.classList.add('approved');
  card.querySelector('.acb').innerHTML='<div class="acdone approved">✅ Approved — OWS signed: '+(d.txHash?d.txHash.slice(0,16)+'...':'executed')+'</div>';
  await load();await loadHistory();
}
async function reject(id){
  const card=document.getElementById('ac-'+id);
  card.querySelectorAll('button').forEach(b=>b.disabled=true);
  await fetch('/api/reject/'+id,{method:'POST'});
  card.classList.add('rejected');
  card.querySelector('.acb').innerHTML='<div class="acdone rejected">✗ Rejected — OWS did not sign</div>';
  await load();await loadHistory();
}
async function loadHistory(){
  const r=await fetch('/api/history');
  const h=await r.json();
  const icons={cancelled:'🚫',paid:'✅',rejected:'⚠️'};
  document.getElementById('history-box').innerHTML=h.length===0?'<div style="color:#4b4b7a;font-size:.82rem;padding:12px">No transactions yet.</div>':h.map(x=>{
    const t=x.timestamp?new Date(x.timestamp).toLocaleTimeString():'';
    const ac=x.type==='cancelled'?'#22c55e':x.type==='paid'?'#a78bfa':'#f59e0b';
    const at=x.type==='cancelled'?'+$'+x.amount+' saved':'$'+x.amount;
    return '<div class="hi '+x.type+'"><div class="hil"><span>'+(icons[x.type]||'•')+'</span><div><div class="hin">'+x.subscription+'</div><div class="hit">'+t+(x.blockNum?' · block #'+x.blockNum:'')+'</div></div></div><div class="hia" style="color:'+ac+'">'+at+'</div></div>';
  }).join('');
  const st=await(await fetch('/api/stats')).json();
  document.getElementById('saving-wrap').innerHTML=st.totalSaved>0?'<div class="scard"><div class="sval">$'+st.totalSaved.toFixed(2)+'</div><div class="slbl">total saved by AI agent via OWS</div></div>':'';
}
function showTab(name,el){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tc').forEach(t=>t.classList.remove('active'));
  document.getElementById('tc-'+name).classList.add('active');
  el.classList.add('active');
}
async function resetAll(){
  await fetch('/api/reset',{method:'POST'});
  document.getElementById('results').style.display='none';
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
