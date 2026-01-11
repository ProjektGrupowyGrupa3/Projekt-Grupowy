const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  q: { type: String, required: true }, 
  a: { type: String, required: true }  
});

const flashcardDeckSchema = new mongoose.Schema({
  name: { type: String, required: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cards: [cardSchema],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FlashcardDeck', flashcardDeckSchema);