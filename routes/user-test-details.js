var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const testId = req.query.testId || '1';
  res.render('user-test-details', { title: 'Projekt' , testId: testId});
});

module.exports = router;