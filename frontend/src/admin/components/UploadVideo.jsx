import { useState } from 'react';
import { uploadApi } from '../../services/uploadApi.js';

function UploadVideo() {
  const [movieId, setMovieId] = useState('');
  const [episodeName, setEpisodeName] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  async function handleUpload(event) {
    event.preventDefault();
    if (!movieId || !episodeName || !file) return;

    const formData = new FormData();
    formData.append('movieId', movieId);
    formData.append('episodeName', episodeName);
    formData.append('video', file);

    setUploading(true);
    setMessage('');
    setError('');

    try {
      await uploadApi.uploadVideo(formData);
      setMessage('Đã upload video và gửi xử lý HLS.');
      setMovieId('');
      setEpisodeName('');
      setFile(null);
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || 'Upload video thất bại.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="admin-form-grid" onSubmit={handleUpload}>
      <input className="input" value={movieId} onChange={(event) => setMovieId(event.target.value)} placeholder="ID phim" />
      <input className="input" value={episodeName} onChange={(event) => setEpisodeName(event.target.value)} placeholder="Tên tập" />
      <input className="input" type="file" accept="video/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
      <button className="button primary" type="submit" disabled={!file || uploading}>{uploading ? 'Đang upload...' : 'Tải video'}</button>
      {message && <p className="admin-message">{message}</p>}
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}

export default UploadVideo;
