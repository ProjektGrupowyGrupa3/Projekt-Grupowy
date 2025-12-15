const User = require('../models/User');


exports.getRanking = async (req, res) => {
  try {
    const top = parseInt(req.query.limit) || 50;

    const ranking = await User.find({}, "name points")
      .sort({ points: -1 })
      .limit(top)
      .lean();

    res.json({ success: true, ranking });
  } catch (err) {
    console.error("Ranking error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.getUserRank = async (req, res) => {
  try {
    const betterUsersCount = await User.countDocuments({
      points: { $gt: req.user.points }
    });

    res.json({
      success: true,
      rank: betterUsersCount + 1
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
