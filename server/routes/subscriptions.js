const express = require('express');
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');
const { toCsv } = require('../utils/csv');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const {
    search = '',
    sort = 'nextChargeDate',
    direction = 'asc',
    category,
    status,
    minAmount,
    maxAmount,
    renewalFrom,
    renewalTo
  } = req.query;

  const query = { userId: req.user.id };
  if (category) query.category = category;
  if (status) query.status = status;
  if (minAmount || maxAmount) {
    query.amount = {};
    if (minAmount) query.amount.$gte = Number(minAmount);
    if (maxAmount) query.amount.$lte = Number(maxAmount);
  }
  if (renewalFrom || renewalTo) {
    query.nextChargeDate = {};
    if (renewalFrom) query.nextChargeDate.$gte = renewalFrom;
    if (renewalTo) query.nextChargeDate.$lte = renewalTo;
  }
  if (search) {
    query.$or = [
      { service: { $regex: search, $options: 'i' } },
      { plan: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } }
    ];
  }

  const sortField = ['service', 'amount', 'nextChargeDate', 'status', 'category'].includes(sort)
    ? sort
    : 'nextChargeDate';
  const sortDir = direction === 'desc' ? -1 : 1;
  const items = await Subscription.find(query).sort({ [sortField]: sortDir, createdAt: -1 });
  return res.json({ items });
});

router.get('/export/csv', auth, async (req, res) => {
  const items = await Subscription.find({ userId: req.user.id }).sort({ createdAt: -1 });
  const csv = toCsv(items);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="subscriptions.csv"');
  return res.send(csv);
});

router.get('/:id', auth, async (req, res) => {
  const item = await Subscription.findOne({ _id: req.params.id, userId: req.user.id });
  if (!item) return res.status(404).json({ message: 'Subscription not found' });
  return res.json({ item });
});

router.post('/', auth, async (req, res) => {
  const payload = { ...req.body, userId: req.user.id };
  const item = await Subscription.create(payload);
  return res.status(201).json({ item });
});

router.put('/:id', auth, async (req, res) => {
  const item = await Subscription.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    req.body,
    { new: true }
  );

  if (!item) return res.status(404).json({ message: 'Subscription not found' });
  return res.json({ item });
});

router.delete('/:id', auth, async (req, res) => {
  const deleted = await Subscription.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!deleted) return res.status(404).json({ message: 'Subscription not found' });
  return res.json({ message: 'Deleted' });
});

module.exports = router;
