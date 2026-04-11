/**
 * Pure functions — no DB access, no side effects.
 * Called from ChurnService and CustomerService when computing derived scores.
 *
 * ── Engagement Score (0–100) ────────────────────────────────────────────────
 * Weighted sum of 5 normalised metrics.
 * Higher = more engaged.
 *
 * ── Churn Score (0–100) ─────────────────────────────────────────────────────
 * Rule-based risk scoring. Higher = more likely to churn.
 * Bands: Low (0–34) / Medium (35–64) / High (65–100)
 */

// ── Clamp helper ──────────────────────────────────────────────────────────────
const clamp = (val, min = 0, max = 100) => Math.min(max, Math.max(min, val));

// ── Normalise a value to 0–1 given expected [min, max] range ─────────────────
const norm = (val, min, max) =>
  max === min ? 0 : clamp((val - min) / (max - min), 0, 1);

// ─────────────────────────────────────────────────────────────────────────────
// ENGAGEMENT SCORE
// ─────────────────────────────────────────────────────────────────────────────
const ENGAGEMENT_WEIGHTS = {
  login_frequency:               0.25, // 0–30 logins/month
  session_duration_avg:          0.20, // 0–120 minutes
  pages_per_session:             0.15, // 0–20 pages
  email_open_rate:               0.20, // 0–1
  social_media_engagement_score: 0.20, // 0–100
};

const ENGAGEMENT_RANGES = {
  login_frequency:               [0, 30],
  session_duration_avg:          [0, 120],
  pages_per_session:             [0, 20],
  email_open_rate:               [0, 1],
  social_media_engagement_score: [0, 100],
};

/**
 * Compute engagement score for a single customer document.
 * @param {object} customer - plain object or Mongoose doc
 * @returns {number} score 0–100 (rounded to 1 decimal)
 */
function computeEngagementScore(customer) {
  let score = 0;
  for (const [field, weight] of Object.entries(ENGAGEMENT_WEIGHTS)) {
    const [min, max] = ENGAGEMENT_RANGES[field];
    const normalised  = norm(customer[field] ?? 0, min, max);
    score += normalised * weight * 100;
  }
  return Math.round(clamp(score) * 10) / 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHURN SCORE  (rule-based, additive risk points)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Risk rules — each rule adds points when the condition is true.
 * Total possible = 100.
 *
 * Rule design rationale:
 *  - Recency (days_since_last_purchase) is the strongest single predictor.
 *  - Low engagement compounds the signal.
 *  - High returns / service calls indicate dissatisfaction.
 *  - Already churned → maximum score.
 */
const CHURN_RULES = [
  // Recency                                                      points
  { fn: c => c.days_since_last_purchase > 365, points: 30 },
  { fn: c => c.days_since_last_purchase > 180 && c.days_since_last_purchase <= 365, points: 18 },
  { fn: c => c.days_since_last_purchase > 90  && c.days_since_last_purchase <= 180, points: 8  },

  // Engagement absence
  { fn: c => c.login_frequency < 1, points: 12 },
  { fn: c => c.email_open_rate < 0.05, points: 8  },
  { fn: c => c.session_duration_avg < 2, points: 5  },

  // Dissatisfaction signals
  { fn: c => c.returns_rate > 0.4, points: 10 },
  { fn: c => c.customer_service_calls > 5, points: 8  },
  { fn: c => c.cart_abandonment_rate > 0.7, points: 7  },

  // Already marked churned
  { fn: c => c.churned === true, points: 30 },
];

const CHURN_RISK_BANDS = [
  { label: 'High',   min: 65 },
  { label: 'Medium', min: 35 },
  { label: 'Low',    min: 0  },
];

/**
 * Compute churn score and risk band for a single customer.
 * @param {object} customer
 * @returns {{ score: number, risk: 'Low'|'Medium'|'High' }}
 */
function computeChurnScore(customer) {
  let score = 0;
  for (const rule of CHURN_RULES) {
    if (rule.fn(customer)) score += rule.points;
  }
  score = clamp(score);
  const risk = CHURN_RISK_BANDS.find(b => score >= b.min)?.label ?? 'Low';
  return { score, risk };
}

module.exports = { computeEngagementScore, computeChurnScore };