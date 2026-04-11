const express = require('express');
const router  = express.Router();

const ChurnController  = require('../controllers/churn.controller');
const { protect }      = require('../middleware/auth');

/**
 * Churn routes
 * Base path: /api/churn   (mounted in routes/index.js)
 */

// GET  /api/churn/at-risk?page=1&limit=20&risk=High
// Returns paginated list of High + Medium risk customers
router.get('/at-risk', ChurnController.atRisk);

// GET  /api/churn/distribution
// Returns count + avg score per risk band (for charts)
router.get('/distribution', ChurnController.distribution);

// POST /api/churn/score/:id
// Recompute and persist churn score for a single customer
router.post('/score/:id', protect, ChurnController.scoreOne);

// POST /api/churn/score-all
// Bulk recompute all churn scores (long-running — use with care in prod)
router.post('/score-all', protect, ChurnController.scoreAll);

module.exports = router;