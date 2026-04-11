const express = require('express');
const router  = express.Router();

const customerRoutes  = require('./customer.routes');
const analyticsRoutes = require('./analytics.routes');
const segmentRoutes   = require('./segment.routes');
const churnRoutes     = require('./churn.routes');
const marketingRoutes = require('./marketing.routes');

// ── Health check ──────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    success:   true,
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    `${Math.floor(process.uptime())}s`,
  });
});

// ── Mount feature routers ─────────────────────────────────────────────────────
router.use('/customers', customerRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/segments',  segmentRoutes);
router.use('/churn',     churnRoutes);
router.use('/marketing', marketingRoutes);

module.exports = router;