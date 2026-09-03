const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");
const { setAuthCookie, clearAuthCookie } = require("../utils/cookies");

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
}

function validateCredentialsShape(body, { requireName = false } = {}) {
  const errors = [];

  if (requireName && (typeof body.name !== "string" || !body.name.trim())) {
    errors.push("name is required");
  }

  if (typeof body.email !== "string" || !body.email.trim()) {
    errors.push("email is required");
  }

  if (typeof body.password !== "string" || body.password.length < 8) {
    errors.push("password must be at least 8 characters");
  }

  return errors;
}

exports.register = async (req, res) => {
  try {
    const errors = validateCredentialsShape(req.body, { requireName: true });
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(". ") });
    }

    const email = req.body.email.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "An account with that email already exists" });
    }

    const passwordHash = await hashPassword(req.body.password);
    const user = await User.create({
      name: req.body.name.trim(),
      email,
      passwordHash,
    });

    const token = signToken(user);
    setAuthCookie(res, token);
    res.status(201).json({ user: toPublicUser(user) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validateCredentialsShape(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(". ") });
    }

    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await comparePassword(req.body.password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.logout = async (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
};

exports.me = async (req, res) => {
  res.json({ user: toPublicUser(req.user) });
};
