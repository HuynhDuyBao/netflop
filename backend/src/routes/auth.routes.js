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
  email: Joi.string().trim().email().max(100).required(),
  password: Joi.string().min(6).max(255).required(),
  fullName: Joi.string().trim().max(100).allow('', null),
  birthdate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('', null).messages({
    'string.pattern.base': 'Ngày sinh phải có định dạng YYYY-MM-DD.'
  }),
  phoneNumber: Joi.string().trim().pattern(/^\+[1-9]\d{7,14}$/).allow('', null).messages({
    'string.pattern.base': 'Số điện thoại phải có mã quốc gia, ví dụ +84901234567.'
  })
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

const confirmationSchema = Joi.object({
  username: Joi.string().trim().min(1).max(128).required(),
  code: Joi.string().trim().min(4).max(12).required()
});

const challengeSchema = Joi.object({
  username: Joi.string().trim().min(1).max(128).required(),
  challenge: Joi.string().valid(
    'SMS_MFA',
    'SOFTWARE_TOKEN_MFA',
    'EMAIL_OTP',
    'SMS_OTP',
    'SELECT_MFA_TYPE',
    'NEW_PASSWORD_REQUIRED'
  ).required(),
  session: Joi.string().required(),
  code: Joi.string().allow('', null),
  newPassword: Joi.string().min(6).max(255).allow('', null),
  mfaType: Joi.string().allow('', null)
});

router.get('/config', authController.config);
router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);
router.post('/confirm', validate(confirmationSchema), authController.confirmSignUp);
router.post('/resend-code', validate(Joi.object({ username: Joi.string().trim().required() })), authController.resendCode);
router.post('/challenge', validate(challengeSchema), authController.respondToChallenge);
router.get('/social-url', authController.socialUrl);
router.get('/google-url', authController.googleUrl);
router.get('/hosted-url', authController.hostedUrl);
router.get('/logout-url', authController.logoutUrl);
router.post('/social-callback', validate(Joi.object({ code: Joi.string().required() })), authController.socialCallback);
router.post('/google-callback', validate(Joi.object({ code: Joi.string().required() })), authController.googleCallback);
router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validate(updateMeSchema), authController.updateMe);
router.patch('/me/password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.get('/me/comments', authenticate, authController.myComments);
router.get('/me/ratings', authenticate, authController.myRatings);

module.exports = router;
