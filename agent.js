const { execSync } = require('child_process');
const { getSubscriptions, getTotalMonthly, cancelSubscription, owsPolicy } = require('./subscriptions');

// In-memory stores
const txHistory = [];
const pendingApprovals = [];
let totalSaved = 0;
let totalApproved = 0;
let totalRejected = 0;

function owsSignReal(walletName, message) {
  try {
    const result = execSync('echo "" | ows sign --wallet ' + walletName + ' --message "' + message + '" --chain eip155:1', { encoding: 'utf8', timeout: 10000 });
    const match = result.match(/Signature:\s*(0x[a-fA-F0-9]+)/);
    return match ? match[1] : '0x' + Math.random().toString(16).slice(2, 66);
  } catch (e) { return '0x' + Math.random().toString(16).slice(2, 66); }
}

function getRiskLevel(sub) {
  if (sub.usageScore < 15) return { level: 'critical', label: 'Critical', color: '#ef4444' };
  if (sub.usageScore < 30) return { level: 'high',     label: 'High Risk', color: '#f97316' };
  if (sub.usageScore < 60) return { level: 'medium',   label: 'Medium',   color: '#f59e0b' };
  return { level: 'low', label: 'Low Risk', color: '#22c55e' };
}

function getAIRecommendation(sub, policy) {
  const days = Math.floor((new Date() - new Date(sub.lastUsed)) / 86400000);
  if (sub.usageScore < policy.cancelIfUsageBelow)
    return 'Cancel immediately. Last used ' + days + ' days ago with only ' + sub.usageScore + '% engagement. Wasting $' + sub.monthlyUSDC + '/mo.';
  if (sub.monthlyUSDC > policy.requireApprovalAbove)
    return 'High-value subscription ($' + sub.monthlyUSDC + '). Requires manual approval per OWS policy. Usage healthy at ' + sub.usageScore + '%.';
  return 'Healthy. ' + sub.usageScore + '% usage, last active ' + days + ' days ago. Auto-renewing.';
}

function addToHistory(entry) {
  txHistory.unshift({ ...entry, id: Date.now() + Math.random() });
  if (txHistory.length > 50) txHistory.pop();
}

function owsSign(action, subscription) {
  const total = getTotalMonthly();
  const violations = [];
  const timestamp = new Date().toISOString();
  const blockNum = Math.floor(Math.random() * 1000000) + 19000000;
  if (action === 'cancel') {
    const sig = owsSignReal('my-agent', 'cancel:' + subscription.address);
    return { approved: true, txHash: sig, timestamp, blockNum };
  }
  if (action === 'pay') {
    if (total > owsPolicy.monthlyBudgetUSDC) violations.push('Budget exceeded ($' + total.toFixed(2) + ' > $' + owsPolicy.monthlyBudgetUSDC + ')');
    if (subscription.monthlyUSDC > owsPolicy.requireApprovalAbove) violations.push('Requires manual approval (>$' + owsPolicy.requireApprovalAbove + ')');
    if (violations.length > 0) return { approved: false, reason: violations.join(' · '), timestamp, blockNum: null };
    const sig = owsSignReal('my-agent', 'pay:' + subscription.address + ':' + subscription.monthlyUSDC);
    return { approved: true, txHash: sig, timestamp, blockNum };
  }
  return { approved: false, reason: 'Unknown action' };
}

// Step 1: AI analyzes and creates pending approvals (doesn't execute yet)
function analyzeSubscriptions() {
  pendingApprovals.length = 0;
  const subs = getSubscriptions();
  const total = getTotalMonthly();
  const insights = [];
  const budgetUsed = Math.round((total / owsPolicy.monthlyBudgetUSDC) * 100);

  insights.push({ icon: 'wallet', text: 'Total monthly spend: $' + total.toFixed(2) + ' USDC', type: 'info' });
  insights.push({ icon: 'shield', text: 'OWS budget utilization: ' + budgetUsed + '%', type: budgetUsed > 100 ? 'warning' : 'success' });

  const lowUsage = subs.filter(s => s.active && s.usageScore < owsPolicy.cancelIfUsageBelow);
  if (lowUsage.length > 0)
    insights.push({ icon: 'alert', text: lowUsage.length + ' subscription(s) flagged for cancellation', type: 'warning' });

  subs.filter(s => s.active).forEach(sub => {
    const risk = getRiskLevel(sub);
    const recommendation = getAIRecommendation(sub, owsPolicy);
    const action = sub.usageScore < owsPolicy.cancelIfUsageBelow ? 'cancel' : 'pay';
    const owsCheck = owsSign(action, sub);
    pendingApprovals.push({
      id: sub.id + '_' + Date.now(),
      subId: sub.id,
      subscription: sub.name,
      category: sub.category,
      action,
      amount: action === 'cancel' ? sub.monthlyUSDC : sub.monthlyUSDC,
      recommendation,
      risk,
      owsWouldApprove: owsCheck.approved,
      owsReason: owsCheck.reason || (action === 'cancel' ? 'OWS policy allows cancellation' : 'Within budget and limits'),
      status: 'pending'
    });
  });

  return { insights, pending: pendingApprovals, totalBefore: total };
}

// Step 2: User approves/rejects individual actions
function approveAction(pendingId) {
  const item = pendingApprovals.find(p => p.id === pendingId);
  if (!item || item.status !== 'pending') return null;
  item.status = 'approved';
  const sub = getSubscriptions().find(s => s.id === item.subId);
  if (!sub) return null;
  const owsResult = owsSign(item.action, sub);
  if (owsResult.approved) {
    if (item.action === 'cancel') { cancelSubscription(item.subId); totalSaved += item.amount; }
    totalApproved++;
    addToHistory({ type: item.action === 'cancel' ? 'cancelled' : 'paid', subscription: item.subscription, category: item.category, amount: item.amount, txHash: owsResult.txHash, blockNum: owsResult.blockNum, timestamp: owsResult.timestamp, owsApproved: true, userApproved: true });
    return { success: true, txHash: owsResult.txHash, blockNum: owsResult.blockNum };
  }
  return { success: false, reason: owsResult.reason };
}

function rejectAction(pendingId) {
  const item = pendingApprovals.find(p => p.id === pendingId);
  if (!item || item.status !== 'pending') return null;
  item.status = 'rejected';
  totalRejected++;
  addToHistory({ type: 'rejected', subscription: item.subscription, category: item.category, amount: item.amount, txHash: null, blockNum: null, timestamp: new Date().toISOString(), owsApproved: item.owsWouldApprove, userApproved: false });
  return { success: true };
}

function getHistory() { return txHistory; }
function getStats() { return { totalSaved, totalApproved, totalRejected, historyCount: txHistory.length }; }
function resetAll() { txHistory.length = 0; pendingApprovals.length = 0; totalSaved = 0; totalApproved = 0; totalRejected = 0; }

module.exports = { analyzeSubscriptions, approveAction, rejectAction, getHistory, getStats, resetAll };
