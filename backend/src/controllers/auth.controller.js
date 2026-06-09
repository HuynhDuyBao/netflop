const authService = require('../services/auth.service');
const accountService = require('../services/account.service');
const HttpError = require('../utils/httpError');

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body.identifier, req.body.password);

    res.json({
      success: true,
      message: 'Dang nhap thanh cong.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'Dang ky thanh cong.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({
    success: true,
    data: req.user
  });
}

async function updateMe(req, res, next) {
  try {
    const email = String(req.body.email || '').trim();

    if (!email) {
      throw new HttpError(400, 'Email khong duoc de trong.');
    }

    const updatedUser = await accountService.updateProfile(req.user.id, {
      fullName: String(req.body.fullName || req.body.ho_ten || '').trim(),
      email,
      avatarUrl: String(req.body.avatarUrl || req.body.hinh_dai_dien || '').trim()
    });

    res.json({
      success: true,
      message: 'Da cap nhat ho so.',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    await accountService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.json({
      success: true,
      message: 'Da cap nhat mat khau.'
    });
  } catch (error) {
    next(error);
  }
}

async function myComments(req, res, next) {
  try {
    const data = await accountService.listUserComments(req.user, { limit: req.query.limit });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function myRatings(req, res, next) {
  try {
    const data = await accountService.listUserRatings(req.user, { limit: req.query.limit });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  changePassword,
  login,
  me,
  myComments,
  myRatings,
  updateMe,
  register
};
