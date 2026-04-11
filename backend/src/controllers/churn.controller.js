const ChurnService = require('../services/churn.service');

/**
 * ChurnController
 * Handles HTTP concerns only — delegates all logic to ChurnService.
 */
const ChurnController = {

  async atRisk(req, res, next) {
    try {
      const result = await ChurnService.getAtRiskCustomers(req.query);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  async distribution(req, res, next) {
    try {
      const data = await ChurnService.getChurnDistribution();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async scoreOne(req, res, next) {
    try {
      const data = await ChurnService.scoreOneCustomer(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async scoreAll(req, res, next) {
    try {
      const data = await ChurnService.scoreAllCustomers();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
};

module.exports = ChurnController;