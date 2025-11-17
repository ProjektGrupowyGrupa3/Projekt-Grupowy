const mongoose = require('mongoose');

const userAnswerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  correct: { type: Boolean, default: null },
  saved: { type: Boolean, default: false },   // Czy użytkownik zapisał pytanie jako "zapamiętane"
  answerCount: { type: Number, default: 1 }     // Ile razy użytkownik odpowiadał na to pytanie
}, 
{ timestamps: true });

// Zapobiega duplikowaniu odpowiedzi dla tego samego pytania i użytkownika
userAnswerSchema.index({ userId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model("UserProgress", userAnswerSchema, "userProgress");

