const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/public', notificationController.listPublicNotifications);
router.get('/me', authenticate, notificationController.listNotifications);
router.patch('/me/read-all', authenticate, notificationController.markAllAsRead);
router.patch('/me/:id/read', authenticate, notificationController.markAsRead);

module.exports = router;
