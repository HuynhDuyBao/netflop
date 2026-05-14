const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { loginSchema, registerSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);
router.get('/me', authenticate, authController.me);

module.exports = router;
