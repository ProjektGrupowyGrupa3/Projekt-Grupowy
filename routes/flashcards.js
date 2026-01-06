var express = require('express');
var router = express.Router();
const auth = require('../middleware/auth');
const FlashcardDeck = require('../models/FlashcardDeck');

/* GET flashcards page. */
router.get('/', function(req, res, next) {
  res.render('flashcards', { title: 'Projekt' });
});


// Pobierz wszystkie zestawy zalogowanego użytkownika
router.get('/api', auth, async (req, res) => {
  try {
    const decks = await FlashcardDeck.find({ creatorId: req.user._id }).sort({ updatedAt: -1 });
    res.json(decks);
  } catch (err) {
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Zapisz nowy zestaw lub zaktualizuj istniejący
router.post('/api', auth, async (req, res) => {
  try {
    const { name, cards } = req.body;
    
    // Szukamy czy zestaw o tej nazwie już istnieje dla tego użytkownika
    let deck = await FlashcardDeck.findOne({ name, creatorId: req.user._id });

    if (deck) {
      // Aktualizacja
      deck.cards = cards;
      deck.updatedAt = Date.now();
      await deck.save();
    } else {
      // Tworzenie nowego
      deck = new FlashcardDeck({
        name,
        cards,
        creatorId: req.user._id
      });
      await deck.save();
    }
    res.status(201).json(deck);
  } catch (err) {
    res.status(400).json({ message: "Błąd zapisu danych" });
  }
});

// Usuń zestaw
router.delete('/api/:id', auth, async (req, res) => {
  try {
    await FlashcardDeck.findOneAndDelete({ _id: req.params.id, creatorId: req.user._id });
    res.json({ message: "Usunięto" });
  } catch (err) {
    res.status(500).json({ message: "Błąd usuwania" });
  }
});


module.exports = router;