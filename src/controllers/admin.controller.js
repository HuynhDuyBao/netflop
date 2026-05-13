const accountService = require('../services/account.service');

async function listUsers(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const search = req.query.search || '';
    const result = await accountService.listAccounts({ page, limit, search });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const user = await accountService.updateAccountRole(Number(req.params.id), req.body.role);

    res.json({
      success: true,
      message: 'Cap nhat vai tro thanh cong.',
      data: user
    });
  } catch (error) {
    next(error);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const user = await accountService.updateAccountStatus(Number(req.params.id), req.body.status);

    res.json({
      success: true,
      message: 'Cap nhat trang thai thanh cong.',
      data: user
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  updateUserRole,
  updateUserStatus
};
