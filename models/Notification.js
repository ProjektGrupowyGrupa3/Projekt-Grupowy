const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // ID obiektu docelowego (np. ID testu)
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  contentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    default: null 
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
      'comment_removed',
      'difficulty_rated'
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
  },
  data: { 
    type: Object, 
    default: {} 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);