import { useEffect, useState } from 'react';
import FileUrlInput from '../../components/FileUrlInput.jsx';
import { episodeApi } from '../../services/episodeApi.js';
import { uploadApi } from '../../services/uploadApi.js';
import UploadVideo from '../components/UploadVideo.jsx';

const emptyForm = {
  movieId: '',
  title: '',
  sourceUrl: '',
  hlsUrl: '',
  cloudFrontUrl: '',
  thumbnailUrl: '',
  uploadStatus: 'ready',
  duration: ''
};

const emptySubtitle = {
  languageCode: 'vi',
  languageName: 'Tiếng Việt',
  format: 'vtt',
  url: '',
  isDefault: true
};

async function uploadMediaFile(file, category) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  const response = await uploadApi.uploadMedia(formData);
  return response.data.data.url;
}

function EpisodeList() {
  const [episodes, setEpisodes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [subtitleForm, setSubtitleForm] = useState(emptySubtitle);

  async function loadEpisodes() {
    try {
      const response = await episodeApi.list();
      setEpisodes(response.data.data || []);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không tải được tập phim.');
    }
  }

  useEffect(() => {
    loadEpisodes();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateSubtitleField(event) {
    const { name, value, type, checked } = event.target;
    setSubtitleForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function editEpisode(episode) {
    setEditingId(episode.MaTap);
    setForm({
      movieId: String(episode.MaPhim || ''),
      title: episode.TenTap || '',
      sourceUrl: episode.Link || '',
      hlsUrl: episode.hls_url || '',
      cloudFrontUrl: episode.cloudfront_url || '',
      thumbnailUrl: episode.thumbnail_url || '',
      uploadStatus: episode.upload_status || 'ready',
      duration: episode.duration || ''
    });
  }

  async function saveEpisode(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    const payload = {
      ...form,
      movieId: Number(form.movieId),
      duration: form.duration ? Number(form.duration) : null
    };

    try {
      setSaving(true);
      if (editingId) {
        await episodeApi.update(editingId, payload);
        setMessage('Đã cập nhật tập phim.');
      } else {
        await episodeApi.create(payload);
        setMessage('Đã tạo tập phim.');
      }

      setForm(emptyForm);
      setEditingId(null);
      loadEpisodes();
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Không lưu được tập phim.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteEpisode(id) {
    if (!window.confirm('Xóa tập phim này?')) return;
    setBusyId(id);
    try {
      await episodeApi.remove(id);
      loadEpisodes();
    } finally {
      setBusyId(null);
    }
  }

  async function syncEpisode(id) {
    setBusyId(id);
    setMessage('');
    setError('');
    try {
      const response = await uploadApi.syncVideoStatus(id);
      const status = response.data?.data?.mediaConvert?.status || 'UNKNOWN';
      setMessage(`Da dong bo MediaConvert: ${status}.`);
      await loadEpisodes();
    } catch (syncError) {
      setError(syncError.response?.data?.message || 'Khong dong bo duoc MediaConvert.');
    } finally {
      setBusyId(null);
    }
  }

  async function addSubtitle(event) {
    event.preventDefault();
    if (!editingId) return;
    try {
      setSaving(true);
      await episodeApi.addSubtitle(editingId, subtitleForm);
      setSubtitleForm(emptySubtitle);
      await loadEpisodes();
      setMessage('Đã thêm phụ đề cho tập phim.');
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Không thêm được phụ đề.');
    } finally {
      setSaving(false);
    }
  }

  const editingEpisode = episodes.find((episode) => Number(episode.MaTap) === Number(editingId));

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Video</p>
          <h1>Quản lý tập phim</h1>
        </div>
      </div>

      <section className="admin-card">
        <h2>Upload tập phim lên AWS</h2>
        <UploadVideo onUploaded={() => loadEpisodes()} />
      </section>

      <form className="admin-card admin-form-grid episode-form-grid" onSubmit={saveEpisode}>
        <input className="input" name="movieId" value={form.movieId} onChange={updateField} placeholder="ID phim" />
        <input className="input" name="title" value={form.title} onChange={updateField} placeholder="Tên tập" />
        <label>Video URL<input className="input" name="sourceUrl" value={form.sourceUrl} onChange={updateField} placeholder="Nguồn gốc hoặc URL thủ công" /></label>
        <label>HLS URL<input className="input" name="hlsUrl" value={form.hlsUrl} onChange={updateField} placeholder="AWS output index.m3u8" /></label>
        <label>CloudFront URL<input className="input" name="cloudFrontUrl" value={form.cloudFrontUrl} onChange={updateField} placeholder="CloudFront index.m3u8" /></label>
        <FileUrlInput
          label="Banner tập"
          name="thumbnailUrl"
          value={form.thumbnailUrl}
          onChange={updateField}
          onUpload={(file) => uploadMediaFile(file, 'episode-banner')}
          accept="image/*"
          placeholder="Dán URL banner hoặc chọn ảnh"
        />
        {form.thumbnailUrl && <img className="episode-banner-preview" src={form.thumbnailUrl} alt="" />}
        <input className="input" name="duration" value={form.duration} onChange={updateField} placeholder="Thời lượng giây" />
        <select className="input" name="uploadStatus" value={form.uploadStatus} onChange={updateField}>
          <option value="ready">Sẵn sàng</option>
          <option value="pending">Chờ xử lý</option>
          <option value="processing">Đang xử lý</option>
          <option value="failed">Thất bại</option>
        </select>
        <div className="admin-actions">
          <button className="button primary" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm tập'}</button>
          {editingId && <button className="button secondary" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Hủy</button>}
        </div>
      </form>

      {editingEpisode && (
        <section className="episode-assets-grid subtitles-only">
          <form className="admin-card episode-asset-card" onSubmit={addSubtitle}>
            <header>
              <div><p className="admin-kicker">CC</p><h2>Phụ đề</h2></div>
              <span>{editingEpisode.subtitles?.length || 0} track</span>
            </header>
            <div className="episode-asset-fields">
              <input className="input" name="languageCode" value={subtitleForm.languageCode} onChange={updateSubtitleField} placeholder="Mã: vi" />
              <input className="input" name="languageName" value={subtitleForm.languageName} onChange={updateSubtitleField} placeholder="Tên ngôn ngữ" />
              <select className="input" name="format" value={subtitleForm.format} onChange={updateSubtitleField}>
                <option value="vtt">WebVTT (.vtt)</option>
              </select>
            </div>
            <FileUrlInput
              label="File phụ đề"
              name="url"
              value={subtitleForm.url}
              onChange={updateSubtitleField}
              onUpload={(file) => uploadMediaFile(file, 'subtitle')}
              accept=".vtt,text/vtt"
              placeholder="URL file .vtt"
            />
            <label className="episode-default-check">
              <input type="checkbox" name="isDefault" checked={subtitleForm.isDefault} onChange={updateSubtitleField} />
              Phụ đề mặc định
            </label>
            <button className="button primary" type="submit" disabled={saving || !subtitleForm.url}>Thêm phụ đề</button>
            <div className="episode-asset-list">
              {(editingEpisode.subtitles || []).map((subtitle) => (
                <div key={subtitle.MaPhuDe}>
                  <span><strong>{subtitle.TenNgonNgu}</strong><small>{subtitle.DinhDang.toUpperCase()}{subtitle.MacDinh ? ' · Mặc định' : ''}</small></span>
                  <button type="button" onClick={async () => { await episodeApi.removeSubtitle(editingId, subtitle.MaPhuDe); loadEpisodes(); }}>Xóa</button>
                </div>
              ))}
            </div>
          </form>
        </section>
      )}

      {message && <p className="admin-message">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="admin-table">
        <div className="admin-table-head episode-grid-admin">
          <span>ID</span><span>Banner</span><span>Phim</span><span>Tập</span><span>Nguồn phát</span><span>Trạng thái</span><span></span>
        </div>
        {episodes.map((episode) => (
          <div className="admin-table-row episode-grid-admin" key={episode.MaTap}>
            <span>{episode.MaTap}</span>
            <span>
              {episode.thumbnail_url ? (
                <img className="episode-banner-thumb" src={episode.thumbnail_url} alt="" />
              ) : (
                <i className="episode-banner-empty">N/A</i>
              )}
            </span>
            <span>{episode.TenPhim || `#${episode.MaPhim}`}</span>
            <span>{episode.TenTap}</span>
            <span>{episode.cloudfront_url || episode.hls_url || episode.Link || '-'}</span>
            <span>{episode.upload_status || '-'}</span>
            <span className="row-actions">
              {episode.media_convert_job_id && (
                <button type="button" onClick={() => syncEpisode(episode.MaTap)} disabled={busyId === episode.MaTap}>Sync</button>
              )}
              <button type="button" onClick={() => editEpisode(episode)}>Sửa</button>
              <button type="button" onClick={() => deleteEpisode(episode.MaTap)} disabled={busyId === episode.MaTap}>Xóa</button>
            </span>
          </div>
        ))}
        {episodes.length === 0 && <p className="admin-empty-state">Chưa có tập phim.</p>}
      </div>
    </section>
  );
}

export default EpisodeList;
