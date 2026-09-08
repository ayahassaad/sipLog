const bcrypt = require("bcryptjs");

// 12 rounds is a stronger-than-default cost factor (bcrypt's own default is
// 10) without being slow enough to hurt login/register latency noticeably.
// Bumping this later never invalidates existing hashes -- each bcrypt hash
// carries its own cost factor, so old hashes keep verifying correctly.
const SALT_ROUNDS = 12;

function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

function comparePassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

module.exports = { hashPassword, comparePassword };
