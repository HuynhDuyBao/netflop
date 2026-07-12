import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/authApi.js';

export const AuthContext = createContext({
  loading: true,
  user: null,
  error: '',
  login: async () => {},
  logout: () => {},
  register: async () => {},
  setUser: () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCurrentUser() {
      if (sessionStorage.getItem('cognitoLogoutPending') === '1') {
        localStorage.removeItem('accessToken');
        setUser(null);
        setLoading(false);
        sessionStorage.removeItem('cognitoLogoutPending');
        return;
      }
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.me();
        setUser(response.data.data);
      } catch (loadError) {
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  async function login(payload) {
    setError('');
    const response = await authApi.login(payload);
    const result = response.data.data;
    if (result.challenge) return result;
    const { token, user: loggedInUser } = result;
    localStorage.setItem('accessToken', token);
    localStorage.setItem('authProvider', 'cognito');
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function register(payload) {
    setError('');
    const response = await authApi.register(payload);
    return response.data.data;
  }

  async function completeChallenge(payload) {
    const response = await authApi.challenge(payload);
    const result = response.data.data;
    if (result.challenge) return result;
    localStorage.setItem('accessToken', result.token);
    localStorage.setItem('authProvider', 'cognito');
    setUser(result.user);
    return result;
  }

  const acceptSession = useCallback((result, provider = 'cognito') => {
    sessionStorage.removeItem('cognitoLogoutPending');
    localStorage.setItem('accessToken', result.token);
    localStorage.setItem('authProvider', provider);
    setUser(result.user);
    return result.user;
  }, []);

  async function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authProvider');
    sessionStorage.removeItem('oauthState');
    sessionStorage.removeItem('oauthReturnTo');
    sessionStorage.removeItem('oauthProvider');
    sessionStorage.removeItem('cognitoOAuthState');
    sessionStorage.removeItem('cognitoReturnTo');
    setUser(null);
    window.location.replace('/');
  }

  const value = useMemo(
    () => ({ acceptSession, completeChallenge, loading, user, error, login, logout, register, setError, setUser }),
    [acceptSession, loading, user, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
