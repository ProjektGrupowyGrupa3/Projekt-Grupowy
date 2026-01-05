var express = require('express');
var router = express.Router();
const path = require('path');
const auth = require('../middleware/auth');
const CustomTest = require('../models/CustomTest');


router.get('/', function(req, res, next) {
  res.render('create-test', { title: 'Projekt' });
});


//Zapisywanie testu
router.post('/save', auth, async (req, res) => {
    try {
        const { title, subject, questions, isPublic } = req.body;
        
        const newTest = new CustomTest({
            title,
            subject,
            questions, 
            isPublic,
            author: req.user ? req.user._id : null 
        });

        await newTest.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Test utworzony!', 
            testId: newTest._id 
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            success: false, 
            message: 'Błąd serwera podczas zapisu' 
        });
    }
});

// Pobieranie testów użytkownika
router.get('/my-tests', auth,  async (req, res) => {
    try {
        const userId = req.user ? req.user._id : null;

        if (!userId) {
            return res.status(401).json({ message: "Nie jesteś zalogowany" });
        }

        const myTests = await CustomTest.find({ author: userId })
            .populate('subject', 'name') 
            .sort({ createdAt: -1 });    

        res.json(myTests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Błąd pobierania testów" });
    }
});

// Usuwanie testu
router.delete('/:id', auth,  async (req, res) => {
    try {
        const testId = req.params.id;
        const userId = req.user._id;

        const result = await CustomTest.findOneAndDelete({ _id: testId, author: userId });

        if (!result) {
            return res.status(404).json({ message: "Test nie znaleziony lub brak uprawnień" });
        }

        res.json({ success: true, message: "Usunięto" });
    } catch (err) {
        res.status(500).json({ message: "Błąd usuwania" });
    }
});

module.exports = router;