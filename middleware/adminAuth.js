const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = (minAccessLvl) => async (req, res, next) => {
  try {

    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;

    }
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (user.accessLvl < minAccessLvl) {
      return res.status(403).json({ message: "Insufficient access level" });
    }

    req.user = user; // attach user info
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid token" });
  }
};
