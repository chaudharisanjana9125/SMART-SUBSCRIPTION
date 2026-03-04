const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const { syncReminderHistory, buildUpcoming } = require('../utils/reminders');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  const subscriptions = await Subscription.find({ userId: req.user.id, status: { $ne: 'canceled' } });
  await syncReminderHistory(user, subscriptions);

  const upcoming = buildUpcoming(user, subscriptions, 30);
  const history = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100);

  return res.json({ upcoming, history });
});

router.post('/test', auth, async (req, res) => {
  const { channel } = req.body;
  const user = await User.findById(req.user.id);

  if (channel === 'sms' && (!user.smsEnabled || !user.smsVerified)) {
    return res.status(400).json({ message: 'Enable and verify SMS first' });
  }
  if (channel === 'email' && !user.emailEnabled) {
    return res.status(400).json({ message: 'Email notifications are disabled' });
  }

  const created = await Notification.create({
    userId: req.user.id,
    channel,
    kind: 'test',
    message: `Test ${channel.toUpperCase()} notification from SubSense.`,
    status: 'sent',
    dedupeKey: `test-${channel}-${Date.now()}`
  });

  return res.json({ message: 'Test notification sent', item: created });
});

module.exports = router;
