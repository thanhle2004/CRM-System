/**
 * paginate.js
 *
 * Appends $facet-based pagination to any aggregation pipeline.
 * Returns:  { data, pagination: { total, page, limit, totalPages } }
 *
 * Usage (in a service):
 *   const pipeline = [{ $match: filter }, { $sort: { created_at: -1 } }];
 *   const result = await paginate(Customer, pipeline, { page, limit });
 */

const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 100;

/**
 * @param {mongoose.Model} Model   - Mongoose model to aggregate on
 * @param {Array}          pipeline - Base aggregation stages (before pagination)
 * @param {object}         options
 * @param {number}         options.page  - Page number (1-indexed)
 * @param {number}         options.limit - Items per page
 * @returns {Promise<{ data: any[], pagination: object }>}
 */
async function paginate(Model, pipeline = [], options = {}) {
  const page  = Math.max(1, parseInt(options.page)  || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(options.limit) || DEFAULT_LIMIT));
  const skip  = (page - 1) * limit;

  // $facet runs both branches in a single aggregation pass — efficient.
  const facetPipeline = [
    ...pipeline,
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
        ],
        totalCount: [
          { $count: 'count' },
        ],
      },
    },
  ];

  const [result] = await Model.aggregate(facetPipeline);

  const total      = result?.totalCount?.[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: result?.data ?? [],
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Parse pagination params from req.query with safe defaults.
 * @param {object} query - req.query
 * @returns {{ page: number, limit: number }}
 */
function parsePagination(query = {}) {
  return {
    page:  Math.max(1, parseInt(query.page)  || DEFAULT_PAGE),
    limit: Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT)),
  };
}

module.exports = { paginate, parsePagination };