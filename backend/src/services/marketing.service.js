const Customer = require('../models/Customer');
const { paginate, parsePagination } = require('../utils/paginate');

/**
 * MarketingService
 *
 * Rule-based marketing automation SIMULATION.
 * No external email/SMS service — actions are logged to customer.marketing_actions[].
 *
 * Trigger rules:
 *  1. DISCOUNT_OFFER        — cart_abandonment_rate > 0.6  AND total_purchases > 0
 *  2. REENGAGEMENT_EMAIL    — days_since_last_purchase > 90 AND NOT churned
 *  3. LOYALTY_REWARD        — membership_years >= 3        AND lifetime_value > 2000
 *  4. WINBACK_CAMPAIGN      — churned = true               AND lifetime_value > 500
 *  5. REVIEW_REQUEST        — total_purchases > 5          AND product_reviews_written < 1
 */

const TRIGGER_RULES = [
  {
    key:    'DISCOUNT_OFFER',
    label:  'Cart abandonment discount',
    reason: 'High cart abandonment rate — offering 10% discount',
    match: {
      cart_abandonment_rate: { $gt: 0.6 },
      total_purchases:       { $gt: 0 },
      churned:               false,
    },
  },
  {
    key:    'REENGAGEMENT_EMAIL',
    label:  'Re-engagement campaign',
    reason: 'No purchase in 90+ days — sending re-engagement email',
    match: {
      days_since_last_purchase: { $gt: 90 },
      churned: false,
    },
  },
  {
    key:    'LOYALTY_REWARD',
    label:  'Loyalty reward',
    reason: 'Long-term high-value customer — sending loyalty reward',
    match: {
      membership_years: { $gte: 3 },
      lifetime_value:   { $gt: 2000 },
    },
  },
  {
    key:    'WINBACK_CAMPAIGN',
    label:  'Win-back campaign',
    reason: 'Previously high-value customer churned — sending win-back offer',
    match: {
      churned:         true,
      lifetime_value:  { $gt: 500 },
    },
  },
  {
    key:    'REVIEW_REQUEST',
    label:  'Review request',
    reason: 'Active buyer with no reviews — requesting product review',
    match: {
      total_purchases:        { $gt: 5 },
      product_reviews_written:{ $lt: 1 },
      churned:                false,
    },
  },
];

const MarketingService = {

  // ── Preview: which customers match each trigger (no writes) ──────────────
  async getTriggerPreviews() {
    const previews = await Promise.all(
      TRIGGER_RULES.map(async (rule) => {
        const count = await Customer.countDocuments(rule.match);
        // Sample up to 5 customers for preview
        const sample = await Customer.find(rule.match, {
          full_name: 1, email: 1, country: 1,
          cart_abandonment_rate: 1, days_since_last_purchase: 1,
          lifetime_value: 1,
        }).limit(5).lean();

        return {
          key:    rule.key,
          label:  rule.label,
          reason: rule.reason,
          count,
          sample,
        };
      })
    );

    return previews;
  },

  // ── Run automation: evaluate all rules, log actions to matched customers ──
  async runAutomation(options = {}) {
    const { dryRun = false } = options; // dryRun: preview only, no DB writes
    const results = [];

    for (const rule of TRIGGER_RULES) {
      const customers = await Customer.find(rule.match, { _id: 1, full_name: 1, email: 1 }).lean();

      if (!dryRun && customers.length > 0) {
        const ids = customers.map(c => c._id);
        await Customer.updateMany(
          { _id: { $in: ids } },
          {
            $push: {
              marketing_actions: {
                action:       rule.key,
                reason:       rule.reason,
                triggered_at: new Date(),
              },
            },
          }
        );
      }

      results.push({
        rule:     rule.key,
        label:    rule.label,
        affected: customers.length,
        status:   dryRun ? 'preview' : 'logged',
        customers: customers.slice(0, 10).map(c => ({
          id: c._id, name: c.full_name, email: c.email,
        })),
      });
    }

    const totalAffected = results.reduce((sum, r) => sum + r.affected, 0);

    return {
      dryRun,
      totalAffected,
      executedAt: new Date().toISOString(),
      results,
    };
  },

  // ── Get customers who have received a specific action (paginated) ─────────
  async getCustomersByAction(actionKey, query = {}) {
    const { page, limit } = parsePagination(query);

    const pipeline = [
      { $match: { 'marketing_actions.action': actionKey } },
      { $sort: { 'marketing_actions.triggered_at': -1 } },
      {
        $project: {
          full_name: 1, email: 1, country: 1, lifetime_value: 1,
          marketing_actions: {
            $filter: {
              input: '$marketing_actions',
              as:    'a',
              cond:  { $eq: ['$$a.action', actionKey] },
            },
          },
        },
      },
    ];

    return paginate(Customer, pipeline, { page, limit });
  },

  // ── List all available trigger rule definitions (for UI) ─────────────────
  getTriggerDefinitions() {
    return TRIGGER_RULES.map(({ key, label, reason, match }) => ({
      key, label, reason,
      conditions: match,
    }));
  },
};

module.exports = MarketingService;