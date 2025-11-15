const mongoose = require('mongoose');

const ResetTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  email: { type: String, required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 }  // TTL: 1 hour
},{ collection : "resetTokens" });;

module.exports = mongoose.model('ResetToken', ResetTokenSchema);
