const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', function(req, res, next) {
    res.render('reset-password', { title: 'Projekt' });
});

module.exports = router;