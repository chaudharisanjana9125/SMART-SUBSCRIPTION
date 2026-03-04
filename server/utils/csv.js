function toCsv(subscriptions) {
  const headers = [
    'service', 'plan', 'category', 'billingCycle', 'amount', 'currency', 'startDate',
    'nextChargeDate', 'paymentMethod', 'status', 'notes'
  ];
  const rows = subscriptions.map((s) => [
    s.service,
    s.plan,
    s.category,
    s.billingCycle,
    s.amount,
    s.currency,
    s.startDate,
    s.nextChargeDate,
    s.paymentMethod,
    s.status,
    (s.notes || '').replace(/\n/g, ' ')
  ]);

  const escapeValue = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers, ...rows].map((r) => r.map(escapeValue).join(',')).join('\n');
}

module.exports = { toCsv };
