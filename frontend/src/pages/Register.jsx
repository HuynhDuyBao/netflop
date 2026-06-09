import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', fullName: '', password: '' });
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
      await register(form);
      navigate('/', { replace: true });
    } catch (registerError) {
      setError(registerError.response?.data?.message || 'Đăng ký thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page auth-page">
      <h1>Đăng ký</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input className="input" name="username" value={form.username} onChange={updateField} placeholder="Tên đăng nhập" />
        <input className="input" name="email" value={form.email} onChange={updateField} placeholder="Email" />
        <input className="input" name="fullName" value={form.fullName} onChange={updateField} placeholder="Họ tên" />
        <input className="input" name="password" value={form.password} onChange={updateField} type="password" placeholder="Mật khẩu" />
        {error && <p className="form-error">{error}</p>}
        <button className="button primary" type="submit" disabled={submitting}>
          {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
        </button>
      </form>
      <p className="auth-switch">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </main>
  );
}

export default Register;
