const Customer = require('../models/Customer');
const { buildQuery }          = require('../utils/queryBuilder');
const { paginate, parsePagination } = require('../utils/paginate');

/**
 * SegmentService
 *
 * Three preset segment dimensions + one fully dynamic segmentation endpoint.
 * All use aggregation pipelines so they compose naturally with pagination.
 *
 * Segment dimensions:
 *  1. Behavioral  — login frequency + session duration bands
 *  2. Value       — lifetime_value tiers (High / Mid / Low)
 *  3. Risk        — days_since_last_purchase + churned status bands
 *
 * Each "getXxxSegments" returns summary counts for the UI segment overview.
 * Each "getCustomersInSegment" returns a paginated customer list for drill-down.
 */
const SegmentService = {

  // ── 1. Behavioral segments ─────────────────────────────────────────────────
  // Classify customers into Power / Regular / Dormant based on login + session.
  async getBehavioralSegments() {
    return Customer.aggregate([
      {
        $addFields: {
          behavioral_segment: {
            $switch: {
              branches: [
                {
                  case: { $and: [
                    { $gte: ['$login_frequency', 15] },
                    { $gte: ['$session_duration_avg', 20] },
                  ]},
                  then: 'Power User',
                },
                {
                  case: { $and: [
                    { $gte: ['$login_frequency', 5] },
                    { $gte: ['$session_duration_avg', 5] },
                  ]},
                  then: 'Regular',
                },
                {
                  case: { $lt: ['$login_frequency', 2] },
                  then: 'Dormant',
                },
              ],
              default: 'Occasional',
            },
          },
        },
      },
      {
        $group: {
          _id:        '$behavioral_segment',
          count:      { $sum: 1 },
          avgLtv:     { $avg: '$lifetime_value' },
          avgSessions: { $avg: '$login_frequency' },
          churnedCount: { $sum: { $cond: ['$churned', 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          segment:     '$_id',
          count:       1,
          avgLtv:      { $round: ['$avgLtv', 2] },
          avgSessions: { $round: ['$avgSessions', 1] },
          churnedCount: 1,
          churnRate: {
            $round: [
              { $multiply: [{ $divide: ['$churnedCount', '$count'] }, 100] },
              1,
            ],
          },
        },
      },
    ]);
  },

  // ── 2. Value segments ──────────────────────────────────────────────────────
  async getValueSegments() {
    return Customer.aggregate([
      {
        $addFields: {
          value_segment: {
            $switch: {
              branches: [
                { case: { $gte: ['$lifetime_value', 5000] }, then: 'High Value' },
                { case: { $gte: ['$lifetime_value', 1000] }, then: 'Mid Value'  },
              ],
              default: 'Low Value',
            },
          },
        },
      },
      {
        $group: {
          _id:            '$value_segment',
          count:          { $sum: 1 },
          totalRevenue:   { $sum: '$lifetime_value' },
          avgLtv:         { $avg: '$lifetime_value' },
          avgOrderValue:  { $avg: '$average_order_value' },
          churnedCount:   { $sum: { $cond: ['$churned', 1, 0] } },
        },
      },
      { $sort: { avgLtv: -1 } },
      {
        $project: {
          _id: 0,
          segment:       '$_id',
          count:         1,
          totalRevenue:  { $round: ['$totalRevenue', 2] },
          avgLtv:        { $round: ['$avgLtv',        2] },
          avgOrderValue: { $round: ['$avgOrderValue',  2] },
          churnedCount:  1,
        },
      },
    ]);
  },

  // ── 3. Risk segments ───────────────────────────────────────────────────────
  async getRiskSegments() {
    return Customer.aggregate([
      {
        $addFields: {
          risk_segment: {
            $switch: {
              branches: [
                { case: { $eq:  ['$churned', true]                              }, then: 'Churned'   },
                { case: { $gte: ['$days_since_last_purchase', 180]              }, then: 'Dormant'   },
                { case: { $gte: ['$days_since_last_purchase',  90]              }, then: 'At Risk'   },
                { case: { $lt:  ['$days_since_last_purchase',  30]              }, then: 'Active'    },
              ],
              default: 'Inactive',
            },
          },
        },
      },
      {
        $group: {
          _id:       '$risk_segment',
          count:     { $sum: 1 },
          avgDaysSinceLastPurchase: { $avg: '$days_since_last_purchase' },
          avgLtv:    { $avg: '$lifetime_value' },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          segment: '$_id',
          count:   1,
          avgDaysSinceLastPurchase: { $round: ['$avgDaysSinceLastPurchase', 0] },
          avgLtv:  { $round: ['$avgLtv', 2] },
        },
      },
    ]);
  },

  // ── 4. Dynamic segment — arbitrary filter from UI ──────────────────────────
  // The frontend sends a filter body; this builds the pipeline dynamically.
  async getDynamicSegment(filters = {}, paginationQuery = {}) {
    const { page, limit } = parsePagination(paginationQuery);
    const $match = buildQuery(filters);

    const pipeline = [
      { $match },
      { $sort: { lifetime_value: -1 } },
      {
        $project: {
          full_name: 1, email: 1, country: 1, churned: 1,
          lifetime_value: 1, engagement_score: 1, churn_risk: 1,
          days_since_last_purchase: 1, login_frequency: 1,
        },
      },
    ];

    const result = await paginate(Customer, pipeline, { page, limit });

    // Also compute summary stats for the dynamic segment
    const [stats] = await Customer.aggregate([
      { $match },
      {
        $group: {
          _id: null,
          count:       { $sum: 1 },
          totalRevenue:{ $sum: '$lifetime_value' },
          avgLtv:      { $avg: '$lifetime_value' },
          churnedCount:{ $sum: { $cond: ['$churned', 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0, count: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          avgLtv:       { $round: ['$avgLtv',       2] },
          churnRate: {
            $round: [
              { $multiply: [{ $divide: ['$churnedCount', '$count'] }, 100] },
              1,
            ],
          },
        },
      },
    ]);

    return { ...result, stats: stats ?? {} };
  },
};

module.exports = SegmentService;