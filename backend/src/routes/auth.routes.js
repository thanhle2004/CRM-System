const express = require('express');
const Joi = require('joi');

const AuthController = require('../controllers/auth.controller');
const { optionalAuth, protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('admin', 'staff').optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(128).required(),
});

router.post('/register', optionalAuth, validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', protect, AuthController.me);

module.exports = router;
