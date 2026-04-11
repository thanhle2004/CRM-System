const Joi = require('joi');
const ApiError = require('../utils/ApiError');

/**
 * validate(schema, target?)
 *
 * Returns an Express middleware that validates the specified part of the request
 * against a Joi schema. Throws ApiError(400) on failure.
 *
 * @param {Joi.Schema} schema
 * @param {'body'|'query'|'params'} [target='body']
 *
 * Usage:
 *   router.post('/', validate(createCustomerSchema), customerController.create);
 *   router.get('/',  validate(listQuerySchema, 'query'), customerController.list);
 */
function validate(schema, target = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,    // collect ALL errors, not just the first
      stripUnknown: true,   // remove fields not in schema (security hygiene)
    });

    if (error) {
      const details = error.details.map(d => ({
        field:   d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }

    // Replace the raw input with the validated + coerced value
    req[target] = value;
    next();
  };
}

// ── Reusable Joi schemas ──────────────────────────────────────────────────────

const createCustomerSchema = Joi.object({
  full_name:  Joi.string().trim().required(),
  first_name: Joi.string().trim().required(),
  last_name:  Joi.string().trim().required(),
  email:      Joi.string().email().lowercase().required(),
  phone:      Joi.string().trim().allow(null, '').optional(),
  country:    Joi.string().trim().allow(null, '').optional(),
  city:       Joi.string().trim().allow(null, '').optional(),
  age:        Joi.number().integer().min(0).max(120).optional(),
  gender:     Joi.string().valid('Male', 'Female', 'Other').optional(),
  membership_years: Joi.number().min(0).optional(),
  signup_quarter:   Joi.string().trim().optional(),
  // Behavioural fields default to 0 on creation
  login_frequency:           Joi.number().min(0).optional(),
  session_duration_avg:      Joi.number().min(0).optional(),
  pages_per_session:         Joi.number().min(0).optional(),
  total_purchases:           Joi.number().min(0).optional(),
  average_order_value:       Joi.number().min(0).optional(),
  lifetime_value:            Joi.number().min(0).optional(),
  days_since_last_purchase:  Joi.number().min(0).optional(),
  cart_abandonment_rate:     Joi.number().min(0).max(1).optional(),
  discount_usage_rate:       Joi.number().min(0).max(1).optional(),
  returns_rate:              Joi.number().min(0).max(1).optional(),
  email_open_rate:           Joi.number().min(0).max(1).optional(),
  social_media_engagement_score: Joi.number().min(0).max(100).optional(),
  mobile_app_usage:          Joi.number().min(0).max(100).optional(),
  payment_method_diversity:  Joi.number().min(0).optional(),
  customer_service_calls:    Joi.number().min(0).optional(),
  product_reviews_written:   Joi.number().min(0).optional(),
  wishlist_items:            Joi.number().min(0).optional(),
  credit_balance:            Joi.number().optional(),
  churned:                   Joi.boolean().optional(),
});

const updateCustomerSchema = createCustomerSchema.fork(
  ['full_name', 'first_name', 'last_name', 'email'],
  field => field.optional()  // all fields optional on update
);

const listQuerySchema = Joi.object({
  page:    Joi.number().integer().min(1).default(1),
  limit:   Joi.number().integer().min(1).max(100).default(20),
  search:  Joi.string().trim().allow('').optional(),
  sort:    Joi.string().trim().optional(),
  order:   Joi.string().valid('asc', 'desc').default('desc'),
  // Range filters
  lifetime_value_min:          Joi.number().min(0).optional(),
  lifetime_value_max:          Joi.number().min(0).optional(),
  days_since_last_purchase_min: Joi.number().min(0).optional(),
  days_since_last_purchase_max: Joi.number().min(0).optional(),
  engagement_score_min:        Joi.number().min(0).max(100).optional(),
  // Exact filters
  churned:      Joi.boolean().optional(),
  country:      Joi.string().trim().optional(),
  churn_risk:   Joi.string().valid('Low', 'Medium', 'High').optional(),
  gender:       Joi.string().valid('Male', 'Female', 'Other').optional(),
}).options({ allowUnknown: false });

module.exports = {
  validate,
  createCustomerSchema,
  updateCustomerSchema,
  listQuerySchema,
};