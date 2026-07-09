import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { authApi } from '../services/authApi.js';

function CognitoRedirect({ screen = 'login' }) {
  const location = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    async function redirectToCognito() {
      try {
        const state = crypto.randomUUID();
        sessionStorage.setItem('cognitoOAuthState', state);
        sessionStorage.setItem('cognitoReturnTo', location.state?.from || '/');
        const response = await authApi.hostedUrl({ screen, state });
        window.location.replace(response.data.data.url);
      } catch (redirectError) {
        setError(redirectError.response?.data?.message || 'Không thể mở trang Amazon Cognito.');
      }
    }
    redirectToCognito();
  }, [location.state, screen]);

  return (
    <main className="page auth-page">
      <h1>Đang chuyển tới Cognito</h1>
      {error ? <p className="form-error">{error}</p> : <p>Vui lòng chờ trong giây lát...</p>}
    </main>
  );
}

export default CognitoRedirect;
