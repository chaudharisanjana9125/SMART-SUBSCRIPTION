function monthlyEquivalent(subscription) {
  if (subscription.billingCycle === 'annual') return subscription.amount / 12;
  if (subscription.billingCycle === 'weekly') return subscription.amount * 4.345;
  return subscription.amount;
}

function generateInsights(subscriptions, currency) {
  const insights = [];
  if (!subscriptions.length) return insights;

  const byService = new Map();
  let totalMonthly = 0;
  const categoryTotal = new Map();

  subscriptions.forEach((s) => {
    const eq = monthlyEquivalent(s);
    totalMonthly += eq;
    byService.set(s.service, (byService.get(s.service) || 0) + 1);
    categoryTotal.set(s.category, (categoryTotal.get(s.category) || 0) + eq);

    if (s.billingCycle === 'monthly' && s.status === 'active') {
      insights.push({
        id: `annual-${s._id}`,
        type: 'switch_annual',
        severity: 'medium',
        text: `${s.service} may be cheaper on annual billing.`,
        actionLabel: 'Add note',
        action: 'add_note',
        subscriptionId: s._id
      });
    }

    if (typeof s.usageDaysAgo === 'number' && s.usageDaysAgo > 30 && s.status === 'active') {
      insights.push({
        id: `unused-${s._id}`,
        type: 'unused',
        severity: 'high',
        text: `${s.service} has not been used recently (${s.usageDaysAgo} days).`,
        actionLabel: 'Mark for cancel',
        action: 'mark_cancel',
        subscriptionId: s._id
      });
    }
  });

  byService.forEach((count, service) => {
    if (count > 1) {
      const sub = subscriptions.find((x) => x.service === service);
      insights.push({
        id: `duplicate-${service}`,
        type: 'duplicate',
        severity: 'high',
        text: `You have ${count} ${service} subscriptions.`,
        actionLabel: 'Review downgrade',
        action: 'downgrade',
        subscriptionId: sub ? sub._id : null
      });
    }
  });

  if (totalMonthly > 200) {
    insights.push({
      id: 'high-spend',
      type: 'high_spend',
      severity: 'medium',
      text: `Monthly equivalent spend is high (${currency} ${totalMonthly.toFixed(2)}).`,
      actionLabel: 'Set reminders',
      action: 'set_reminder',
      subscriptionId: subscriptions[0]._id
    });
  }

  const categoryArr = [...categoryTotal.entries()].sort((a, b) => b[1] - a[1]);
  if (categoryArr.length > 0) {
    const [cat, amount] = categoryArr[0];
    if (amount > totalMonthly * 0.4) {
      insights.push({
        id: `overspend-${cat}`,
        type: 'category_overspend',
        severity: 'medium',
        text: `${cat} is ${((amount / totalMonthly) * 100).toFixed(0)}% of your monthly spend.`,
        actionLabel: 'Add note',
        action: 'add_note',
        subscriptionId: subscriptions.find((s) => s.category === cat)._id
      });
    }
  }

  return insights.slice(0, 10);
}

module.exports = { monthlyEquivalent, generateInsights };
