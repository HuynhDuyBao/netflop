import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { authApi } from '../services/authApi.js';
import { movieApi } from '../services/movieApi.js';
import { normalizeMovies } from '../utils/normalizeMovie.js';

const initialLogin = { identifier: '', password: '' };
const initialRegister = {
  username: '',
  email: '',
  fullName: '',
  password: '',
  confirmPassword: '',
  terms: false
};
const initialForgot = {
  identifier: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
};

function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4zM4 7l8 6 8-6" /></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>;
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></svg>;
}

function EyeIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {open ? (
        <>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 5.2A10.7 10.7 0 0112 5c6.5 0 10 7 10 7a18.6 18.6 0 01-3.1 4.1" />
          <path d="M6.5 6.7C3.6 8.7 2 12 2 12s3.5 7 10 7a10.4 10.4 0 004.1-.8" />
        </>
      )}
    </svg>
  );
}

function GoogleIcon() {
  return <span className="auth-google-icon" aria-hidden="true">G</span>;
}

function PasswordField({ autoComplete, name, onChange, placeholder, show, toggleShow, value }) {
  return (
    <label className="auth-field auth-password-field">
      <LockIcon />
      <input
        autoComplete={autoComplete}
        minLength="6"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required
        type={show ? 'text' : 'password'}
        value={value}
      />
      <button
        className="auth-password-toggle"
        onClick={toggleShow}
        type="button"
        aria-label={show ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
      >
        <EyeIcon open={show} />
      </button>
    </label>
  );
}

function AuthPage({ initialMode = 'login' }) {
  const { login, register, completeChallenge, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginDraft, setLoginDraft] = useState(initialLogin);
  const [registerDraft, setRegisterDraft] = useState(initialRegister);
  const [forgotDraft, setForgotDraft] = useState(initialForgot);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState('request');
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const [verificationValue, setVerificationValue] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [background, setBackground] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  const returnTo = location.state?.from || '/';

  useEffect(() => {
    if (user) navigate(user.vai_tro === 'admin' ? '/admin' : returnTo, { replace: true });
  }, [navigate, returnTo, user]);

  useEffect(() => {
    movieApi.list({ limit: 12, sort: 'popular' })
      .then((response) => {
        const movies = normalizeMovies(response.data.data || []);
        const hero = movies.find((movie) => movie.backdrop || movie.poster);
        setBackground(hero?.backdrop || hero?.poster || '');
      })
      .catch(() => {});
  }, []);

  function updateDraft(setter) {
    return (event) => {
      const { name, type, checked, value } = event.target;
      setter((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    };
  }

  function adminDestination(account) {
    return ['admin', 'super_admin'].includes(account?.vai_tro) ? '/admin' : returnTo;
  }

  async function submitLogin(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy('login');
    try {
      const result = await login(loginDraft);
      if (result?.challenge) {
        setPendingChallenge({ ...result, username: loginDraft.identifier });
        setVerificationValue('');
      } else {
        navigate(adminDestination(result), { replace: true });
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setBusy('');
    }
  }

  async function submitRegister(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (registerDraft.password !== registerDraft.confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    if (!registerDraft.terms) {
      setError('Bạn cần đồng ý với điều khoản sử dụng.');
      return;
    }
    setBusy('register');
    try {
      const result = await register({
        username: registerDraft.username,
        email: registerDraft.email,
        fullName: registerDraft.fullName,
        password: registerDraft.password
      });
      if (result.confirmed) {
        setLoginDraft({ identifier: registerDraft.email, password: registerDraft.password });
        const loggedInUser = await login({ identifier: registerDraft.email, password: registerDraft.password });
        navigate(adminDestination(loggedInUser), { replace: true });
      } else {
        setPendingConfirmation({
          username: result.username || registerDraft.username,
          loginIdentifier: result.email || registerDraft.email,
          password: registerDraft.password,
          destination: result.destination
        });
        setVerificationValue('');
        setMessage(`Mã xác nhận đã được gửi${result.destination ? ` tới ${result.destination}` : ' tới email của bạn'}.`);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể tạo tài khoản. Vui lòng thử lại.');
    } finally {
      setBusy('');
    }
  }

  async function submitForgotPassword(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (forgotStep === 'confirm') {
      if (forgotDraft.newPassword !== forgotDraft.confirmPassword) {
        setError('Mật khẩu xác nhận chưa khớp.');
        return;
      }
      setBusy('forgot-confirm');
      try {
        await authApi.confirmForgotPassword({
          identifier: forgotDraft.identifier,
          code: forgotDraft.code,
          newPassword: forgotDraft.newPassword
        });
        setForgotOpen(false);
        setForgotStep('request');
        setLoginDraft({ identifier: forgotDraft.identifier, password: '' });
        setForgotDraft(initialForgot);
        setMessage('Đã cập nhật mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.');
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Không thể đặt lại mật khẩu.');
      } finally {
        setBusy('');
      }
      return;
    }

    setBusy('forgot');
    try {
      const response = await authApi.forgotPassword({ identifier: forgotDraft.identifier });
      const destination = response.data.data?.destination;
      setForgotStep('confirm');
      setMessage(`Mã đặt lại mật khẩu đã được gửi${destination ? ` tới ${destination}` : ' tới email của bạn'}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể gửi mã đặt lại mật khẩu.');
    } finally {
      setBusy('');
    }
  }

  async function submitVerification(event) {
    event.preventDefault();
    setError('');
    setBusy('verify');
    try {
      if (pendingConfirmation) {
        await authApi.confirm({
          username: pendingConfirmation.username,
          code: verificationValue.replace(/\s/g, '')
        });
        try {
          const loggedInUser = await login({
            identifier: pendingConfirmation.loginIdentifier || pendingConfirmation.username,
            password: pendingConfirmation.password
          });
          navigate(adminDestination(loggedInUser), { replace: true });
        } catch (loginError) {
          setPendingConfirmation(null);
          setVerificationValue('');
          setLoginDraft({
            identifier: pendingConfirmation.loginIdentifier || '',
            password: ''
          });
          setMessage('Tài khoản đã xác nhận. Vui lòng đăng nhập lại.');
          setError(loginError.response?.data?.message || '');
        }
      } else if (pendingChallenge) {
        const isNewPassword = pendingChallenge.challenge === 'NEW_PASSWORD_REQUIRED';
        const isMfaSelection = pendingChallenge.challenge === 'SELECT_MFA_TYPE';
        const result = await completeChallenge({
          username: pendingChallenge.username,
          challenge: pendingChallenge.challenge,
          session: pendingChallenge.session,
          code: isNewPassword || isMfaSelection ? '' : verificationValue,
          newPassword: isNewPassword ? verificationValue : '',
          mfaType: isMfaSelection ? verificationValue : ''
        });
        if (result.challenge) {
          setPendingChallenge((current) => ({ ...result, username: current.username }));
          setVerificationValue('');
        } else {
          navigate(adminDestination(result.user), { replace: true });
        }
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Mã xác thực không hợp lệ.');
    } finally {
      setBusy('');
    }
  }

  async function resendCode() {
    if (!pendingConfirmation) return;
    setBusy('resend');
    setError('');
    try {
      await authApi.resendCode({ username: pendingConfirmation.username });
      setMessage('Đã gửi lại mã xác nhận.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể gửi lại mã xác nhận.');
    } finally {
      setBusy('');
    }
  }

  async function startGoogleLogin() {
    setBusy('google');
    setError('');
    try {
      const state = crypto.randomUUID();
      sessionStorage.setItem('oauthState', state);
      sessionStorage.setItem('oauthReturnTo', returnTo);
      sessionStorage.setItem('oauthProvider', 'google');
      const response = await authApi.googleUrl({ state });
      window.location.assign(response.data.data.url);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể mở đăng nhập liên kết.');
      setBusy('');
    }
  }

  const verificationOpen = Boolean(pendingConfirmation || pendingChallenge);
  const verificationTitle = pendingConfirmation ? 'Xác nhận tài khoản' : 'Xác thực đăng nhập';
  const verificationLabel = pendingChallenge?.challenge === 'NEW_PASSWORD_REQUIRED'
    ? 'Mật khẩu mới'
    : pendingChallenge?.challenge === 'SELECT_MFA_TYPE' ? 'Loại MFA (SMS_MFA hoặc SOFTWARE_TOKEN_MFA)' : 'Mã xác thực';

  return (
    <main
      className="auth-screen"
      style={background ? { '--auth-background': `url("${background.replaceAll('"', '%22')}")` } : undefined}
    >
      <div className="auth-screen-shade" />
      <section className="auth-shell auth-shell-single" aria-label={initialMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}>
        {initialMode === 'login' && <div className="auth-panel auth-login-panel">
          <header className="auth-heading">
            <span>Đăng nhập</span>
            <i />
          </header>
          <h1>Chào mừng trở lại</h1>
          <form onSubmit={submitLogin}>
            <label className="auth-field">
              <MailIcon />
              <input
                autoComplete="username"
                name="identifier"
                onChange={updateDraft(setLoginDraft)}
                placeholder="Email hoặc tên đăng nhập"
                required
                value={loginDraft.identifier}
              />
            </label>
            <PasswordField
              autoComplete="current-password"
              name="password"
              onChange={updateDraft(setLoginDraft)}
              placeholder="Mật khẩu"
              show={showLoginPassword}
              toggleShow={() => setShowLoginPassword((current) => !current)}
              value={loginDraft.password}
            />
            <button
              className="auth-link-button"
              onClick={() => {
                setForgotOpen(true);
                setForgotDraft((current) => ({ ...current, identifier: loginDraft.identifier }));
                setError('');
                setMessage('');
              }}
              type="button"
            >
              Quên mật khẩu?
            </button>
            <button className="auth-primary auth-primary-warm" disabled={Boolean(busy)} type="submit">
              {busy === 'login' ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
          <p className="auth-or">Hoặc đăng nhập với:</p>
          <div className="auth-social-stack">
            <button disabled={Boolean(busy)} onClick={startGoogleLogin} type="button"><GoogleIcon />Đăng nhập với Google</button>
          </div>
          <p className="auth-switch">Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
        </div>}

        {initialMode === 'register' && <div className="auth-panel auth-register-panel">
          <header className="auth-heading">
            <span>Tạo tài khoản</span>
            <i />
          </header>
          <h1>Mới đến Netflop?</h1>
          <form onSubmit={submitRegister}>
            <label className="auth-field"><UserIcon /><input autoComplete="username" name="username" onChange={updateDraft(setRegisterDraft)} placeholder="Tên đăng nhập" required value={registerDraft.username} /></label>
            <label className="auth-field"><MailIcon /><input autoComplete="email" name="email" onChange={updateDraft(setRegisterDraft)} placeholder="Email" required type="email" value={registerDraft.email} /></label>
            <label className="auth-field"><UserIcon /><input autoComplete="name" name="fullName" onChange={updateDraft(setRegisterDraft)} placeholder="Họ và tên" required value={registerDraft.fullName} /></label>
            <PasswordField autoComplete="new-password" name="password" onChange={updateDraft(setRegisterDraft)} placeholder="Mật khẩu" show={showRegisterPassword} toggleShow={() => setShowRegisterPassword((current) => !current)} value={registerDraft.password} />
            <PasswordField autoComplete="new-password" name="confirmPassword" onChange={updateDraft(setRegisterDraft)} placeholder="Xác nhận mật khẩu" show={showRegisterConfirm} toggleShow={() => setShowRegisterConfirm((current) => !current)} value={registerDraft.confirmPassword} />
            <p className="auth-or">Hoặc đăng ký với:</p>
            <div className="auth-social-row">
              <button disabled={Boolean(busy)} onClick={startGoogleLogin} type="button"><GoogleIcon />Google</button>
            </div>
            <button className="auth-primary" disabled={Boolean(busy)} type="submit">
              {busy === 'register' ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </button>
            <label className="auth-terms">
              <input checked={registerDraft.terms} name="terms" onChange={updateDraft(setRegisterDraft)} type="checkbox" />
              <span>Tôi đồng ý với <a href="/terms">điều khoản sử dụng</a> và <a href="/privacy">chính sách riêng tư</a>.</span>
            </label>
          </form>
          <p className="auth-switch">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
        </div>}
        {(error || message) && !forgotOpen && <div className={`auth-feedback ${error ? 'is-error' : ''}`} role="status">{error || message}</div>}
      </section>

      {verificationOpen && (
        <div className="auth-modal-backdrop">
          <form className="auth-verify-modal" onSubmit={submitVerification}>
            <button className="auth-modal-close" onClick={() => { setPendingConfirmation(null); setPendingChallenge(null); setError(''); }} type="button" aria-label="Đóng">x</button>
            <span className="auth-modal-mark">OK</span>
            <h2>{verificationTitle}</h2>
            <p>{message || 'Hoàn tất bước bảo mật để tiếp tục.'}</p>
            <label>{verificationLabel}<input autoComplete="one-time-code" autoFocus inputMode="numeric" minLength="4" onChange={(event) => setVerificationValue(event.target.value.trim())} required type={pendingChallenge?.challenge === 'NEW_PASSWORD_REQUIRED' ? 'password' : 'text'} value={verificationValue} /></label>
            {error && <p className="auth-modal-error">{error}</p>}
            <button className="auth-primary" disabled={Boolean(busy)} type="submit">{busy === 'verify' ? 'Đang xác nhận...' : 'Xác nhận'}</button>
            {pendingConfirmation && <button className="auth-resend" disabled={Boolean(busy)} onClick={resendCode} type="button">Gửi lại mã</button>}
          </form>
        </div>
      )}

      {forgotOpen && (
        <div className="auth-modal-backdrop">
          <form className="auth-verify-modal" onSubmit={submitForgotPassword}>
            <button className="auth-modal-close" onClick={() => { setForgotOpen(false); setForgotStep('request'); setError(''); }} type="button" aria-label="Đóng">x</button>
            <span className="auth-modal-mark">?</span>
            <h2>Quên mật khẩu</h2>
            <p>{forgotStep === 'request' ? 'Nhập email hoặc tên đăng nhập để nhận mã đặt lại mật khẩu.' : 'Nhập mã xác nhận và mật khẩu mới.'}</p>
            <label>
              Email hoặc tên đăng nhập
              <input autoComplete="username" name="identifier" onChange={updateDraft(setForgotDraft)} required value={forgotDraft.identifier} />
            </label>
            {forgotStep === 'confirm' && (
              <>
                <label>
                  Mã xác nhận
                  <input autoComplete="one-time-code" inputMode="numeric" name="code" onChange={updateDraft(setForgotDraft)} required value={forgotDraft.code} />
                </label>
                <PasswordField autoComplete="new-password" name="newPassword" onChange={updateDraft(setForgotDraft)} placeholder="Mật khẩu mới" show={showForgotPassword} toggleShow={() => setShowForgotPassword((current) => !current)} value={forgotDraft.newPassword} />
                <PasswordField autoComplete="new-password" name="confirmPassword" onChange={updateDraft(setForgotDraft)} placeholder="Xác nhận mật khẩu mới" show={showForgotConfirm} toggleShow={() => setShowForgotConfirm((current) => !current)} value={forgotDraft.confirmPassword} />
              </>
            )}
            {error && <p className="auth-modal-error">{error}</p>}
            {message && <p className="auth-modal-success">{message}</p>}
            <button className="auth-primary" disabled={Boolean(busy)} type="submit">
              {busy ? 'Đang xử lý...' : forgotStep === 'request' ? 'Gửi mã xác nhận' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

export default AuthPage;
