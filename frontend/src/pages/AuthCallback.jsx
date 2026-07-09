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
      const expectedState = sessionStorage.getItem('cognitoOAuthState');
      const returnTo = sessionStorage.getItem('cognitoReturnTo') || '/';
      sessionStorage.removeItem('cognitoOAuthState');
      sessionStorage.removeItem('cognitoReturnTo');

      if (oauthError) {
        setError(`Cognito: ${oauthError}`);
        return;
      }
      if (!code || !state || state !== expectedState) {
        setError('Phiên social login không hợp lệ hoặc đã hết hạn.');
        return;
      }
      try {
        const response = await authApi.socialCallback({ code });
        const user = acceptSession(response.data.data);
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
