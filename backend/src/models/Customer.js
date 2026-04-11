const mongoose = require('mongoose');

/**
 * Customer Schema
 * Single denormalised collection — the only collection in this system.
 * All analytics, segmentation, churn, and marketing are computed via
 * aggregation pipelines against this schema.
 */
const customerSchema = new mongoose.Schema(
  {
    // ── Identity ───────────────────────────────────────────────────────────
    full_name:  { type: String, required: true, trim: true },
    first_name: { type: String, required: true, trim: true },
    last_name:  { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:      { type: String, trim: true, default: null },

    // ── Location ───────────────────────────────────────────────────────────
    country: { type: String, trim: true, default: null },
    city:    { type: String, trim: true, default: null },

    // ── Demographics ───────────────────────────────────────────────────────
    age:    { type: Number, min: 0, max: 120, default: null },
    gender: { type: String, enum: ['Male', 'Female', 'Other', null], default: null },

    // ── Membership ─────────────────────────────────────────────────────────
    membership_years: { type: Number, min: 0, default: 0 },
    signup_quarter:   { type: String, trim: true, default: null }, // e.g. "Q1-2021"

    // ── Behavioural (Engagement) ───────────────────────────────────────────
    login_frequency:           { type: Number, min: 0, default: 0 },  // logins/month
    session_duration_avg:      { type: Number, min: 0, default: 0 },  // minutes
    pages_per_session:         { type: Number, min: 0, default: 0 },
    mobile_app_usage:          { type: Number, min: 0, max: 100, default: 0 }, // %
    social_media_engagement_score: { type: Number, min: 0, max: 100, default: 0 },
    email_open_rate:           { type: Number, min: 0, max: 100, default: 0 },   // 0–100
    product_reviews_written:   { type: Number, min: 0, default: 0 },

    // ── Transactional ─────────────────────────────────────────────────────
    total_purchases:         { type: Number, min: 0, default: 0 },
    average_order_value:     { type: Number, min: 0, default: 0 },
    lifetime_value:          { type: Number, min: 0, default: 0 },
    days_since_last_purchase:{ type: Number, min: 0, default: 0 },
    cart_abandonment_rate:   { type: Number, min: 0, max: 100, default: 0 }, // 0–100
    wishlist_items:          { type: Number, min: 0, default: 0 },
    discount_usage_rate:     { type: Number, min: 0, max: 100, default: 0 }, // 0–100
    returns_rate:            { type: Number, min: 0, max: 100, default: 0 }, // 0–100
    payment_method_diversity:{ type: Number, min: 0, default: 0 },         // count

    // ── Support ────────────────────────────────────────────────────────────
    customer_service_calls: { type: Number, min: 0, default: 0 },

    // ── Risk / Churn ───────────────────────────────────────────────────────
    churned: { type: Boolean, default: false },

    // ── Computed fields (written by services, stored for fast reads) ───────
    engagement_score: { type: Number, min: 0, max: 100, default: null },
    churn_score:      { type: Number, min: 0, max: 100, default: null },
    churn_risk:       { type: String, enum: ['Low', 'Medium', 'High', null], default: null },
    credit_balance:   { type: Number, default: 0 },

    // ── Marketing automation log ───────────────────────────────────────────
    marketing_actions: [
      {
        action:    { type: String },          // e.g. 'DISCOUNT_SENT', 'REENGAGEMENT_EMAIL'
        reason:    { type: String },          // human-readable trigger description
        triggered_at: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,   // adds createdAt / updatedAt
    versionKey: false,
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────
// Compound index for the most common list queries (country + churn filter)
customerSchema.index({ country: 1, churned: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ churned: 1 });
customerSchema.index({ churn_risk: 1 });
customerSchema.index({ engagement_score: -1 });
customerSchema.index({ lifetime_value: -1 });
customerSchema.index({ days_since_last_purchase: -1 });
customerSchema.index({ signup_quarter: 1 });
// Text index for full-text search on name / email
customerSchema.index(
  { full_name: 'text', email: 'text' },
  { name: 'customer_text_search' }
);

// ── Virtual: segment label (not stored, computed on the fly) ───────────────
customerSchema.virtual('value_segment').get(function () {
  if (this.lifetime_value >= 5000) return 'High Value';
  if (this.lifetime_value >= 1000) return 'Mid Value';
  return 'Low Value';
});

// Ensure virtuals are included in toJSON / toObject responses
customerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);