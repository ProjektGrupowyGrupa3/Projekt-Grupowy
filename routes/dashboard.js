const express = require('express');
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");
const auth = require('../middleware/auth'); 


/* GET flashcards page. */
router.get('/', function(req, res, next) {
  res.render('dashboard', { title: 'Projekt' });
});

router.get('/api', auth, getDashboardStats);

module.exports = router;