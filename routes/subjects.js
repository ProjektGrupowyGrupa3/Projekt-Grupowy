const express = require('express');
const router = express.Router();
const { getSubjects } = require('../controllers/subjectController');


router.get('/', getSubjects);

module.exports = router;