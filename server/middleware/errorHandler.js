// Centralized error handler. Controllers can either respond directly (existing
// pattern) or call next(err) to land here. Keeping both styles working avoids
// having to rewrite every existing controller at once.
function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
}

module.exports = { notFound, errorHandler };
