const express = require('express');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const healthController = require('../controllers/health.controller');

const router = express.Router();

router.get('/health', healthController.health);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
