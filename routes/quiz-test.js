var express = require('express');
var router = express.Router();
const auth = require('../middleware/auth');
const TestResult = require('../models/TestResult');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('quiz-test', { title: 'Projekt' });
});

// POST /api/quiz/save-result
router.post('/save-result', auth, async (req, res) => {
    try {
        const { subjectId, score, totalQuestions, correctAnswers } = req.body;

        // Tworzymy wpis w bazie
        const newResult = await TestResult.create({
            userId: req.user._id,
            subjectId: subjectId,
            score: score,                // np. 85 (%)
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
        });

        res.status(201).json({ success: true, resultId: newResult._id });

    } catch (err) {
        console.error("Błąd zapisu wyniku testu:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;
