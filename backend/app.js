const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

// Validate env vars at startup — exits if required vars are missing
const env = require('./src/config/env');

const routes       = require('./src/routes/index');
const errorHandler = require('./src/middleware/errorHandler');
const ApiError     = require('./src/utils/ApiError');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:         env.CLIENT_ORIGIN,
  methods:        ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:    true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logging ───────────────────────────────────────────────────────────
if (!env.IS_PROD) {
  app.use(morgan('dev'));
}

// ── Global rate limiter (per IP) ──────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             500,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
}));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res, next) =>
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`))
);

// ── Global error handler (must be last middleware) ────────────────────────────
app.use(errorHandler);

module.exports = app;