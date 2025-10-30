const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Define Mongoose models dynamically
const getModelByLanguage = (language) => {
    var lang = ""
    if (language === 'eng') lang = "QuestionsEng"
    else lang = "QuestionsPol"
    const schema = new mongoose.Schema({
    q: String,
    options: [String],
    answer: Number,
    explain: String,
    tag: String,},
        { collection : lang });

    if (language === 'eng') return mongoose.models.QuestionsEng || mongoose.model('QuestionsEng', schema);
    if (language === 'pol') return mongoose.models.QuestionsPol || mongoose.model('QuestionsPol', schema);

    return null;
};

//GET /api/questions/tags?language=eng
// Returns unique tags from selected language collection
router.get('/tags', async (req, res) => {
  try {
    const { language } = req.query;
    if (!language) return res.status(400).json({ message: 'Language is required (eng or pol)' });

    const Model = getModelByLanguage(language.toLowerCase());
    if (!Model) return res.status(400).json({ message: 'Invalid language specified' });

    const tags = await Model.distinct('tag');

    res.json({ language, tags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// OST /api/questions/random
// Body: { "language": "eng", "tag": "Loops", "amount": 5 }
router.post('/random', async (req, res) => {
  try {
    const { language, tag, amount } = req.body;

    if (!language || !tag || !amount)
      return res.status(400).json({ message: 'language, tag, and amount are required' });

    const Model = getModelByLanguage(language.toLowerCase());
    if (!Model) return res.status(400).json({ message: 'Invalid language specified' });

    const questions = await Model.aggregate([
      { $match: { tag } },
      { $sample: { size: parseInt(amount, 10) } },
    ]);

    res.json({ language, tag, count: questions.length, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
