const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { saveAnswer, toggleSave } = require('../controllers/UserProgressController');

router.post('/save', protect, saveAnswer);
router.post('/toggle-save', protect, toggleSave);

module.exports = router;