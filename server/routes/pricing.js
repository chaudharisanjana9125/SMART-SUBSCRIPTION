const express = require('express');
const auth = require('../middleware/auth');
const { PRICE_LIBRARY, resolvePrice } = require('../utils/priceLibrary');

const router = express.Router();

router.get('/library', auth, (_req, res) => {
  const services = Object.entries(PRICE_LIBRARY).map(([service, value]) => ({
    service,
    category: value.category,
    plans: Object.keys(value.plans)
  }));

  return res.json({ services });
});

router.get('/resolve', auth, (req, res) => {
  const { service, plan, currency } = req.query;
  if (!service || !plan || !currency) {
    return res.status(400).json({ message: 'service, plan, currency are required' });
  }
  return res.json(resolvePrice(service, plan, currency));
});

module.exports = router;
