const express = require('express');
const commentController = require('../controllers/comment.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authenticate, authorizeRoles('admin', 'super_admin'), commentController.list);

module.exports = router;
