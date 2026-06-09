import { useState } from 'react';
import { movieApi } from '../../services/movieApi.js';

function MovieForm() {
  const [form, setForm] = useState({ name: '', description: '', year: '', isPublished: false });
  const [message, setMessage] = useState('');

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await movieApi.create({
      ...form,
      year: form.year ? Number(form.year) : null
    });
    setMessage('Đã lưu phim.');
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <input className="input" name="name" value={form.name} onChange={updateField} placeholder="Tên phim" />
      <input className="input" name="year" value={form.year} onChange={updateField} placeholder="Năm phát hành" />
      <textarea className="input" name="description" value={form.description} onChange={updateField} placeholder="Mô tả" />
      <label className="checkbox-row">
        <input name="isPublished" type="checkbox" checked={form.isPublished} onChange={updateField} />
        Hiển thị phim
      </label>
      <button className="button" type="submit">Lưu phim</button>
      {message && <p>{message}</p>}
    </form>
  );
}

export default MovieForm;
