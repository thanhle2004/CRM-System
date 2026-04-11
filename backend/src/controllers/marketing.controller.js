const MarketingService = require('../services/marketing.service');

/**
 * MarketingController
 * Handles HTTP concerns only — delegates all logic to MarketingService.
 */
const MarketingController = {

  async triggerPreviews(req, res, next) {
    try {
      const data = await MarketingService.getTriggerPreviews();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async runAutomation(req, res, next) {
    try {
      const dryRun = req.body.dryRun === true;
      const data   = await MarketingService.runAutomation({ dryRun });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async definitions(req, res, next) {
    try {
      const data = MarketingService.getTriggerDefinitions();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async byAction(req, res, next) {
    try {
      const result = await MarketingService.getCustomersByAction(
        req.params.action,
        req.query
      );
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },
};

module.exports = MarketingController;