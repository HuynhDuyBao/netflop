import { createContext, useEffect, useMemo, useState } from 'react';
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
    const { token, user: loggedInUser } = response.data.data;
    localStorage.setItem('accessToken', token);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function register(payload) {
    setError('');
    const response = await authApi.register(payload);
    const { token, user: registeredUser } = response.data.data;
    localStorage.setItem('accessToken', token);
    setUser(registeredUser);
    return registeredUser;
  }

  function logout() {
    localStorage.removeItem('accessToken');
    setUser(null);
  }

  const value = useMemo(
    () => ({ loading, user, error, login, logout, register, setError, setUser }),
    [loading, user, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
