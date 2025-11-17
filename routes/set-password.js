const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', async (req, res) => {
  res.render('reset-password-new', { title: 'Projekt' });
});

module.exports = router;
module.exports = router;