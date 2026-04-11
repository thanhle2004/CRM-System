const SegmentService = require('../services/segment.service');

/**
 * SegmentController
 * Handles HTTP concerns only — delegates all logic to SegmentService.
 */
const SegmentController = {

  async behavioral(req, res, next) {
    try {
      const data = await SegmentService.getBehavioralSegments();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async value(req, res, next) {
    try {
      const data = await SegmentService.getValueSegments();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async risk(req, res, next) {
    try {
      const data = await SegmentService.getRiskSegments();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async dynamic(req, res, next) {
    try {
      const result = await SegmentService.getDynamicSegment(req.body, req.query);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },
};

module.exports = SegmentController;