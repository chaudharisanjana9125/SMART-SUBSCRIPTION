const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, termsAccepted } = req.body;
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (!termsAccepted) {
      return res.status(400).json({ message: 'You must accept terms' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      termsAccepted
    });

    return res.status(201).json({
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        country: user.country,
        currency: user.currency,
        phone: user.phone,
        timezone: user.timezone,
        appName: user.appName,
        smsVerified: user.smsVerified,
        smsEnabled: user.smsEnabled,
        emailEnabled: user.emailEnabled
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    return res.json({
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        country: user.country,
        currency: user.currency,
        phone: user.phone,
        timezone: user.timezone,
        appName: user.appName,
        smsVerified: user.smsVerified,
        smsEnabled: user.smsEnabled,
        emailEnabled: user.emailEnabled
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash -verificationCode');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ user });
});

router.post('/logout', (_req, res) => res.json({ message: 'Logged out' }));

router.delete('/account', auth, async (req, res) => {
  await Subscription.deleteMany({ userId: req.user.id });
  await Notification.deleteMany({ userId: req.user.id });
  await User.findByIdAndDelete(req.user.id);
  return res.json({ message: 'Account deleted' });
});

module.exports = router;
