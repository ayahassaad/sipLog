const jwt = require("jsonwebtoken");

const TOKEN_EXPIRY = "7d";

function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, verifyToken, TOKEN_EXPIRY };
