import { useState } from 'react';
import FileUrlInput from '../../components/FileUrlInput.jsx';
import { uploadApi } from '../../services/uploadApi.js';

async function uploadMediaFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', 'video');
  const response = await uploadApi.uploadMedia(formData);
  return response.data.data.url;
}

function EpisodeForm() {
  const [form, setForm] = useState({ name: '', videoUrl: '' });

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <form className="admin-form">
      <input className="input" name="name" value={form.name} onChange={updateField} placeholder="Tên tập" />
      <FileUrlInput label="Video URL" name="videoUrl" value={form.videoUrl} onChange={updateField} onUpload={uploadMediaFile} accept="video/*" placeholder="Dán URL video hoặc chọn tệp" />
      <button className="button" type="button">Lưu tập phim</button>
    </form>
  );
}

export default EpisodeForm;
