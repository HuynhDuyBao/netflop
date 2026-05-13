import React from "react";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, saveSession } from "../api.js";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", form);
      if (!["admin", "moderator"].includes(res.data.user.role)) {
        setError("Tài khoản này không có quyền admin.");
        return;
      }
      saveSession(res.data);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại.");
    }
  }

  return (
    <section className="auth-page">
      <form className="panel" onSubmit={submit}>
        <h1>Admin Login</h1>
        <label>
          Tên đăng nhập hoặc email
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </label>
        <label>
          Mật khẩu
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="primary-btn">
          <LogIn size={18} />
          Đăng nhập
        </button>
      </form>
    </section>
  );
}
