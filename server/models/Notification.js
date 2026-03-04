const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    kind: { type: String, enum: ['reminder', 'test'], default: 'reminder' },
    message: { type: String, required: true },
    scheduledFor: { type: String, default: '' },
    status: { type: String, enum: ['upcoming', 'sent'], default: 'sent' },
    dedupeKey: { type: String, default: '', index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
