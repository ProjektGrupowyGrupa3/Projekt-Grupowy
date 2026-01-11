const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true
  },

  comment_test: { type: Boolean, default: true },
  test_rated: { type: Boolean, default: true },
  ranking: { type: Boolean, default: true },
  comment_reply: { type: Boolean, default: true },
  emailEnabled: { type: Boolean, default: true }

}, { timestamps: true });

module.exports = mongoose.model(
  'Notificationsettings',
  notificationSettingsSchema
);