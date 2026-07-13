const contactService = require('../services/contact.service');

async function createMessage(req, res, next) {
  try {
    const message = await contactService.createMessage({
      ...req.body,
      userId: req.user.id,
      name: req.user.ho_ten || req.user.ten_dang_nhap || req.user.email,
      email: req.user.email,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || ''
    });

    res.status(201).json({
      success: true,
      message: 'Da gui lien he.',
      data: message
    });
  } catch (error) {
    next(error);
  }
}

async function listMessages(req, res, next) {
  try {
    const result = await contactService.listMessages({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search || '',
      status: req.query.status || ''
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function updateMessageStatus(req, res, next) {
  try {
    const message = await contactService.updateMessageStatus(Number(req.params.id), req.body.status);

    res.json({
      success: true,
      message: 'Da cap nhat trang thai lien he.',
      data: message
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createMessage,
  listMessages,
  updateMessageStatus
};
