var express = require('express');
var router = express.Router();
const { addPoints } = require("../services/pointsService");


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('quiz-learn', { title: 'Projekt' });
});

module.exports = router;
