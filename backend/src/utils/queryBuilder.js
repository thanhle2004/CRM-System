/**
 * queryBuilder.js
 *
 * Translates a flat req.query / req.body object into a MongoDB $match stage.
 * Supports:
 *   - exact match        { country: 'US' }
 *   - numeric ranges     { ltv_min: 100, ltv_max: 5000 }
 *   - boolean coercion   { churned: 'true' }
 *   - text search        { search: 'john' }   → uses $text index
 *   - array inclusion    { gender: ['Male','Female'] }
 *
 * Usage:
 *   const $match = buildQuery(req.query, ALLOWED_FILTERS);
 *   Customer.aggregate([{ $match }, ...])
 */

// Whitelist of fields and their types to prevent injection
const FIELD_TYPES = {
  churned:                    'boolean',
  country:                    'string',
  city:                       'string',
  gender:                     'string',
  churn_risk:                 'string',
  signup_quarter:             'string',
  age:                        'number',
  membership_years:           'number',
  login_frequency:            'number',
  session_duration_avg:       'number',
  pages_per_session:          'number',
  total_purchases:            'number',
  average_order_value:        'number',
  lifetime_value:             'number',
  days_since_last_purchase:   'number',
  cart_abandonment_rate:      'number',
  discount_usage_rate:        'number',
  returns_rate:               'number',
  email_open_rate:            'number',
  social_media_engagement_score: 'number',
  customer_service_calls:     'number',
  engagement_score:           'number',
  churn_score:                'number',
};

/**
 * Builds a MongoDB filter object from query params.
 *
 * Range params follow convention: fieldName_min / fieldName_max
 *   e.g. lifetime_value_min=1000&lifetime_value_max=5000
 *
 * @param {object} query       - req.query or similar flat key-value object
 * @param {string[]} [allowed] - optional subset of fields to allow (defaults to all)
 * @returns {object}           - MongoDB filter ($match stage content)
 */
function buildQuery(query = {}, allowed = Object.keys(FIELD_TYPES)) {
  const filter = {};

  // Full-text search (requires text index on full_name + email)
  if (query.search && typeof query.search === 'string' && query.search.trim()) {
    filter.$text = { $search: query.search.trim() };
  }

  for (const field of allowed) {
    const type = FIELD_TYPES[field];
    if (!type) continue;

    // ── Exact match ──────────────────────────────────────────────────────
    if (query[field] !== undefined) {
      const raw = query[field];

      if (type === 'boolean') {
        if (raw === 'true' || raw === true)   filter[field] = true;
        if (raw === 'false' || raw === false) filter[field] = false;
      } else if (type === 'number') {
        const n = Number(raw);
        if (!isNaN(n)) filter[field] = n;
      } else {
        // string — support array (multiple values = $in)
        if (Array.isArray(raw)) {
          filter[field] = { $in: raw };
        } else {
          filter[field] = raw;
        }
      }
    }

    // ── Range match (_min / _max) ────────────────────────────────────────
    if (type === 'number') {
      const minKey = `${field}_min`;
      const maxKey = `${field}_max`;
      const hasMin = query[minKey] !== undefined;
      const hasMax = query[maxKey] !== undefined;

      if (hasMin || hasMax) {
        filter[field] = filter[field] || {};
        if (hasMin) {
          const v = Number(query[minKey]);
          if (!isNaN(v)) filter[field].$gte = v;
        }
        if (hasMax) {
          const v = Number(query[maxKey]);
          if (!isNaN(v)) filter[field].$lte = v;
        }
      }
    }
  }

  return filter;
}

module.exports = { buildQuery, FIELD_TYPES };