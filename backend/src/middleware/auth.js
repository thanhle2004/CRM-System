const jwt     = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

/**
 * auth.js
 *
 * JWT Authentication middleware.
 *
 * ── protect ──────────────────────────────────────────────────────────────────
 * Verifies Bearer token in the Authorization header.
 * Attaches decoded payload to req.user on success.
 * Used on all write routes (POST / PATCH / DELETE).
 *
 * ── restrictTo(...roles) ─────────────────────────────────────────────────────
 * Role-based access control (RBAC).
 * Must be used AFTER protect (requires req.user).
 * Supported roles: 'admin', 'staff'
 *
 * Usage in routes:
 *   router.delete('/:id', protect, restrictTo('admin'), CustomerController.remove);
 *   router.post('/score-all', protect, restrictTo('admin'), ChurnController.scoreAll);
 *
 * Token payload shape (set during login — implement login route separately):
 *   { id: <userId>, email: <email>, role: 'admin'|'staff', iat, exp }
 *
 * ── DEVELOPMENT NOTE ─────────────────────────────────────────────────────────
 * If you haven't implemented a login/register system yet, you can temporarily
 * bypass auth by replacing protect with this no-op middleware:
 *
 *   const bypass = (req, res, next) => next();
 *   module.exports = { protect: bypass, restrictTo: () => bypass };
 */

/**
 * Extract and verify JWT from Authorization: Bearer <token> header.
 */
function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Access denied. Please provide a valid token.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, iat, exp }
    next();
  } catch (err) {
    // jwt.verify throws JsonWebTokenError or TokenExpiredError
    // — both are handled by the global errorHandler middleware
    next(err);
  }
}

/**
 * Restrict access to specific roles.
 * @param  {...string} roles — e.g. restrictTo('admin') or restrictTo('admin','staff')
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('You must be logged in first.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
        )
      );
    }
    next();
  };
}

/**
 * Generate a signed JWT token (helper used in a login controller).
 * @param {object} payload — e.g. { id, email, role }
 * @returns {string} signed JWT
 */
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = { protect, restrictTo, signToken };