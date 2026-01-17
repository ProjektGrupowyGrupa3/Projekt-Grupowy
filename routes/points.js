const express = require('express');
const router = express.Router();
const { addPoints } = require('../services/pointsService');
const auth = require('../middleware/auth');

router.post('/add', auth, async (req, res) => {
    try {
        const { type, amount, questionId } = req.body;
        const userId = req.user._id;

        // addPoints zwraca obiekt { success: true, pointsAdded: X }  lub FALSE (jeśli błąd/zablokowane)
        const result = await addPoints(userId, type, amount, questionId);

        if (result && result.success) {
            res.json({ 
                success: true, 
                pointsAdded: result.pointsAdded, 
                message: "Operacja zakończona." 
            });
        } else {
            // Sytuacja gdy addPoints zwróciło false (np. duplikat logowania)
            res.json({ 
                success: false, 
                message: "Punkty za tę akcję zostały już przyznane wcześniej lub wystąpił błąd." 
            });
        }

    } catch (err) {
        console.error("❌ Błąd dodawania punktów:", err);
        res.status(500).json({ success: false, error: "Błąd serwera." });
    }
});

module.exports = router;