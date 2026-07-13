const accountService = require('../services/account.service');
const HttpError = require('../utils/httpError');
const cognitoService = require('../services/cognito.service');
const googleService = require('../services/google.service');

async function login(req, res, next) {
  try {
    const result = await cognitoService.login(req.body.identifier, req.body.password);

    res.json({
      success: true,
      message: 'Dang nhap thanh cong.',
      data: result
    });
  } catch (error) {
    next(cognitoService.translateError(error));
  }
}

async function register(req, res, next) {
  try {
    const result = await cognitoService.register(req.body);

    res.status(201).json({
      success: true,
      message: result.confirmed ? 'Dang ky thanh cong.' : 'Vui long nhap ma OTP de xac nhan tai khoan.',
      data: result
    });
  } catch (error) {
    next(cognitoService.translateError(error));
  }
}

async function confirmSignUp(req, res, next) {
  try {
    const data = await cognitoService.confirmSignUp(req.body);
    res.json({ success: true, message: 'Xac nhan tai khoan thanh cong.', data });
  } catch (error) {
    next(cognitoService.translateError(error));
  }
}

async function resendCode(req, res, next) {
  try {
    const data = await cognitoService.resendCode(req.body.username);
    res.json({ success: true, message: 'Da gui lai ma OTP.', data });
  } catch (error) {
    next(cognitoService.translateError(error));
  }
}

async function forgotPassword(req, res, next) {
  try {
    const data = await cognitoService.forgotPassword(req.body.identifier);
    res.json({ success: true, message: 'Da gui ma dat lai mat khau.', data });
  } catch (error) {
    next(cognitoService.translateError(error));
  }
}

async function confirmForgotPassword(req, res, next) {
  try {
    const data = await cognitoService.confirmForgotPassword(req.body);
    res.json({ success: true, message: 'Da cap nhat mat khau moi.', data });
  } catch (error) {
    next(cognitoService.translateError(error));
  }
}

async function respondToChallenge(req, res, next) {
  try {
    const data = await cognitoService.respondToChallenge(req.body);
    res.json({ success: true, message: data.challenge ? 'Can them buoc xac thuc.' : 'Dang nhap thanh cong.', data });
  } catch (error) {
    next(cognitoService.translateError(error));
  }
}

function config(req, res) {
  res.json({ success: true, data: cognitoService.publicConfig() });
}

function socialUrl(req, res, next) {
  try {
    const providers = { google: 'Google', facebook: 'Facebook' };
    const provider = providers[String(req.query.provider || '').toLowerCase()];
    if (!provider) throw new HttpError(400, 'Nha cung cap social login khong hop le.');
    const url = cognitoService.hostedUiUrl(provider, String(req.query.state || ''));
    res.json({ success: true, data: { url } });
  } catch (error) {
    next(error);
  }
}

function hostedUrl(req, res, next) {
  try {
    const screen = req.query.screen === 'signup' ? 'signup' : 'login';
    const url = cognitoService.hostedUiUrl(null, String(req.query.state || ''), screen);
    res.json({ success: true, data: { url } });
  } catch (error) {
    next(error);
  }
}

function googleUrl(req, res, next) {
  try {
    const url = googleService.loginUrl(String(req.query.state || ''));
    res.json({ success: true, data: { url } });
  } catch (error) {
    next(error);
  }
}

function logoutUrl(req, res, next) {
  try {
    res.json({ success: true, data: { url: cognitoService.logoutUrl() } });
  } catch (error) {
    next(error);
  }
}

async function socialCallback(req, res, next) {
  try {
    const data = await cognitoService.exchangeCode(req.body.code);
    res.json({ success: true, message: 'Dang nhap thanh cong.', data });
  } catch (error) {
    next(cognitoService.translateError(error));
  }
}

async function googleCallback(req, res, next) {
  try {
    const data = await googleService.exchangeCode(req.body.code);
    res.json({ success: true, message: 'Dang nhap Google thanh cong.', data });
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
    await cognitoService.changePassword(req.user, req.body.currentPassword, req.body.newPassword);
    res.json({
      success: true,
      message: 'Da cap nhat mat khau.'
    });
  } catch (error) {
    next(cognitoService.translateError(error));
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
  config,
  confirmForgotPassword,
  confirmSignUp,
  forgotPassword,
  googleCallback,
  googleUrl,
  hostedUrl,
  login,
  logoutUrl,
  me,
  myComments,
  myRatings,
  updateMe,
  register,
  resendCode,
  respondToChallenge,
  socialCallback,
  socialUrl
};
