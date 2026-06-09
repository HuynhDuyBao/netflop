const express = require('express');
const ratingController = require('../controllers/rating.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authenticate, authorizeRoles('admin', 'super_admin'), ratingController.list);

module.exports = router;
