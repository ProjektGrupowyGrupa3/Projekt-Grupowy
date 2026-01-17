const mongoose = require('mongoose');

const userTestResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserTest', required: true },
  
  testTitle: { type: String, required: true },
  authorName: { type: String, default: "Nieznany" },
  
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  passed: { type: Boolean, required: true },

  // Zapamiętuje, czy system przyznał punkty za to podejście
  pointsAwarded: { type: Boolean, default: false }, 

}, { timestamps: true });

module.exports = mongoose.model('UserTestResult', userTestResultSchema);