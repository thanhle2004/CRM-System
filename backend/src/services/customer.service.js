const Customer = require('../models/Customer');
const ApiError  = require('../utils/ApiError');
const { buildQuery }          = require('../utils/queryBuilder');
const { paginate, parsePagination } = require('../utils/paginate');
const { computeEngagementScore, computeChurnScore } = require('../utils/scoring');

/**
 * CustomerService
 * All database interaction and business logic for the Customer resource.
 * Controllers call these methods — they never touch the Model directly.
 */
const CustomerService = {

  // ── List customers with search / filter / sort / pagination ────────────────
  async listCustomers(query = {}) {
    const { page, limit } = parsePagination(query);

    // Build dynamic $match from query params
    const filter = buildQuery(query);

    // Build sort stage
    const sortField = query.sort || 'createdAt';
    const sortDir   = query.order === 'asc' ? 1 : -1;

    const pipeline = [
      { $match: filter },
      { $sort: { [sortField]: sortDir } },
      {
        $project: {
          full_name: 1, email: 1, phone: 1, country: 1, city: 1,
          age: 1, gender: 1, membership_years: 1,
          lifetime_value: 1, total_purchases: 1,
          churned: 1, churn_risk: 1, engagement_score: 1,
          days_since_last_purchase: 1,
          createdAt: 1,
        },
      },
    ];

    return paginate(Customer, pipeline, { page, limit });
  },

  // ── Get one customer (full profile) ───────────────────────────────────────
  async getCustomerById(id) {
    const customer = await Customer.findById(id).lean();
    if (!customer) throw ApiError.notFound(`Customer ${id} not found`);
    return customer;
  },

  // ── Create customer ────────────────────────────────────────────────────────
  async createCustomer(data) {
    // Compute derived scores on creation
    const engagementScore            = computeEngagementScore(data);
    const { score: churnScore, risk } = computeChurnScore(data);

    const customer = await Customer.create({
      ...data,
      engagement_score: engagementScore,
      churn_score:      churnScore,
      churn_risk:       risk,
    });

    return customer.toJSON();
  },

  // ── Update customer ────────────────────────────────────────────────────────
  async updateCustomer(id, data) {
    const existing = await Customer.findById(id);
    if (!existing) throw ApiError.notFound(`Customer ${id} not found`);

    // Merge and recompute scores if any scoring-related field changes
    const merged = { ...existing.toObject(), ...data };
    data.engagement_score = computeEngagementScore(merged);
    const { score, risk }  = computeChurnScore(merged);
    data.churn_score       = score;
    data.churn_risk        = risk;

    const updated = await Customer.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    return updated;
  },

  // ── Delete customer ────────────────────────────────────────────────────────
  async deleteCustomer(id) {
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) throw ApiError.notFound(`Customer ${id} not found`);
    return { id, deleted: true };
  },

  // ── Bulk compute + persist engagement scores ───────────────────────────────
  async recomputeAllEngagementScores() {
    const customers = await Customer.find({}, {
      login_frequency: 1, session_duration_avg: 1, pages_per_session: 1,
      email_open_rate: 1, social_media_engagement_score: 1,
    }).lean();

    const ops = customers.map(c => ({
      updateOne: {
        filter: { _id: c._id },
        update: { $set: { engagement_score: computeEngagementScore(c) } },
      },
    }));

    await Customer.bulkWrite(ops);
    return { updated: ops.length };
  },
};

module.exports = CustomerService;