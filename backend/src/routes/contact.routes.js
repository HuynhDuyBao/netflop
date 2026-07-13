const express = require('express');
const Joi = require('joi');
const contactController = require('../controllers/contact.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

const contactSchema = Joi.object({
  topic: Joi.string().trim().max(60).required(),
  message: Joi.string().trim().min(10).max(5000).required()
});

router.post('/', authenticate, validate(contactSchema), contactController.createMessage);

module.exports = router;
