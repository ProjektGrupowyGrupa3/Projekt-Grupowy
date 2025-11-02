const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getQuestions } = require("../controllers/questionController");

router.get('/', protect, getQuestions);

module.exports = router;