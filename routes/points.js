const express = require('express');
const router = express.Router();
const { addPoints } = require('../services/pointsService');
const auth = require('../middleware/auth');


router.post('/add', auth, async (req, res) => {
    try {
        const { type, amount, questionId } = req.body;
        const userId = req.user._id;

        // addPoints zwraca TRUE (dodano) lub FALSE (nie dodano/duplikat)
        const wasAdded = await addPoints(userId, type, amount, questionId);

        if (wasAdded) {
            // Sukces - punkty faktycznie dodane
            res.json({ 
                success: true, 
                message: "Punkty zostały przyznane." 
            });
        } else {
            // Porażka - punkty nie zostały dodane (np. już były przyznane)
            // Zwracamy success: false, żeby frontend NIE aktualizował licznika
            res.json({ 
                success: false, 
                message: "Punkty za tę akcję zostały już przyznane wcześniej." 
            });
        }

    } catch (err) {
        console.error("❌ Błąd dodawania punktów:", err);
        res.status(500).json({ success: false, error: "Błąd serwera." });
    }
});


module.exports = router;