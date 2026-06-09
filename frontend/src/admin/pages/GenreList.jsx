import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi.js';

function GenreList() {
  const [genres, setGenres] = useState([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadGenres() {
    try {
      const response = await adminApi.genres();
      setGenres(response.data.data || []);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không tải được thể loại.');
    }
  }

  useEffect(() => {
    loadGenres();
  }, []);

  async function saveGenre(event) {
    event.preventDefault();
    if (!name.trim()) return;
    setMessage('');
    setError('');

    try {
      setSaving(true);
      if (editing) {
        await adminApi.updateGenre(editing.MaTheLoai, name);
        setMessage('Đã cập nhật thể loại.');
      } else {
        await adminApi.createGenre(name);
        setMessage('Đã thêm thể loại.');
      }

      setName('');
      setEditing(null);
      loadGenres();
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Không lưu được thể loại.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteGenre(id) {
    if (!window.confirm('Xóa thể loại này?')) return;
    await adminApi.deleteGenre(id);
    loadGenres();
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Danh mục</p>
          <h1>Quản lý thể loại</h1>
        </div>
      </div>
      <form className="admin-card admin-toolbar" onSubmit={saveGenre}>
        <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên thể loại" />
        <button className="button primary" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm'}</button>
        {editing && <button className="button secondary" type="button" onClick={() => { setEditing(null); setName(''); }}>Hủy</button>}
      </form>
      {message && <p className="admin-message">{message}</p>}
      {error && <p className="form-error">{error}</p>}
      <div className="admin-list">
        {genres.map((genre) => (
          <div className="admin-row" key={genre.MaTheLoai}>
            <span>{genre.TenTheLoai}</span>
            <span className="row-actions">
              <button type="button" onClick={() => { setEditing(genre); setName(genre.TenTheLoai); }}>Sửa</button>
              <button type="button" onClick={() => deleteGenre(genre.MaTheLoai)}>Xóa</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default GenreList;
