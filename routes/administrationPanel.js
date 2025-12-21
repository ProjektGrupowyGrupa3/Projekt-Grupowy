const express = require("express");
const router = express.Router();

const cookieAuth = require("../middleware/cookieAuth");
const adminAuth = require("../middleware/adminAuth");

router.get("/", cookieAuth, adminAuth(1), (req, res) => {
  res.render("adminPanel", {
    user: req.user
  });
});

module.exports = router;
