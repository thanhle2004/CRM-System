const Customer = require('../models/Customer');

/**
 * AnalyticsService
 * Read-only aggregate queries consumed by dashboard/analytics pages.
 */
const AnalyticsService = {

  // ── KPI summary cards ─────────────────────────────────────────────────────
  async getKpis() {
    const [summary] = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          avgLifetimeValue: { $avg: { $ifNull: ['$lifetime_value', 0] } },
          churnedCount: { $sum: { $cond: ['$churned', 1, 0] } },
          avgEngagementScore: { $avg: { $ifNull: ['$engagement_score', 0] } },
        },
      },
    ]);

    if (!summary) {
      return {
        totalCustomers: 0,
        avgLifetimeValue: 0,
        churnRate: 0,
        avgEngagementScore: 0,
      };
    }

    const churnRate = summary.totalCustomers
      ? (summary.churnedCount / summary.totalCustomers) * 100
      : 0;

    return {
      totalCustomers: summary.totalCustomers,
      avgLifetimeValue: Number((summary.avgLifetimeValue || 0).toFixed(2)),
      churnRate: Number(churnRate.toFixed(2)),
      avgEngagementScore: Number((summary.avgEngagementScore || 0).toFixed(1)),
    };
  },

  // ── Top countries by total revenue (lifetime value) ──────────────────────
  async getCustomersByCountry(limit = 15) {
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 15;

    return Customer.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $or: [{ $eq: ['$country', null] }, { $eq: ['$country', ''] }] },
              'Unknown',
              '$country',
            ],
          },
          customerCount: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ['$lifetime_value', 0] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: safeLimit },
      {
        $project: {
          _id: 0,
          country: '$_id',
          customerCount: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
        },
      },
    ]);
  },

  // ── Revenue grouped by signup quarter ────────────────────────────────────
  async getRevenueBySignupQuarter() {
    return Customer.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $or: [{ $eq: ['$signup_quarter', null] }, { $eq: ['$signup_quarter', ''] }] },
              'Unknown',
              '$signup_quarter',
            ],
          },
          totalRevenue: { $sum: { $ifNull: ['$lifetime_value', 0] } },
          customerCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          quarter: '$_id',
          totalRevenue: { $round: ['$totalRevenue', 2] },
          customerCount: 1,
        },
      },
    ]);
  },

  // ── Churn status overview used in dashboard pie chart ────────────────────
  async getChurnOverview() {
    const [summary] = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          churnedCount: { $sum: { $cond: ['$churned', 1, 0] } },
          atRiskCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$churned', false] },
                    { $or: [{ $eq: ['$churn_risk', 'Medium'] }, { $eq: ['$churn_risk', 'High'] }] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const totalCustomers = summary?.totalCustomers || 0;
    const churnedCount = summary?.churnedCount || 0;
    const atRiskCount = summary?.atRiskCount || 0;
    const activeCount = Math.max(totalCustomers - churnedCount - atRiskCount, 0);

    return {
      totalCustomers,
      activeCount,
      atRiskCount,
      churnedCount,
    };
  },

  // ── Engagement score bands ────────────────────────────────────────────────
  async getEngagementDistribution() {
    return Customer.aggregate([
      {
        $addFields: {
          band: {
            $switch: {
              branches: [
                { case: { $lt: [{ $ifNull: ['$engagement_score', 0] }, 20] }, then: '0-19' },
                { case: { $lt: [{ $ifNull: ['$engagement_score', 0] }, 40] }, then: '20-39' },
                { case: { $lt: [{ $ifNull: ['$engagement_score', 0] }, 60] }, then: '40-59' },
                { case: { $lt: [{ $ifNull: ['$engagement_score', 0] }, 80] }, then: '60-79' },
              ],
              default: '80-100',
            },
          },
        },
      },
      {
        $group: {
          _id: '$band',
          count: { $sum: 1 },
        },
      },
      {
        $addFields: {
          sortOrder: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', '0-19'] }, then: 1 },
                { case: { $eq: ['$_id', '20-39'] }, then: 2 },
                { case: { $eq: ['$_id', '40-59'] }, then: 3 },
                { case: { $eq: ['$_id', '60-79'] }, then: 4 },
                { case: { $eq: ['$_id', '80-100'] }, then: 5 },
              ],
              default: 99,
            },
          },
        },
      },
      { $sort: { sortOrder: 1 } },
      {
        $project: {
          _id: 0,
          band: '$_id',
          count: 1,
        },
      },
    ]);
  },

  // ── Gender chart breakdown ────────────────────────────────────────────────
  async getGenderBreakdown() {
    return Customer.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $or: [{ $eq: ['$gender', null] }, { $eq: ['$gender', ''] }] },
              'Unknown',
              '$gender',
            ],
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          gender: '$_id',
          count: 1,
        },
      },
    ]);
  },
};

module.exports = AnalyticsService;