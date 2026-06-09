const HttpError = require('../utils/httpError');
const { verifyAccessToken } = require('../utils/jwt');
const accountService = require('../services/account.service');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Thieu token xac thuc.');
    }

    const payload = verifyAccessToken(token);
    const user = await accountService.findById(payload.sub);

    if (!user || user.trang_thai !== 'active') {
      throw new HttpError(401, 'Token khong hop le hoac tai khoan da bi khoa.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new HttpError(401, 'Token khong hop le hoac da het han.'));
      return;
    }

    next(error);
  }
}

async function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await accountService.findById(payload.sub);

    if (user && user.trang_thai === 'active') {
      req.user = user;
    }

    next();
  } catch {
    next();
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      next(new HttpError(401, 'Chua xac thuc.'));
      return;
    }

    if (!roles.includes(req.user.vai_tro)) {
      next(new HttpError(403, 'Ban khong co quyen thuc hien thao tac nay.'));
      return;
    }

    next();
  };
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorizeRoles
};
