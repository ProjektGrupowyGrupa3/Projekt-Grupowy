const express = require('express');
const router = express.Router();
const { addPoints } = require('../services/pointsService');
const auth = require('../middleware/auth');

router.post('/add', auth, async (req, res) => {
    try {
        const { type, amount, questionId } = req.body;
        const userId = req.user._id;

        const result = await addPoints(userId, type, amount, questionId);

        res.json({ success: true, result });
    } catch (err) {
        console.error("❌ Błąd dodawania punktów:", err);
        res.status(500).json({ error: "Błąd dodawania punktów." });
    }
});

module.exports = router;
