const crypto = require('crypto');
const env = require('../config/env');
const HttpError = require('../utils/httpError');
const { hashPassword } = require('../utils/password');
const { signAccessToken } = require('../utils/jwt');
const accountService = require('./account.service');

const config = env.google;

function ensureConfigured() {
  if (!config.clientId || !config.clientSecret) {
    throw new HttpError(503, 'Google OAuth chua duoc cau hinh tren may chu.');
  }
}

function loginUrl(state) {
  ensureConfigured();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state
  }).toString();
  return url.toString();
}

async function exchangeCodeForTokens(code) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code'
    })
  });
  const tokens = await response.json();
  if (!response.ok || !tokens.access_token) {
    throw new HttpError(401, 'Khong the xac thuc Google.', tokens);
  }
  return tokens;
}

async function fetchProfile(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const profile = await response.json();
  if (!response.ok || !profile.email) {
    throw new HttpError(401, 'Google khong tra ve thong tin email.', profile);
  }
  if (profile.email_verified === false) {
    throw new HttpError(403, 'Email Google chua duoc xac minh.');
  }
  return profile;
}

function usernameBase(profile) {
  return String(profile.email || profile.name || 'google-user')
    .split('@')[0]
    .replace(/[^a-zA-Z0-9_.-]/g, '')
    .slice(0, 40) || 'google-user';
}

async function syncAccount(profile) {
  const email = String(profile.email || '').trim().toLowerCase();
  let account = await accountService.findByEmail(email);

  if (!account) {
    const base = usernameBase(profile);
    let username = base;
    let suffix = 1;
    while (await accountService.findByUsernameOrEmail(username)) {
      username = `${base.slice(0, 35)}-${suffix++}`;
    }
    account = await accountService.createAccount({
      username,
      email,
      passwordHash: await hashPassword(crypto.randomBytes(32).toString('hex')),
      fullName: profile.name || '',
      role: 'user'
    });
  }

  if (account.trang_thai !== 'active') {
    throw new HttpError(403, 'Tai khoan khong duoc phep dang nhap.');
  }

  await accountService.updateLastLogin(account.id);
  const user = accountService.mapAccount(account);
  return { token: signAccessToken(user), user };
}

async function exchangeCode(code) {
  ensureConfigured();
  const tokens = await exchangeCodeForTokens(code);
  const profile = await fetchProfile(tokens.access_token);
  return syncAccount(profile);
}

module.exports = {
  exchangeCode,
  loginUrl
};
