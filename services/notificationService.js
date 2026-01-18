const Notification = require('../models/Notification.js');
const NotificationSettings = require('../models/NotificationSettings.js');
const User = require('../models/User.js');
const { sendNotificationEmail } = require('./emailService.js');

// Tworzy powiadomienie dla użytkownika
async function createNotification({
  userId,
  type,
  messageKey,
  targetId = null,
  contentId = null,
  data,
  forced = false
}) {
  let settings = await NotificationSettings.findOne({ userId });

  if (!settings) {
    settings = await NotificationSettings.create({ userId });
  }

  if (!forced && settings[type] === false) return;

  const notif = await Notification.create({
    userId,
    type,
    messageKey,
    targetId,
    contentId,
    data
  });

  // 📧 MAIL
  if (settings.emailEnabled) {
    const user = await User.findById(userId);
    if (user?.email) {
      await sendNotificationEmail(user.email, messageKey);
    }
  }

  return notif;
}

module.exports = {
  createNotification
};