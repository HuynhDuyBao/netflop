import React from "react";
import { PlayCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function MovieList() {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/movies")
      .then((res) => setMovies(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return movies.filter((movie) =>
      `${movie.TenPhim} ${movie.TieuDe || ""}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [movies, query]);

  return (
    <section className="page">
      <div className="hero">
        <div>
          <p className="eyebrow">React + Node.js + AWS HLS</p>
          <h1>Netflop</h1>
          <p>Website xem phim có quản trị nội dung, upload S3, MediaConvert và adaptive bitrate.</p>
        </div>
        <div className="searchbox">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm phim..." />
        </div>
      </div>

      {loading ? (
        <p className="muted">Đang tải phim...</p>
      ) : (
        <div className="movie-grid">
          {filtered.map((movie) => (
            <Link to={`/movies/${movie.MaPhim}`} className="movie-card" key={movie.MaPhim}>
              <img src={movie.HinhAnh || "https://placehold.co/360x520/101820/e8f0ff?text=Netflop"} alt={movie.TenPhim} />
              <div>
                <h3>{movie.TenPhim}</h3>
                <p>{movie.NamPhatHanh || "N/A"} · {movie.PhanLoai}</p>
                <span>
                  <PlayCircle size={16} />
                  Xem chi tiết
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
