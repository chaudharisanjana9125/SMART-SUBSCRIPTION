const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    sevenDays: { type: Boolean, default: true },
    oneDay: { type: Boolean, default: true },
    sameDay: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    service: { type: String, required: true, trim: true },
    plan: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    billingCycle: { type: String, enum: ['monthly', 'annual', 'weekly'], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['USD', 'INR', 'AED'], required: true },
    startDate: { type: String, required: true },
    nextChargeDate: { type: String, required: true, index: true },
    paymentMethod: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['active', 'paused', 'canceled'], default: 'active' },
    reminders: { type: reminderSchema, default: () => ({}) },
    priceLastUpdated: { type: String, default: '' },
    manualPriceOverride: { type: Boolean, default: false },
    usageDaysAgo: { type: Number, default: 7 },
    flaggedForCancel: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
