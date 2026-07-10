const crypto = require('crypto');
const {
  ChangePasswordCommand,
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const env = require('../config/env');
const HttpError = require('../utils/httpError');
const { hashPassword } = require('../utils/password');
const { signAccessToken } = require('../utils/jwt');
const accountService = require('./account.service');

const config = env.aws;
const client = new CognitoIdentityProviderClient({ region: config.region });
let idTokenVerifier;

function ensureConfigured() {
  if (!config.cognitoUserPoolId || !config.cognitoClientId) {
    throw new HttpError(503, 'Amazon Cognito chua duoc cau hinh tren may chu.');
  }
}

function secretHash(username) {
  if (!config.cognitoClientSecret) return undefined;
  return crypto
    .createHmac('sha256', config.cognitoClientSecret)
    .update(`${username}${config.cognitoClientId}`)
    .digest('base64');
}

function authParameters(username, password) {
  const result = { USERNAME: username, PASSWORD: password };
  const hash = secretHash(username);
  if (hash) result.SECRET_HASH = hash;
  return result;
}

function attributesToObject(attributes = []) {
  return Object.fromEntries(attributes.map(({ Name, Value }) => [Name, Value]));
}

async function syncAccount(claims) {
  const email = String(claims.email || '').trim().toLowerCase();
  if (!email) throw new HttpError(400, 'Cognito khong tra ve dia chi email.');

  let account = await accountService.findByEmail(email);
  if (!account) {
    const base = String(claims['cognito:username'] || claims.preferred_username || email.split('@')[0])
      .replace(/[^a-zA-Z0-9_.-]/g, '')
      .slice(0, 40) || 'cognito-user';
    let username = base;
    let suffix = 1;
    while (await accountService.findByUsernameOrEmail(username)) {
      username = `${base.slice(0, 35)}-${suffix++}`;
    }
    account = await accountService.createAccount({
      username,
      email,
      passwordHash: await hashPassword(crypto.randomBytes(32).toString('hex')),
      fullName: claims.name || claims.given_name || '',
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

async function verifyIdToken(idToken) {
  ensureConfigured();
  if (!idTokenVerifier) {
    idTokenVerifier = CognitoJwtVerifier.create({
      userPoolId: config.cognitoUserPoolId,
      tokenUse: 'id',
      clientId: config.cognitoClientId
    });
  }
  return idTokenVerifier.verify(idToken);
}

function mapChallenge(result) {
  return {
    challenge: result.ChallengeName,
    session: result.Session,
    parameters: result.ChallengeParameters || {}
  };
}

async function finishAuthentication(result) {
  if (result.ChallengeName) return mapChallenge(result);
  const idToken = result.AuthenticationResult?.IdToken;
  if (!idToken) throw new HttpError(401, 'Cognito khong tra ve token xac thuc.');
  return syncAccount(await verifyIdToken(idToken));
}

async function register({ email, password, fullName, birthdate, phoneNumber }) {
  ensureConfigured();
  const input = {
    ClientId: config.cognitoClientId,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'birthdate', Value: birthdate },
      { Name: 'phone_number', Value: phoneNumber },
      ...(fullName ? [{ Name: 'name', Value: fullName }] : [])
    ]
  };
  const hash = secretHash(email);
  if (hash) input.SecretHash = hash;
  const result = await client.send(new SignUpCommand(input));
  return {
    confirmed: result.UserConfirmed,
    username: email,
    destination: result.CodeDeliveryDetails?.Destination,
    deliveryMedium: result.CodeDeliveryDetails?.DeliveryMedium
  };
}

async function confirmSignUp({ username, code }) {
  ensureConfigured();
  const input = {
    ClientId: config.cognitoClientId,
    Username: username,
    ConfirmationCode: code
  };
  const hash = secretHash(username);
  if (hash) input.SecretHash = hash;
  await client.send(new ConfirmSignUpCommand(input));
  return { confirmed: true };
}

async function resendCode(username) {
  ensureConfigured();
  const input = { ClientId: config.cognitoClientId, Username: username };
  const hash = secretHash(username);
  if (hash) input.SecretHash = hash;
  const result = await client.send(new ResendConfirmationCodeCommand(input));
  return {
    destination: result.CodeDeliveryDetails?.Destination,
    deliveryMedium: result.CodeDeliveryDetails?.DeliveryMedium
  };
}

async function login(identifier, password) {
  ensureConfigured();
  const result = await client.send(new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: config.cognitoClientId,
    AuthParameters: authParameters(identifier, password)
  }));
  return finishAuthentication(result);
}

async function authenticateForPasswordChange(identifier, password) {
  return client.send(new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: config.cognitoClientId,
    AuthParameters: authParameters(identifier, password)
  }));
}

async function changePassword(user, currentPassword, nextPassword) {
  ensureConfigured();
  const identifiers = [...new Set([
    String(user?.email || '').trim(),
    String(user?.ten_dang_nhap || '').trim()
  ].filter(Boolean))];
  let lastError;

  for (const identifier of identifiers) {
    let authResult;
    try {
      authResult = await authenticateForPasswordChange(identifier, currentPassword);
    } catch (error) {
      lastError = error;
      continue;
    }

    const accessToken = authResult.AuthenticationResult?.AccessToken;

    if (!accessToken) {
      throw new HttpError(400, 'Vui long dang nhap lai de doi mat khau.');
    }

    await client.send(new ChangePasswordCommand({
      PreviousPassword: currentPassword,
      ProposedPassword: nextPassword,
      AccessToken: accessToken
    }));
    await accountService.setPassword(user.id, nextPassword);
    return;
  }

  if (lastError?.name === 'InvalidPasswordException') {
    throw translateError(lastError);
  }
  throw new HttpError(400, 'Mat khau hien tai khong dung.');
}

async function respondToChallenge({ username, challenge, session, code, newPassword, mfaType }) {
  ensureConfigured();
  const responses = { USERNAME: username };
  const responseKeys = {
    SMS_MFA: 'SMS_MFA_CODE',
    SOFTWARE_TOKEN_MFA: 'SOFTWARE_TOKEN_MFA_CODE',
    EMAIL_OTP: 'EMAIL_OTP_CODE',
    SMS_OTP: 'SMS_OTP_CODE',
    SELECT_MFA_TYPE: 'ANSWER'
  };
  if (responseKeys[challenge]) responses[responseKeys[challenge]] = challenge === 'SELECT_MFA_TYPE' ? mfaType : code;
  if (challenge === 'NEW_PASSWORD_REQUIRED') responses.NEW_PASSWORD = newPassword;
  const hash = secretHash(username);
  if (hash) responses.SECRET_HASH = hash;

  const result = await client.send(new RespondToAuthChallengeCommand({
    ClientId: config.cognitoClientId,
    ChallengeName: challenge,
    Session: session,
    ChallengeResponses: responses
  }));
  return finishAuthentication(result);
}

function hostedUiUrl(provider, state, screen = 'login') {
  ensureConfigured();
  if (!config.cognitoDomain || !config.cognitoRedirectUri) {
    throw new HttpError(503, 'Cognito Hosted UI chua duoc cau hinh.');
  }
  const path = screen === 'signup' ? '/signup' : '/oauth2/authorize';
  const url = new URL(path, config.cognitoDomain);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.cognitoClientId,
    redirect_uri: config.cognitoRedirectUri,
    scope: 'openid email',
    prompt: 'login',
    state
  });
  if (provider) params.set('identity_provider', provider);
  url.search = params.toString();
  return url.toString();
}

function logoutUrl() {
  ensureConfigured();
  if (!config.cognitoDomain) {
    throw new HttpError(503, 'Cognito Hosted UI chua duoc cau hinh.');
  }
  const url = new URL('/logout', config.cognitoDomain);
  url.search = new URLSearchParams({
    client_id: config.cognitoClientId,
    logout_uri: config.cognitoLogoutUri
  }).toString();
  return url.toString();
}

async function exchangeCode(code) {
  ensureConfigured();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.cognitoClientId,
    code,
    redirect_uri: config.cognitoRedirectUri
  });
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (config.cognitoClientSecret) {
    headers.Authorization = `Basic ${Buffer.from(`${config.cognitoClientId}:${config.cognitoClientSecret}`).toString('base64')}`;
  }
  const response = await fetch(new URL('/oauth2/token', config.cognitoDomain), {
    method: 'POST',
    headers,
    body
  });
  const tokens = await response.json();
  if (!response.ok || !tokens.id_token) {
    throw new HttpError(401, 'Khong the hoan tat social login.', tokens);
  }
  return syncAccount(await verifyIdToken(tokens.id_token));
}

function publicConfig() {
  return {
    enabled: Boolean(config.cognitoUserPoolId && config.cognitoClientId),
    socialEnabled: Boolean(config.cognitoDomain && config.cognitoRedirectUri)
  };
}

function translateError(error) {
  if (
    error.name === 'InvalidParameterException'
    && String(error.message || '').includes('USER_PASSWORD_AUTH flow not enabled')
  ) {
    return new HttpError(
      503,
      'App client Cognito chưa bật đăng nhập bằng mật khẩu (ALLOW_USER_PASSWORD_AUTH).'
    );
  }

  const messages = {
    CodeMismatchException: 'Ma OTP khong dung.',
    ExpiredCodeException: 'Ma OTP da het han.',
    InvalidPasswordException: 'Mat khau khong dap ung chinh sach cua Cognito.',
    NotAuthorizedException: 'Thong tin dang nhap khong dung.',
    UsernameExistsException: 'Ten dang nhap da ton tai.',
    UserNotConfirmedException: 'Tai khoan chua duoc xac nhan bang OTP.',
    UserNotFoundException: 'Khong tim thay tai khoan.'
  };
  if (messages[error.name]) return new HttpError(400, messages[error.name]);
  return error;
}

module.exports = {
  changePassword,
  confirmSignUp,
  exchangeCode,
  hostedUiUrl,
  login,
  logoutUrl,
  publicConfig,
  register,
  resendCode,
  respondToChallenge,
  translateError
};
