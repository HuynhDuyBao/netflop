import { useEffect, useState } from 'react';
import { uploadApi } from '../../services/uploadApi.js';

function UploadVideo({ defaultMovieId = '', lockMovieId = false, onUploaded }) {
  const [movieId, setMovieId] = useState(defaultMovieId ? String(defaultMovieId) : '');
  const [episodeName, setEpisodeName] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (defaultMovieId) {
      setMovieId(String(defaultMovieId));
    }
  }, [defaultMovieId]);

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
    setResult(null);

    try {
      const response = await uploadApi.uploadVideo(formData);
      setResult(response.data?.data || null);
      setMessage('Da upload video va gui MediaConvert xu ly HLS.');
      if (!lockMovieId) {
        setMovieId('');
      }
      setEpisodeName('');
      setFile(null);
      onUploaded?.(response.data?.data);
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || 'Upload video that bai.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="admin-form-grid" onSubmit={handleUpload}>
      <input className="input" value={movieId} onChange={(event) => setMovieId(event.target.value)} placeholder="ID phim" disabled={lockMovieId} />
      <input className="input" value={episodeName} onChange={(event) => setEpisodeName(event.target.value)} placeholder="Tên tập" />
      <input className="input" type="file" accept="video/*,.mp4,.mkv,.mov,.avi,.webm,.m4v" onChange={(event) => setFile(event.target.files?.[0] || null)} />
      <button className="button primary" type="submit" disabled={!file || uploading}>{uploading ? 'Đang upload...' : 'Tải video'}</button>
      {message && <p className="admin-message">{message}</p>}
      {error && <p className="form-error">{error}</p>}
      {result && (
        <div className="admin-message">
          <p>Episode #{result.episode?.MaTap} - {result.episode?.upload_status || 'processing'}</p>
          <p>MediaConvert job: {result.mediaConvert?.jobId || '-'}</p>
          <p>Playback URL: {result.cloudFrontUrl || result.hlsUrl || '-'}</p>
        </div>
      )}
    </form>
  );
}

export default UploadVideo;
