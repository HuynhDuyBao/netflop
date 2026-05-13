import React from "react";
import { Film, Gauge, LogOut, Shield } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { clearSession, getStoredUser } from "../api.js";

export default function AppLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();

  function logout() {
    clearSession();
    navigate("/");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <Film size={24} />
          <span>Netflop</span>
        </Link>
        <nav className="nav">
          <Link to="/">Phim</Link>
          <Link to="/admin">
            <Gauge size={17} />
            Admin
          </Link>
          {user ? (
            <button className="icon-text" onClick={logout} title="Đăng xuất">
              <LogOut size={17} />
              {user.username}
            </button>
          ) : (
            <Link to="/admin/login">
              <Shield size={17} />
              Đăng nhập
            </Link>
          )}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
