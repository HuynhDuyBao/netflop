import React from "react";
import { AlertTriangle, Eye, Film, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api, getStoredUser } from "../api.js";

export default function AdminDashboard() {
  const user = getStoredUser();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user) api.get("/admin/dashboard").then((res) => setData(res.data));
  }, [user]);

  if (!user) return <Navigate to="/admin/login" replace />;

  const totals = data?.totals || {};

  return (
    <section className="page">
      <div className="admin-head">
        <div>
          <p className="eyebrow">Cloud monitoring demo</p>
          <h1>Admin Dashboard</h1>
        </div>
        <Link className="primary-link" to="/admin/movies">Quản lý phim</Link>
      </div>

      <div className="stats-grid">
        <Stat icon={<Film />} label="Phim" value={totals.movie_count || 0} />
        <Stat icon={<Eye />} label="Lượt xem" value={totals.view_count || 0} />
        <Stat icon={<Loader />} label="Đang convert" value={totals.processing_episodes || 0} />
        <Stat icon={<AlertTriangle />} label="Job lỗi" value={totals.failed_jobs || 0} />
      </div>

      <div className="panel">
        <h2>Top phim theo lượt xem</h2>
        <table>
          <thead>
            <tr><th>Phim</th><th>Lượt xem</th><th>Giây xem</th></tr>
          </thead>
          <tbody>
            {(data?.topMovies || []).map((movie) => (
              <tr key={movie.MaPhim}>
                <td>{movie.TenPhim}</td>
                <td>{movie.views}</td>
                <td>{movie.watch_seconds}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat-card">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
