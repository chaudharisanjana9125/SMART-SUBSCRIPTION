const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { monthlyEquivalent, generateInsights } = require('../utils/insights');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  const subscriptions = await Subscription.find({ userId: req.user.id, status: { $ne: 'canceled' } });
  const insights = generateInsights(subscriptions, user.currency);

  const monthlyTotal = subscriptions.reduce((sum, sub) => sum + monthlyEquivalent(sub), 0);
  return res.json({ insights, monthlyTotal: Number(monthlyTotal.toFixed(2)) });
});

router.post('/apply', auth, async (req, res) => {
  const { action, subscriptionId } = req.body;
  const sub = await Subscription.findOne({ _id: subscriptionId, userId: req.user.id });
  if (!sub) return res.status(404).json({ message: 'Subscription not found' });

  if (action === 'mark_cancel') {
    sub.flaggedForCancel = true;
    sub.status = 'paused';
  }

  if (action === 'downgrade') {
    sub.notes = `${sub.notes}\nConsider downgrade option.`.trim();
  }

  if (action === 'set_reminder') {
    sub.reminders.sevenDays = true;
    sub.reminders.oneDay = true;
  }

  if (action === 'add_note') {
    sub.notes = `${sub.notes}\nInsights: review this subscription.`.trim();
  }

  await sub.save();
  return res.json({ message: 'Action applied', item: sub });
});

module.exports = router;
