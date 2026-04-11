const CustomerService = require('../services/customer.service');

const CustomerController = {

  async list(req, res, next) {
    try {
      const result = await CustomerService.listCustomers(req.query);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  async getOne(req, res, next) {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      res.json({ success: true, data: customer });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const customer = await CustomerService.createCustomer(req.body);
      res.status(201).json({ success: true, data: customer });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const customer = await CustomerService.updateCustomer(req.params.id, req.body);
      res.json({ success: true, data: customer });
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      const result = await CustomerService.deleteCustomer(req.params.id);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async recomputeScores(req, res, next) {
    try {
      const result = await CustomerService.recomputeAllEngagementScores();
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};

module.exports = CustomerController;