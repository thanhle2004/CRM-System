const express = require('express');
const router  = express.Router();

const MarketingController = require('../controllers/marketing.controller');
const { protect }         = require('../middleware/auth');

/**
 * Marketing automation routes
 * Base path: /api/marketing   (mounted in routes/index.js)
 */

// GET  /api/marketing/definitions
// Returns all trigger rule definitions (key, label, reason, conditions)
router.get('/definitions', MarketingController.definitions);

// GET  /api/marketing/triggers
// Preview: which customers match each trigger rule (no writes)
router.get('/triggers', MarketingController.triggerPreviews);

// POST /api/marketing/run-automation
// Body: { "dryRun": true | false }
// dryRun=true  → preview only, no DB writes
// dryRun=false → logs marketing_actions to matched customers
router.post('/run-automation', protect, MarketingController.runAutomation);

// GET  /api/marketing/by-action/:action?page=1&limit=20
// Returns customers who received a specific action
// :action = DISCOUNT_OFFER | REENGAGEMENT_EMAIL | LOYALTY_REWARD | WINBACK_CAMPAIGN | REVIEW_REQUEST
router.get('/by-action/:action', MarketingController.byAction);

module.exports = router;