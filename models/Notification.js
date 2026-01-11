const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  type: {
    type: String,
    enum: [
      'comment_test',
      'test_rated',
      'ranking',
      'comment_reply',
      'moderation_decision',
      'content_reported',
      'password_change',
      'comment_removed'
    ],
    required: true
  },

  messageKey: {
    type: String,
    required: true
  },

  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notifications', notificationSchema);