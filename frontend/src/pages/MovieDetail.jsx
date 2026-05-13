import React from "react";
import { Play, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    api.get(`/movies/${id}`).then((res) => setMovie(res.data));
  }, [id]);

  if (!movie) return <section className="page"><p className="muted">Đang tải chi tiết...</p></section>;

  return (
    <section className="page">
      <div className="detail-hero" style={{ backgroundImage: `linear-gradient(90deg, #071014 0%, rgba(7,16,20,.82) 45%, rgba(7,16,20,.18)), url(${movie.HinhAnhBanner || movie.HinhAnh || ""})` }}>
        <div>
          <p className="eyebrow">{movie.PhanLoai} · {movie.NamPhatHanh || "N/A"}</p>
          <h1>{movie.TenPhim}</h1>
          <p>{movie.MoTa || movie.TieuDe || "Chưa có mô tả."}</p>
          <div className="meta-row">
            <span><Star size={17} /> {movie.DanhGia || 0}</span>
            <span>{movie.TenQuocGia || "Đang cập nhật"}</span>
          </div>
        </div>
      </div>

      <h2 className="section-title">Tập phim</h2>
      <div className="episode-list">
        {(movie.episodes || []).map((episode) => (
          <Link className="episode-item" to={`/watch/${movie.MaPhim}/${episode.MaTap}`} key={episode.MaTap}>
            <Play size={18} />
            <span>{episode.TenTap || `Tập ${episode.MaTap}`}</span>
            <small>{episode.upload_status || "ready"}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
