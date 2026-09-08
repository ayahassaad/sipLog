const { Server } = require("socket.io");
const { verifyToken } = require("./utils/jwt");
const { COOKIE_NAME } = require("./utils/cookies");
const User = require("./models/User");

let io = null;

// There's no cookie-parser running on a raw socket handshake, so pull the
// one cookie we care about out of the header by hand.
function readCookie(cookieHeader, name) {
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

// Wires up Socket.IO on top of the existing HTTP server. Called once from
// server.js -- everything else in this file (emitToUser) talks to the
// instance created here.
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  // Trusts the same session cookie the REST API does, verified the same
  // way requireAuth verifies it -- a socket connection is only accepted
  // once it proves the same identity a normal request would need.
  io.use(async (socket, next) => {
    try {
      const token = readCookie(socket.handshake.headers.cookie, COOKIE_NAME);
      if (!token) {
        return next(new Error("Not authenticated"));
      }

      const payload = verifyToken(token);
      const user = await User.findById(payload.sub);
      if (!user) {
        return next(new Error("Not authenticated"));
      }

      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error("Not authenticated"));
    }
  });

  // Every tab/device a user has open joins the same room, named after
  // their own id -- lets the rest of the app push "to this person" without
  // tracking individual socket ids anywhere.
  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
  });

  return io;
}

// Fire-and-forget push to everything one user has open. A harmless no-op
// before initSocket has run (e.g. under Jest, where the HTTP server this
// attaches to is never actually started) or when that user has no socket
// connected right now -- there's simply no room to emit to.
function emitToUser(userId, event, payload) {
  if (!io) {
    return;
  }
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSocket, emitToUser };
