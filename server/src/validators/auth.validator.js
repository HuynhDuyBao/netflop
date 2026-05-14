const Joi = require('joi');

const loginSchema = Joi.object({
  identifier: Joi.string().trim().min(3).max(100).required(),
  password: Joi.string().min(1).max(255).required()
});

const registerSchema = Joi.object({
  username: Joi.string().trim().min(3).max(50).required(),
  email: Joi.string().trim().email().max(100).required(),
  password: Joi.string().min(6).max(255).required(),
  fullName: Joi.string().trim().max(100).allow('', null)
});

module.exports = {
  loginSchema,
  registerSchema
};
