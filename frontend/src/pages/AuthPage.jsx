import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { authApi } from '../services/authApi.js';
import { movieApi } from '../services/movieApi.js';
import { normalizeMovies } from '../utils/normalizeMovie.js';

const initialLogin = { identifier: '', password: '' };
const initialRegister = {
  fullName: '',
  email: '',
  birthdate: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  terms: false
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

function GoogleIcon() {
  return <span className="auth-google-icon" aria-hidden="true">G</span>;
}

function AwsIcon() {
  return <span className="auth-aws-icon" aria-hidden="true">aws</span>;
}

function AuthPage({ initialMode = 'login' }) {
  const { login, register, completeChallenge, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginDraft, setLoginDraft] = useState(initialLogin);
  const [registerDraft, setRegisterDraft] = useState(initialRegister);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const [verificationValue, setVerificationValue] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [background, setBackground] = useState('');
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
        navigate(result?.vai_tro === 'admin' ? '/admin' : returnTo, { replace: true });
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
        fullName: registerDraft.fullName,
        email: registerDraft.email,
        birthdate: registerDraft.birthdate,
        phoneNumber: registerDraft.phoneNumber,
        password: registerDraft.password
      });
      if (result.confirmed) {
        setLoginDraft({ identifier: registerDraft.email, password: registerDraft.password });
        const loggedInUser = await login({ identifier: registerDraft.email, password: registerDraft.password });
        navigate(loggedInUser?.vai_tro === 'admin' ? '/admin' : returnTo, { replace: true });
      } else {
        setPendingConfirmation({
          username: result.username || registerDraft.email,
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

  async function submitVerification(event) {
    event.preventDefault();
    setError('');
    setBusy('verify');
    try {
      if (pendingConfirmation) {
        await authApi.confirm({ username: pendingConfirmation.username, code: verificationValue });
        const loggedInUser = await login({
          identifier: pendingConfirmation.username,
          password: pendingConfirmation.password
        });
        navigate(loggedInUser?.vai_tro === 'admin' ? '/admin' : returnTo, { replace: true });
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
          navigate(result.user?.vai_tro === 'admin' ? '/admin' : returnTo, { replace: true });
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

  async function startHostedLogin(provider) {
    setBusy(provider || 'aws');
    setError('');
    try {
      const state = crypto.randomUUID();
      sessionStorage.setItem('cognitoOAuthState', state);
      sessionStorage.setItem('cognitoReturnTo', returnTo);
      const response = provider
        ? await authApi.socialUrl({ provider, state })
        : await authApi.hostedUrl({ screen: initialMode === 'register' ? 'signup' : 'login', state });
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
            <label className="auth-field">
              <LockIcon />
              <input
                autoComplete="current-password"
                minLength="6"
                name="password"
                onChange={updateDraft(setLoginDraft)}
                placeholder="Mật khẩu"
                required
                type="password"
                value={loginDraft.password}
              />
            </label>
            <button className="auth-primary auth-primary-warm" disabled={Boolean(busy)} type="submit">
              {busy === 'login' ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
          <p className="auth-or">Hoặc đăng nhập với:</p>
          <div className="auth-social-stack">
            <button disabled={Boolean(busy)} onClick={() => startHostedLogin('google')} type="button"><GoogleIcon />Đăng nhập với Google</button>
            <button className="auth-aws-button" disabled={Boolean(busy)} onClick={() => startHostedLogin()} type="button"><AwsIcon />Đăng nhập với AWS</button>
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
            <label className="auth-field"><UserIcon /><input autoComplete="name" name="fullName" onChange={updateDraft(setRegisterDraft)} placeholder="Họ và tên" required value={registerDraft.fullName} /></label>
            <label className="auth-field"><MailIcon /><input autoComplete="email" name="email" onChange={updateDraft(setRegisterDraft)} placeholder="Email" required type="email" value={registerDraft.email} /></label>
            <label className="auth-field"><UserIcon /><input autoComplete="bday" aria-label="Ngày sinh" name="birthdate" onChange={updateDraft(setRegisterDraft)} required type="date" value={registerDraft.birthdate} /></label>
            <label className="auth-field"><MailIcon /><input autoComplete="tel" name="phoneNumber" onChange={updateDraft(setRegisterDraft)} pattern="\+[1-9][0-9]{7,14}" placeholder="Số điện thoại, ví dụ +84901234567" required type="tel" value={registerDraft.phoneNumber} /></label>
            <label className="auth-field"><LockIcon /><input autoComplete="new-password" minLength="6" name="password" onChange={updateDraft(setRegisterDraft)} placeholder="Mật khẩu" required type="password" value={registerDraft.password} /></label>
            <label className="auth-field"><LockIcon /><input autoComplete="new-password" minLength="6" name="confirmPassword" onChange={updateDraft(setRegisterDraft)} placeholder="Xác nhận mật khẩu" required type="password" value={registerDraft.confirmPassword} /></label>
            <p className="auth-or">Hoặc đăng ký với:</p>
            <div className="auth-social-row">
              <button disabled={Boolean(busy)} onClick={() => startHostedLogin('google')} type="button"><GoogleIcon />Google</button>
              <button className="auth-aws-button" disabled={Boolean(busy)} onClick={() => startHostedLogin()} type="button"><AwsIcon />AWS</button>
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
        {(error || message) && <div className={`auth-feedback ${error ? 'is-error' : ''}`} role="status">{error || message}</div>}
      </section>

      {verificationOpen && (
        <div className="auth-modal-backdrop">
          <form className="auth-verify-modal" onSubmit={submitVerification}>
            <button className="auth-modal-close" onClick={() => { setPendingConfirmation(null); setPendingChallenge(null); setError(''); }} type="button" aria-label="Đóng">×</button>
            <span className="auth-modal-mark">✓</span>
            <h2>{verificationTitle}</h2>
            <p>{message || 'Hoàn tất bước bảo mật để tiếp tục.'}</p>
            <label>{verificationLabel}<input autoFocus minLength="4" onChange={(event) => setVerificationValue(event.target.value)} required type={pendingChallenge?.challenge === 'NEW_PASSWORD_REQUIRED' ? 'password' : 'text'} value={verificationValue} /></label>
            {error && <p className="auth-modal-error">{error}</p>}
            <button className="auth-primary" disabled={Boolean(busy)} type="submit">{busy === 'verify' ? 'Đang xác nhận...' : 'Xác nhận'}</button>
            {pendingConfirmation && <button className="auth-resend" disabled={Boolean(busy)} onClick={resendCode} type="button">Gửi lại mã</button>}
          </form>
        </div>
      )}
    </main>
  );
}

export default AuthPage;
