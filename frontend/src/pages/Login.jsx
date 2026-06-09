import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const user = await login(form);
      navigate(user.vai_tro === 'admin' ? '/admin' : '/', { replace: true });
    } catch (loginError) {
      setError(loginError.response?.data?.message || 'Đăng nhập thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page auth-page">
      <h1>Đăng nhập</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input className="input" name="identifier" value={form.identifier} onChange={updateField} placeholder="Tên đăng nhập hoặc email" />
        <input className="input" name="password" value={form.password} onChange={updateField} type="password" placeholder="Mật khẩu" />
        {error && <p className="form-error">{error}</p>}
        <button className="button primary" type="submit" disabled={submitting}>
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      <p className="auth-switch">Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
    </main>
  );
}

export default Login;
