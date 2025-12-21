const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    // Check for token in cookie
    const token = req.cookies?.token;
    if (!token) return res.status(401).send("Access denied. No token provided.");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user payload to request
    next();
  } catch (err) {
    res.status(401).send("Invalid token.");
  }
};