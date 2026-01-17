const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { saveAnswer, toggleSave } = require('../controllers/UserProgressController');
const UserProgress = require('../models/UserProgress');
const Question = require('../models/Question');

router.post('/save', auth, saveAnswer);
router.post('/toggle-save', auth, toggleSave);

// POST /api/user-progress/reset
router.post('/reset', auth, async (req, res) => {
    try {
        const { subjectId } = req.body;
        const userId = req.user._id;

        if (!subjectId) return res.status(400).json({ message: "Missing subjectId" });

        const questions = await Question.find({ subject: subjectId }).select('_id');
        const questionIds = questions.map(q => q._id);

        if (questionIds.length === 0) {
             return res.json({ success: true, message: "No questions found for this subject." });
        }

        await UserProgress.deleteMany({
            userId: userId,
            questionId: { $in: questionIds }
        });

        res.json({ success: true, message: "Progress reset successfully." });

    } catch (err) {
        console.error("Reset error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/user-progress/subject/:subjectId/status
router.get('/subject/:subjectId/status', auth, async (req, res) => {
    try {
        const { subjectId } = req.params;
        const userId = req.user._id;

        // wszystkie pytania z przedmiotu
        const questionIds = await Question
            .find({ subject: subjectId })
            .distinct('_id');

        const totalQuestions = questionIds.length;

        if (totalQuestions === 0) {
            return res.json({
                totalQuestions: 0,
                answeredQuestions: 0,
                isCompleted: false
            });
        }

        // ile użytkownik przerobił
        const answeredQuestions = await UserProgress.countDocuments({
            userId,
            questionId: { $in: questionIds }
        });

        res.json({
            totalQuestions,
            answeredQuestions,
            isCompleted: answeredQuestions >= totalQuestions
        });

    } catch (err) {
        console.error("Status error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;