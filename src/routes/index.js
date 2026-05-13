const express = require('express');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const movieRoutes = require('./movie.routes');
const catalogRoutes = require('./catalog.routes');
const healthController = require('../controllers/health.controller');
const movieController = require('../controllers/movie.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/health', healthController.health);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/movies', movieRoutes);
router.use('/catalog', catalogRoutes);
router.get('/me/favorites', authenticate, movieController.listFavorites);
router.get('/me/history', authenticate, movieController.listHistory);

module.exports = router;
