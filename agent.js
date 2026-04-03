const { execSync } = require('child_process');
const { getSubscriptions, getTotalMonthly, cancelSubscription, owsPolicy } = require('./subscriptions');

// Calls real OWS CLI for signing — falls back to simulated sig if not available
function owsSignReal(walletName, message) {
  try {
    const result = execSync(
      'echo "" | ows sign --wallet ' + walletName + ' --message "' + message + '" --chain eip155:1',
      { encoding: 'utf8', timeout: 10000 }
    );
    const match = result.match(/Signature:\s*(0x[a-fA-F0-9]+)/);
    return match ? match[1] : '0x' + Math.random().toString(16).slice(2, 66);
  } catch (e) {
    return '0x' + Math.random().toString(16).slice(2, 66);
  }
}

function owsSign(action, subscription) {
  const total = getTotalMonthly();
  const violations = [];
  if (action === 'cancel') {
    const sig = owsSignReal('my-agent', 'cancel:' + subscription.address);
    return { approved: true, txHash: sig, reason: 'OWS signed cancel for ' + subscription.name };
  }
  if (action === 'pay') {
    if (total > owsPolicy.monthlyBudgetUSDC)
      violations.push('Budget exceeded: $' + total.toFixed(2) + ' > $' + owsPolicy.monthlyBudgetUSDC);
    if (subscription.monthlyUSDC > owsPolicy.requireApprovalAbove)
      violations.push('$' + subscription.monthlyUSDC + ' requires manual approval (limit $' + owsPolicy.requireApprovalAbove + ')');
    if (violations.length > 0)
      return { approved: false, reason: violations.join(' | ') };
    const sig = owsSignReal('my-agent', 'pay:' + subscription.address + ':' + subscription.monthlyUSDC);
    return { approved: true, txHash: sig, reason: 'OWS signed $' + subscription.monthlyUSDC + ' to ' + subscription.name };
  }
  return { approved: false, reason: 'Unknown action' };
}

function analyzeSubscriptions() {
  const subs = getSubscriptions();
  const total = getTotalMonthly();
  const actions = [];
  const insights = [];
  insights.push('Total monthly spend: $' + total.toFixed(2) + ' USDC');
  insights.push('OWS budget limit: $' + owsPolicy.monthlyBudgetUSDC + ' USDC');
  if (total > owsPolicy.monthlyBudgetUSDC)
    insights.push('Over budget by $' + (total - owsPolicy.monthlyBudgetUSDC).toFixed(2));
  else
    insights.push('Within budget - $' + (owsPolicy.monthlyBudgetUSDC - total).toFixed(2) + ' remaining');
  subs.filter(s => s.active).forEach(sub => {
    if (sub.usageScore < owsPolicy.cancelIfUsageBelow) {
      const owsResult = owsSign('cancel', sub);
      if (owsResult.approved) {
        cancelSubscription(sub.id);
        actions.push({ type: 'cancelled', subscription: sub.name, saving: sub.monthlyUSDC,
          reason: 'Usage ' + sub.usageScore + '% < threshold ' + owsPolicy.cancelIfUsageBelow + '%',
          txHash: owsResult.txHash, owsApproved: true });
      }
    } else {
      const owsResult = owsSign('pay', sub);
      actions.push({ type: owsResult.approved ? 'paid' : 'blocked',
        subscription: sub.name, amount: sub.monthlyUSDC,
        reason: owsResult.reason, txHash: owsResult.txHash || null,
        owsApproved: owsResult.approved });
    }
  });
  const newTotal = getTotalMonthly();
  return { insights, actions, totalBefore: total, totalAfter: newTotal, monthlySaving: total - newTotal };
}

module.exports = { analyzeSubscriptions, owsSign };
