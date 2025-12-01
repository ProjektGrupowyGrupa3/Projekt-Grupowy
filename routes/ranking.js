const express = require("express");
const router = express.Router();
const { getRanking, getUserRank } = require("../controllers/rankingController");
const { protect } = require("../middleware/auth");

router.get("/api", getRanking);

router.get("/", function(req, res, next) {
  res.render("rank", { title: "Ranking" });
});


module.exports = router;
