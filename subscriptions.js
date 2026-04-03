const subscriptions = [
  { id: 1, name: 'StreamFi',    category: 'Entertainment', monthlyUSDC: 9.99,  lastUsed: '2026-04-01', usageScore: 85, active: true, address: '0x1234567890123456789012345678901234567890' },
  { id: 2, name: 'MusicDAO',    category: 'Music',         monthlyUSDC: 4.99,  lastUsed: '2026-03-10', usageScore: 20, active: true, address: '0x2345678901234567890123456789012345678901' },
  { id: 3, name: 'CloudStore3', category: 'Storage',       monthlyUSDC: 14.99, lastUsed: '2026-04-02', usageScore: 95, active: true, address: '0x3456789012345678901234567890123456789012' },
  { id: 4, name: 'GameFi Pass', category: 'Gaming',        monthlyUSDC: 19.99, lastUsed: '2026-02-15', usageScore: 10, active: true, address: '0x4567890123456789012345678901234567890123' },
  { id: 5, name: 'NewsChain',   category: 'News',          monthlyUSDC: 2.99,  lastUsed: '2026-03-28', usageScore: 60, active: true, address: '0x5678901234567890123456789012345678901234' }
];

const owsPolicy = { monthlyBudgetUSDC: 40, cancelIfUsageBelow: 30, requireApprovalAbove: 15 };
let nextId = 6;

function resetSubscriptions() {
  subscriptions.length = 0;
  subscriptions.push(
    { id: 1, name: 'StreamFi',    category: 'Entertainment', monthlyUSDC: 9.99,  lastUsed: '2026-04-01', usageScore: 85, active: true, address: '0x1234567890123456789012345678901234567890' },
    { id: 2, name: 'MusicDAO',    category: 'Music',         monthlyUSDC: 4.99,  lastUsed: '2026-03-10', usageScore: 20, active: true, address: '0x2345678901234567890123456789012345678901' },
    { id: 3, name: 'CloudStore3', category: 'Storage',       monthlyUSDC: 14.99, lastUsed: '2026-04-02', usageScore: 95, active: true, address: '0x3456789012345678901234567890123456789012' },
    { id: 4, name: 'GameFi Pass', category: 'Gaming',        monthlyUSDC: 19.99, lastUsed: '2026-02-15', usageScore: 10, active: true, address: '0x4567890123456789012345678901234567890123' },
    { id: 5, name: 'NewsChain',   category: 'News',          monthlyUSDC: 2.99,  lastUsed: '2026-03-28', usageScore: 60, active: true, address: '0x5678901234567890123456789012345678901234' }
  );
  nextId = 6;
}

function getSubscriptions() { return subscriptions; }
function getTotalMonthly() { return subscriptions.filter(s => s.active).reduce((sum, s) => sum + s.monthlyUSDC, 0); }
function cancelSubscription(id) { const sub = subscriptions.find(s => s.id === id); if (sub) { sub.active = false; return sub; } return null; }

function addSubscription(data) {
  const sub = {
    id: nextId++,
    name: data.name || 'New Service',
    category: data.category || 'Other',
    monthlyUSDC: Number(data.monthlyUSDC) || 0,
    lastUsed: new Date().toISOString().split('T')[0],
    usageScore: Number(data.usageScore) || 50,
    active: true,
    address: data.address || '0x' + Math.random().toString(16).slice(2, 42)
  };
  subscriptions.push(sub);
  return sub;
}

function updatePolicy(patch) {
  if (patch.monthlyBudgetUSDC !== undefined)    owsPolicy.monthlyBudgetUSDC    = Number(patch.monthlyBudgetUSDC);
  if (patch.cancelIfUsageBelow !== undefined)   owsPolicy.cancelIfUsageBelow   = Number(patch.cancelIfUsageBelow);
  if (patch.requireApprovalAbove !== undefined) owsPolicy.requireApprovalAbove = Number(patch.requireApprovalAbove);
  return owsPolicy;
}

module.exports = { getSubscriptions, getTotalMonthly, cancelSubscription, resetSubscriptions, addSubscription, updatePolicy, owsPolicy };
