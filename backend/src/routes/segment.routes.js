const express = require('express');
const router  = express.Router();

const SegmentController = require('../controllers/segment.controller');

/**
 * Segmentation routes
 * Base path: /api/segments   (mounted in routes/index.js)
 */

// GET  /api/segments/behavioral
// Returns Power User / Regular / Occasional / Dormant breakdown
router.get('/behavioral', SegmentController.behavioral);

// GET  /api/segments/value
// Returns High Value / Mid Value / Low Value breakdown
router.get('/value', SegmentController.value);

// GET  /api/segments/risk
// Returns Active / At Risk / Dormant / Churned breakdown
router.get('/risk', SegmentController.risk);

// POST /api/segments/dynamic?page=1&limit=20
// Body: { "country": "US", "churned": false, "lifetime_value_min": 1000 }
// Returns paginated customer list matching arbitrary filters
router.post('/dynamic', SegmentController.dynamic);

module.exports = router;