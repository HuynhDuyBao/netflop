import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { authApi } from '../services/authApi.js';

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { acceptSession } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    async function completeLogin() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const oauthError = searchParams.get('error_description') || searchParams.get('error');
      const provider = sessionStorage.getItem('oauthProvider') || 'cognito';
      const providerLabel = provider === 'google' ? 'Google' : 'Cognito';
      const expectedState = sessionStorage.getItem('oauthState') || sessionStorage.getItem('cognitoOAuthState');
      const returnTo = sessionStorage.getItem('oauthReturnTo') || sessionStorage.getItem('cognitoReturnTo') || '/';
      sessionStorage.removeItem('oauthState');
      sessionStorage.removeItem('oauthReturnTo');
      sessionStorage.removeItem('oauthProvider');
      sessionStorage.removeItem('cognitoOAuthState');
      sessionStorage.removeItem('cognitoReturnTo');

      if (oauthError) {
        setError(`${providerLabel}: ${oauthError}`);
        return;
      }
      if (!code || !state || state !== expectedState) {
        setError('Phiên social login không hợp lệ hoặc đã hết hạn.');
        return;
      }
      try {
        const response = provider === 'google'
          ? await authApi.googleCallback({ code })
          : await authApi.socialCallback({ code });
        const user = acceptSession(response.data.data, provider === 'google' ? 'google' : 'cognito');
        navigate(user.vai_tro === 'admin' ? '/admin' : returnTo, { replace: true });
      } catch (callbackError) {
        setError(callbackError.response?.data?.message || 'Không thể hoàn tất social login.');
      }
    }
    completeLogin();
  }, [acceptSession, navigate, searchParams]);

  return (
    <main className="page auth-page">
      <h1>Đang xác thực</h1>
      {error ? <p className="form-error">{error}</p> : <p>Vui lòng chờ trong giây lát...</p>}
      {error && <button className="button primary" onClick={() => navigate('/login')}>Quay lại đăng nhập</button>}
    </main>
  );
}

export default AuthCallback;
