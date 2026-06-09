const HttpError = require('../utils/httpError');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signAccessToken } = require('../utils/jwt');
const accountService = require('./account.service');

async function login(identifier, password) {
  const account = await accountService.findByUsernameOrEmail(identifier);

  if (!account) {
    throw new HttpError(401, 'Ten dang nhap/email hoac mat khau khong dung.');
  }

  if (account.trang_thai !== 'active') {
    throw new HttpError(403, 'Tai khoan khong duoc phep dang nhap.');
  }

  const passwordOk = await verifyPassword(password, account.mat_khau);

  if (!passwordOk) {
    throw new HttpError(401, 'Ten dang nhap/email hoac mat khau khong dung.');
  }

  await accountService.updateLastLogin(account.id);
  const safeAccount = accountService.mapAccount(account);

  return {
    token: signAccessToken(safeAccount),
    user: safeAccount
  };
}

async function register({ username, email, password, fullName }) {
  const exists = await accountService.usernameOrEmailExists(username, email);

  if (exists) {
    throw new HttpError(409, 'Ten dang nhap hoac email da ton tai.');
  }

  const passwordHash = await hashPassword(password);
  const user = await accountService.createAccount({
    username,
    email,
    passwordHash,
    fullName,
    role: 'user'
  });

  return {
    token: signAccessToken(user),
    user
  };
}

module.exports = {
  login,
  register
};
