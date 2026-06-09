const express = require('express');
const tmdbController = require('../controllers/tmdb.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();
const adminOnly = [authenticate, authorizeRoles('admin', 'super_admin')];

router.get('/search', adminOnly, tmdbController.search);
router.get('/movie/:tmdbId/trailer', adminOnly, tmdbController.getTrailer);
router.get('/:type/:tmdbId/trailer', adminOnly, tmdbController.getTrailer);
router.post('/import', adminOnly, tmdbController.importMovie);
router.get('/:tmdbId', adminOnly, tmdbController.importMovie);

module.exports = router;
