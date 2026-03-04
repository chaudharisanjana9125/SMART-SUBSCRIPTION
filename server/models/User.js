const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    termsAccepted: { type: Boolean, default: false },
    country: { type: String, default: 'United States' },
    currency: { type: String, enum: ['USD', 'INR', 'AED'], default: 'USD' },
    phone: { type: String, default: '' },
    timezone: { type: String, default: 'UTC' },
    smsVerified: { type: Boolean, default: false },
    smsEnabled: { type: Boolean, default: false },
    emailEnabled: { type: Boolean, default: true },
    appName: { type: String, default: 'SubSense' },
    verificationCode: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
