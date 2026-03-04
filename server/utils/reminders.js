const Notification = require('../models/Notification');

function parseDateOnly(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

function dateOffset(dateString, offsetDays) {
  const dt = parseDateOnly(dateString);
  dt.setDate(dt.getDate() - offsetDays);
  return dt;
}

function isoDate(dateObj) {
  return dateObj.toISOString().slice(0, 10);
}

async function syncReminderHistory(user, subscriptions) {
  const now = new Date();

  for (const sub of subscriptions) {
    const schedule = [
      { enabled: sub.reminders.sevenDays, days: 7, label: '7 days' },
      { enabled: sub.reminders.oneDay, days: 1, label: '1 day' },
      { enabled: sub.reminders.sameDay, days: 0, label: 'same day' }
    ].filter((x) => x.enabled);

    for (const rule of schedule) {
      const scheduledDate = dateOffset(sub.nextChargeDate, rule.days);
      const scheduledIso = isoDate(scheduledDate);

      if (scheduledDate <= now) {
        const channels = [];
        if (sub.reminders.email && user.emailEnabled) channels.push('email');
        if (sub.reminders.sms && user.smsEnabled && user.smsVerified) channels.push('sms');

        for (const channel of channels) {
          const key = `${sub._id}-${rule.days}-${scheduledIso}-${channel}`;
          const existing = await Notification.findOne({ userId: user._id, dedupeKey: key });
          if (!existing) {
            await Notification.create({
              userId: user._id,
              subscriptionId: sub._id,
              channel,
              kind: 'reminder',
              message: `${sub.service} renews on ${sub.nextChargeDate} (${rule.label} reminder).`,
              scheduledFor: scheduledIso,
              status: 'sent',
              dedupeKey: key
            });
          }
        }
      }
    }
  }
}

function buildUpcoming(user, subscriptions, daysAhead = 30) {
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);
  const upcoming = [];

  subscriptions.forEach((sub) => {
    const schedule = [
      { enabled: sub.reminders.sevenDays, days: 7, label: '7 days' },
      { enabled: sub.reminders.oneDay, days: 1, label: '1 day' },
      { enabled: sub.reminders.sameDay, days: 0, label: 'same day' }
    ].filter((x) => x.enabled);

    schedule.forEach((rule) => {
      const scheduledDate = dateOffset(sub.nextChargeDate, rule.days);
      if (scheduledDate > now && scheduledDate <= cutoff) {
        if (sub.reminders.email && user.emailEnabled) {
          upcoming.push({
            id: `${sub._id}-email-${rule.days}`,
            channel: 'email',
            scheduledFor: isoDate(scheduledDate),
            message: `${sub.service} renews on ${sub.nextChargeDate} (${rule.label} reminder).`
          });
        }
        if (sub.reminders.sms && user.smsEnabled && user.smsVerified) {
          upcoming.push({
            id: `${sub._id}-sms-${rule.days}`,
            channel: 'sms',
            scheduledFor: isoDate(scheduledDate),
            message: `${sub.service} renews on ${sub.nextChargeDate} (${rule.label} reminder).`
          });
        }
      }
    });
  });

  return upcoming.sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : 1));
}

module.exports = { syncReminderHistory, buildUpcoming };
