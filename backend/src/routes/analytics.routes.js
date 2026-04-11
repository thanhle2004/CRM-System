const express    = require('express');
const router     = express.Router();

const AnalyticsController = require('../controllers/analytics.controller');

/**
 * Analytics routes
 * Base path: /api/analytics   (mounted in routes/index.js)
 * All routes are read-only GET — no auth guard required for dashboard data.
 */

// GET /api/analytics/kpis
router.get('/kpis', AnalyticsController.getKpis);

// GET /api/analytics/by-country?limit=15
router.get('/by-country', AnalyticsController.byCountry);

// GET /api/analytics/revenue-by-quarter
router.get('/revenue-by-quarter', AnalyticsController.revenueByQuarter);

// GET /api/analytics/churn-overview
router.get('/churn-overview', AnalyticsController.churnOverview);

// GET /api/analytics/engagement-distribution
router.get('/engagement-distribution', AnalyticsController.engagementDistribution);

// GET /api/analytics/gender-breakdown
router.get('/gender-breakdown', AnalyticsController.genderBreakdown);

module.exports = router;