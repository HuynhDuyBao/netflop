const express = require('express');
const Joi = require('joi');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

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

const updateMeSchema = Joi.object({
  fullName: Joi.string().trim().max(100).allow('', null),
  email: Joi.string().trim().email().max(100).required(),
  avatarUrl: Joi.string().trim().max(1000).allow('', null)
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(255).required(),
  newPassword: Joi.string().min(6).max(255).required()
});

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);
router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validate(updateMeSchema), authController.updateMe);
router.patch('/me/password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.get('/me/comments', authenticate, authController.myComments);
router.get('/me/ratings', authenticate, authController.myRatings);

module.exports = router;
