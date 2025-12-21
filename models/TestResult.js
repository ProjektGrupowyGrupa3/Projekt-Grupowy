const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true }, // Bezpośrednie ID przedmiotu!
  
  score: { type: Number, required: true },         // Wynik w % (np. 85)
  totalQuestions: { type: Number, required: true }, // np. 20
  correctAnswers: { type: Number, required: true }, // np. 17
  
  duration: { type: Number }, // Czas trwania w sekundach (opcjonalnie)
}, { timestamps: true });

module.exports = mongoose.model('TestResult', testResultSchema);