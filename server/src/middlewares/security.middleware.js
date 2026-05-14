const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  limit: env.rateLimit.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Qua nhieu yeu cau, vui long thu lai sau.'
  }
});

module.exports = {
  apiLimiter
};
