import React from "react";
import { CloudUpload, Plus, RefreshCw, Rocket, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, getStoredUser } from "../api.js";

const emptyMovie = {
  TenPhim: "",
  TieuDe: "",
  MoTa: "",
  NoiDung: "",
  ThoiLuong: "",
  NamPhatHanh: "",
  TinhTrang: "Đang chiếu",
  PhanLoai: "Lẻ",
  HinhAnh: "",
  HinhAnhBanner: ""
};

export default function AdminMovies() {
  const user = getStoredUser();
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState(emptyMovie);
  const [selected, setSelected] = useState(null);
  const [episodeName, setEpisodeName] = useState("Tập 1");
  const [episodesByMovie, setEpisodesByMovie] = useState({});
  const [message, setMessage] = useState("");

  async function load() {
    const res = await api.get("/admin/movies");
    setMovies(res.data);
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (!user) return <Navigate to="/admin/login" replace />;

  async function saveMovie(event) {
    event.preventDefault();
    if (selected) {
      await api.put(`/admin/movies/${selected.MaPhim}`, form);
      setMessage("Đã cập nhật phim.");
    } else {
      await api.post("/admin/movies", form);
      setMessage("Đã tạo phim mới.");
    }
    setForm(emptyMovie);
    setSelected(null);
    await load();
  }

  function editMovie(movie) {
    setSelected(movie);
    setForm({ ...emptyMovie, ...movie });
  }

  async function removeMovie(id) {
    if (!confirm("Xóa phim này?")) return;
    await api.delete(`/admin/movies/${id}`);
    await load();
  }

  async function publishMovie(id, isPublished) {
    await api.post(`/admin/movies/${id}/publish`, { isPublished });
    await load();
  }

  async function addEpisode(movieId) {
    await api.post(`/admin/movies/${movieId}/episodes`, { TenTap: episodeName });
    setMessage("Đã thêm tập. Mở chi tiết phim ngoài trang user để xem danh sách tập.");
    await loadEpisodes(movieId);
  }

  async function loadEpisodes(movieId) {
    const res = await api.get(`/admin/movies/${movieId}/episodes`);
    setEpisodesByMovie((current) => ({ ...current, [movieId]: res.data }));
  }

  async function uploadEpisode(event, episodeId) {
    const file = event.target.files?.[0];
    if (!file) return;
    const { data } = await api.post(`/admin/episodes/${episodeId}/presigned-upload`, {
      filename: file.name,
      contentType: file.type || "video/mp4",
      fileSizeBytes: file.size
    });

    await fetch(data.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "video/mp4" },
      body: file
    });
    await api.post(`/admin/episodes/${episodeId}/mark-uploaded`);
    setMessage(`Đã upload ${file.name} lên S3.`);
    await load();
  }

  async function convertEpisode(episodeId) {
    const res = await api.post(`/admin/episodes/${episodeId}/convert`);
    setMessage(`Đã submit MediaConvert job: ${res.data.jobId}`);
  }

  async function checkEpisode(episodeId) {
    const res = await api.get(`/admin/episodes/${episodeId}/job-status`);
    setMessage(`Job status: ${res.data.status} ${res.data.percent || 0}%`);
  }

  return (
    <section className="page admin-grid">
      <form className="panel movie-form" onSubmit={saveMovie}>
        <h1>{selected ? "Sửa phim" : "Thêm phim"}</h1>
        <input placeholder="Tên phim" value={form.TenPhim || ""} onChange={(e) => setForm({ ...form, TenPhim: e.target.value })} required />
        <input placeholder="Tiêu đề" value={form.TieuDe || ""} onChange={(e) => setForm({ ...form, TieuDe: e.target.value })} />
        <textarea placeholder="Mô tả" value={form.MoTa || ""} onChange={(e) => setForm({ ...form, MoTa: e.target.value })} />
        <div className="two-col">
          <input placeholder="Năm" value={form.NamPhatHanh || ""} onChange={(e) => setForm({ ...form, NamPhatHanh: e.target.value })} />
          <input placeholder="Thời lượng phút" value={form.ThoiLuong || ""} onChange={(e) => setForm({ ...form, ThoiLuong: e.target.value })} />
        </div>
        <input placeholder="Poster URL" value={form.HinhAnh || ""} onChange={(e) => setForm({ ...form, HinhAnh: e.target.value })} />
        <input placeholder="Banner URL" value={form.HinhAnhBanner || ""} onChange={(e) => setForm({ ...form, HinhAnhBanner: e.target.value })} />
        <div className="two-col">
          <select value={form.PhanLoai || "Lẻ"} onChange={(e) => setForm({ ...form, PhanLoai: e.target.value })}>
            <option>Lẻ</option>
            <option>Bộ</option>
          </select>
          <select value={form.TinhTrang || "Đang chiếu"} onChange={(e) => setForm({ ...form, TinhTrang: e.target.value })}>
            <option>Đang chiếu</option>
            <option>Sắp chiếu</option>
            <option>Đã kết thúc</option>
          </select>
        </div>
        <button className="primary-btn">
          <Save size={17} />
          {selected ? "Lưu thay đổi" : "Tạo phim"}
        </button>
        {selected && <button type="button" className="ghost-btn" onClick={() => { setSelected(null); setForm(emptyMovie); }}>Hủy sửa</button>}
        {message && <p className="success-text">{message}</p>}
      </form>

      <div className="panel">
        <div className="admin-head compact">
          <h1>Danh sách phim</h1>
          <button className="ghost-btn" onClick={load}><RefreshCw size={16} /> Tải lại</button>
        </div>
        <div className="episode-create">
          <input value={episodeName} onChange={(e) => setEpisodeName(e.target.value)} />
        </div>
        <div className="admin-list">
          {movies.map((movie) => (
            <div className="admin-movie" key={movie.MaPhim}>
              <img src={movie.HinhAnh || "https://placehold.co/120x170/101820/e8f0ff?text=NF"} alt={movie.TenPhim} />
              <div>
                <h3>{movie.TenPhim}</h3>
                <p>{movie.episode_count} tập · {movie.aws_status || "draft"} · {movie.is_published ? "published" : "draft"}</p>
                <div className="button-row">
                  <button onClick={() => editMovie(movie)}><Save size={15} /> Sửa</button>
                  <button onClick={() => addEpisode(movie.MaPhim)}><Plus size={15} /> Thêm tập</button>
                  <button onClick={() => loadEpisodes(movie.MaPhim)}><RefreshCw size={15} /> Tập</button>
                  <button onClick={() => publishMovie(movie.MaPhim, !movie.is_published)}><Rocket size={15} /> {movie.is_published ? "Ẩn" : "Publish"}</button>
                  <button className="danger" onClick={() => removeMovie(movie.MaPhim)}><Trash2 size={15} /> Xóa</button>
                </div>
                {(episodesByMovie[movie.MaPhim] || []).map((episode) => (
                  <EpisodeTools
                    key={episode.MaTap}
                    episode={episode}
                    onUpload={uploadEpisode}
                    onConvert={convertEpisode}
                    onCheck={checkEpisode}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EpisodeTools({ episode, onUpload, onConvert, onCheck }) {
  return (
    <div className="episode-tools">
      <span className="episode-chip">#{episode.MaTap} · {episode.TenTap || "Tập phim"} · {episode.upload_status}</span>
      <label className="file-btn">
        <CloudUpload size={15} />
        Upload MP4
        <input type="file" accept="video/mp4" onChange={(e) => onUpload(e, episode.MaTap)} />
      </label>
      <button onClick={() => onConvert(episode.MaTap)}>Convert HLS</button>
      <button onClick={() => onCheck(episode.MaTap)}>Check job</button>
    </div>
  );
}
