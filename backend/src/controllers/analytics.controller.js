const AnalyticsService = require('../services/analytics.service');

/**
 * AnalyticsController
 * Handles HTTP concerns only — delegates all logic to AnalyticsService.
 */
const AnalyticsController = {

  async getKpis(req, res, next) {
    try {
      const data = await AnalyticsService.getKpis();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async byCountry(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 15;
      const data  = await AnalyticsService.getCustomersByCountry(limit);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async revenueByQuarter(req, res, next) {
    try {
      const data = await AnalyticsService.getRevenueBySignupQuarter();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async churnOverview(req, res, next) {
    try {
      const data = await AnalyticsService.getChurnOverview();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async engagementDistribution(req, res, next) {
    try {
      const data = await AnalyticsService.getEngagementDistribution();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async genderBreakdown(req, res, next) {
    try {
      const data = await AnalyticsService.getGenderBreakdown();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
};

module.exports = AnalyticsController;