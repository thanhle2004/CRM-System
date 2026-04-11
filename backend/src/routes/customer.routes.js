const express    = require('express');
const router     = express.Router();

const CustomerController = require('../controllers/customer.controller');
const { validate, createCustomerSchema, updateCustomerSchema, listQuerySchema } =
  require('../middleware/validate');
const { protect } = require('../middleware/auth');

/**
 * Customer routes
 * Base path: /api/customers   (mounted in routes/index.js)
 *
 * All write routes are guarded by protect() middleware (JWT).
 * Remove protect() calls if you haven't implemented auth yet.
 */

// GET  /api/customers          — paginated list with search + filter
router.get(
  '/',
  validate(listQuerySchema, 'query'),
  CustomerController.list
);

// POST /api/customers          — create new customer
router.post(
  '/',
  protect,
  validate(createCustomerSchema),
  CustomerController.create
);

// POST /api/customers/recompute-scores — bulk recompute engagement scores
// Note: placed before /:id so Express doesn't treat "recompute-scores" as an id
router.post(
  '/recompute-scores',
  protect,
  CustomerController.recomputeScores
);

// GET  /api/customers/:id      — single customer full profile
router.get('/:id', CustomerController.getOne);

// PATCH /api/customers/:id     — partial update
router.patch(
  '/:id',
  protect,
  validate(updateCustomerSchema),
  CustomerController.update
);

// DELETE /api/customers/:id    — hard delete
router.delete('/:id', protect, CustomerController.remove);

module.exports = router;