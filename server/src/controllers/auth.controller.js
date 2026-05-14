const authService = require('../services/auth.service');

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

module.exports = {
  login,
  me,
  register
};
