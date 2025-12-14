var express = require('express');
var router = express.Router();

/* GET test list page. */
router.get('/', function(req, res, next) {
  res.render('user-test-list', { title: 'Projekt' });
});

module.exports = router;