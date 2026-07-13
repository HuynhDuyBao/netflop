const notificationService = require('../services/notification.service');

async function listNotifications(req, res, next) {
  try {
    const result = await notificationService.listNotifications(req.user.id, {
      limit: req.query.limit
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function listPublicNotifications(req, res, next) {
  try {
    const data = await notificationService.listPublicNotifications({
      limit: req.query.limit
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function createPublicNotification(req, res, next) {
  try {
    const notification = await notificationService.createPublicNotification({
      title: req.body.title,
      message: req.body.message,
      type: req.body.type,
      link: req.body.link || null
    });

    res.status(201).json({
      success: true,
      message: 'Da tao thong bao.',
      data: notification
    });
  } catch (error) {
    next(error);
  }
}

async function deletePublicNotification(req, res, next) {
  try {
    await notificationService.deletePublicNotification(Number(req.params.id));

    res.json({
      success: true,
      message: 'Da xoa thong bao.'
    });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    await notificationService.markAsRead(req.user.id, Number(req.params.id));

    res.json({
      success: true,
      message: 'Da doc thong bao.'
    });
  } catch (error) {
    next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await notificationService.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: 'Da doc tat ca thong bao.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPublicNotification,
  deletePublicNotification,
  listNotifications,
  listPublicNotifications,
  markAllAsRead,
  markAsRead
};
