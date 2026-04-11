const Customer = require('../models/Customer');
const ApiError  = require('../utils/ApiError');
const { computeChurnScore }   = require('../utils/scoring');
const { paginate, parsePagination } = require('../utils/paginate');

/**
 * ChurnService
 *
 * Rule-based churn scoring engine.
 * Score: 0–100  |  Risk bands: Low (0–34), Medium (35–64), High (65–100)
 *
 * scoreOneCustomer  — recompute and persist score for a single customer
 * scoreAllCustomers — bulk recompute (batched bulkWrite, safe for large datasets)
 * getAtRiskCustomers — paginated list of High + Medium risk customers
 * getChurnDistribution — aggregation breakdown by risk band
 */
const ChurnService = {

  // ── Score one customer and persist ────────────────────────────────────────
  async scoreOneCustomer(id) {
    const customer = await Customer.findById(id).lean();
    if (!customer) throw ApiError.notFound(`Customer ${id} not found`);

    const { score, risk } = computeChurnScore(customer);

    await Customer.findByIdAndUpdate(id, {
      $set: { churn_score: score, churn_risk: risk },
    });

    return {
      customerId:  id,
      full_name:   customer.full_name,
      churn_score: score,
      churn_risk:  risk,
    };
  },

  // ── Bulk score all customers (batched to avoid memory issues) ─────────────
  async scoreAllCustomers() {
    const BATCH_SIZE = 500;
    let processed = 0;
    let cursor;

    // Stream documents in batches using cursor
    cursor = Customer.find({}).lean().cursor();

    let batch  = [];
    const ops  = [];

    for await (const customer of cursor) {
      const { score, risk } = computeChurnScore(customer);
      ops.push({
        updateOne: {
          filter: { _id: customer._id },
          update: { $set: { churn_score: score, churn_risk: risk } },
        },
      });

      if (ops.length >= BATCH_SIZE) {
        await Customer.bulkWrite(ops.splice(0, BATCH_SIZE), { ordered: false });
        processed += BATCH_SIZE;
      }
    }

    // Flush remaining
    if (ops.length > 0) {
      await Customer.bulkWrite(ops, { ordered: false });
      processed += ops.length;
    }

    return { message: 'Churn scores updated', processed };
  },

  // ── Get at-risk customers (High + Medium) ─────────────────────────────────
  async getAtRiskCustomers(query = {}) {
    const { page, limit } = parsePagination(query);
    const riskFilter = query.risk || ['High', 'Medium'];

    const pipeline = [
      { $match: { churn_risk: { $in: Array.isArray(riskFilter) ? riskFilter : [riskFilter] } } },
      { $sort: { churn_score: -1 } }, // highest risk first
      {
        $project: {
          full_name: 1, email: 1, country: 1,
          churn_score: 1, churn_risk: 1,
          days_since_last_purchase: 1,
          lifetime_value: 1, login_frequency: 1,
          returns_rate: 1, customer_service_calls: 1,
          churned: 1,
        },
      },
    ];

    return paginate(Customer, pipeline, { page, limit });
  },

  // ── Risk distribution (aggregation) ───────────────────────────────────────
  async getChurnDistribution() {
    return Customer.aggregate([
      { $match: { churn_risk: { $ne: null } } },
      {
        $group: {
          _id:         '$churn_risk',
          count:       { $sum: 1 },
          avgScore:    { $avg: '$churn_score' },
          avgLtv:      { $avg: '$lifetime_value' },
          churnedCount:{ $sum: { $cond: ['$churned', 1, 0] } },
        },
      },
      { $sort: { avgScore: -1 } },
      {
        $project: {
          _id: 0,
          risk:        '$_id',
          count:       1,
          avgScore:    { $round: ['$avgScore', 1] },
          avgLtv:      { $round: ['$avgLtv',   2] },
          churnedCount: 1,
        },
      },
    ]);
  },
};

module.exports = ChurnService;