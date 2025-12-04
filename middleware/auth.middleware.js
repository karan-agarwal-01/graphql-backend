const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    // No token → treat as guest user (user = null)
    if (!token) {
      req.user = null;
      return next();
    }

    // Try verifying token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Fetch user
    const user = await User.findById(decoded.id).lean();

    // Token valid but user deleted
    if (!user) {
      req.user = null;
      return next();
    }

    req.user = user; // SUCCESS
    return next();

  } catch (error) {
    // Token expired OR invalid → do NOT crash, do NOT redirect
    req.user = null;
    return next();
  }
};

module.exports = auth;
