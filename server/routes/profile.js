const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { COUNTRY_DEFAULTS } = require('../utils/priceLibrary');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash -verificationCode');
  return res.json({ user });
});

router.put('/', auth, async (req, res) => {
  const updates = { ...req.body };
  delete updates.email;
  delete updates.passwordHash;

  if (updates.country && !updates.currency) {
    updates.currency = COUNTRY_DEFAULTS[updates.country] || 'USD';
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-passwordHash -verificationCode');
  return res.json({ user });
});

router.post('/verify-phone/send', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user.phone) return res.status(400).json({ message: 'Phone number is required first' });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  user.verificationCode = code;
  await user.save();

  return res.json({ message: 'Verification code sent (demo code returned)', demoCode: code });
});

router.post('/verify-phone/check', auth, async (req, res) => {
  const { code } = req.body;
  const user = await User.findById(req.user.id);
  if (!code || code !== user.verificationCode) {
    return res.status(400).json({ message: 'Invalid code' });
  }

  user.smsVerified = true;
  user.smsEnabled = true;
  user.verificationCode = '';
  await user.save();
  return res.json({ message: 'Phone verified', smsVerified: true });
});

module.exports = router;
