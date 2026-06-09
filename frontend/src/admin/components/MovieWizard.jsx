import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FileUrlInput from '../../components/FileUrlInput.jsx';
import { adminApi } from '../../services/adminApi.js';
import { episodeApi } from '../../services/episodeApi.js';
import { tmdbApi } from '../../services/tmdbApi.js';
import { uploadApi } from '../../services/uploadApi.js';

const statusOptions = [
  { value: 'Äang chiáº¿u', label: 'Đang chiếu' },
  { value: 'Sáº¯p chiáº¿u', label: 'Sắp chiếu' },
  { value: 'ÄÃ£ káº¿t thÃºc', label: 'Đã kết thúc' },
  { value: 'Táº¡m dá»«ng', label: 'Tạm dừng' },
  { value: 'ÄÃ£ há»§y', label: 'Đã hủy' }
];

const typeOptions = [
  { value: 'Láº»', label: 'Lẻ' },
  { value: 'Bá»™', label: 'Bộ' }
];

export const emptyMovieWizardForm = {
  tmdbId: null,
  tmdbType: 'movie',
  name: '',
  title: '',
  description: '',
  content: '',
  duration: '',
  year: '',
  rating: 0,
  views: 0,
  status: 'Äang chiáº¿u',
  type: 'Láº»',
  poster: '',
  banner: '',
  link: '',
  trailerKey: '',
  videoUrl: '',
  hlsMasterUrl: '',
  countryId: '',
  isPublished: false,
  genreIds: [],
  cast: [],
  directors: []
};

async function uploadMediaFile(file, category) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  const response = await uploadApi.uploadMedia(formData);
  return response.data.data.url;
}

function initials(name) {
  return String(name || 'N').trim().slice(0, 1).toUpperCase();
}

function normalizePayload(form) {
  return {
    ...form,
    duration: form.duration ? Number(form.duration) : null,
    year: form.year ? Number(form.year) : null,
    rating: Number(form.rating) || 0,
    views: Number(form.views) || 0,
    countryId: form.countryId ? Number(form.countryId) : null,
    cast: form.cast.filter((person) => person.name?.trim()),
    directors: form.directors.filter((person) => person.name?.trim())
  };
}

function WizardSteps({ activeStep, completedSteps, setActiveStep }) {
  const steps = ['Thông tin phim', 'Diễn viên', 'Đạo diễn', 'Video & Trailer', 'Hoàn tất'];

  return (
    <div className="movie-wizard-steps">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const completed = completedSteps.includes(stepNumber);
        return (
          <button
            className={`${activeStep === stepNumber ? 'active' : ''} ${completed ? 'done' : ''}`}
            key={step}
            type="button"
            onClick={() => setActiveStep(stepNumber)}
          >
            <span>{completed ? '✓' : stepNumber}</span>
            {step}
          </button>
        );
      })}
    </div>
  );
}

function PersonAvatar({ person }) {
  return person.profile ? <img src={person.profile} alt="" /> : <i>{initials(person.name)}</i>;
}

function MovieWizard({
  initialForm = emptyMovieWizardForm,
  isEditing = false,
  loading = false,
  movieId = null,
  onDelete,
  onSubmit,
  publicPath,
  title
}) {
  const [form, setForm] = useState(initialForm);
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);
  const [activeStep, setActiveStep] = useState(1);
  const [query, setQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [episodeRows, setEpisodeRows] = useState([]);
  const [activeVideoTab, setActiveVideoTab] = useState('episodes');
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(null);
  const [subtitleForm, setSubtitleForm] = useState({
    languageCode: 'vi',
    languageName: 'Tiếng Việt',
    format: 'vtt',
    url: '',
    isDefault: true
  });

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  useEffect(() => {
    Promise.all([adminApi.genres(), adminApi.countries()])
      .then(([genreResponse, countryResponse]) => {
        setGenres(genreResponse.data.data || []);
        setCountries(countryResponse.data.data || []);
      })
      .catch(() => {
        setGenres([]);
        setCountries([]);
      });
  }, []);

  useEffect(() => {
    if (!movieId) {
      setEpisodeRows([]);
      setSelectedEpisodeId(null);
      return;
    }

    episodeApi.list({ movieId })
      .then((response) => {
        const rows = response.data.data || [];
        setEpisodeRows(rows);
        setSelectedEpisodeId((current) => (
          rows.some((episode) => Number(episode.MaTap) === Number(current))
            ? current
            : rows[0]?.MaTap || null
        ));
      })
      .catch(() => setEpisodeRows([]));
  }, [movieId]);

  const completedSteps = useMemo(() => {
    const completed = [];
    if (form.name && form.description && form.poster) completed.push(1);
    if (form.cast.length > 0) completed.push(2);
    if (form.directors.length > 0) completed.push(3);
    if (form.link || form.videoUrl || form.hlsMasterUrl || episodeRows.length > 0) completed.push(4);
    if (form.name && form.genreIds.length > 0) completed.push(5);
    return completed;
  }, [episodeRows.length, form]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function updatePerson(collection, index, field, value) {
    setForm((current) => ({
      ...current,
      [collection]: current[collection].map((person, personIndex) => (
        personIndex === index ? { ...person, [field]: value } : person
      ))
    }));
  }

  function addPerson(collection) {
    setForm((current) => ({
      ...current,
      [collection]: [
        ...current[collection],
        collection === 'cast'
          ? { tmdbId: null, name: '', character: '', profile: '' }
          : { tmdbId: null, name: '', job: 'Đạo diễn', profile: '' }
      ]
    }));
  }

  function removePerson(collection, index) {
    setForm((current) => ({
      ...current,
      [collection]: current[collection].filter((_, personIndex) => personIndex !== index)
    }));
  }

  function toggleGenre(id) {
    setForm((current) => ({
      ...current,
      genreIds: current.genreIds.includes(id)
        ? current.genreIds.filter((genreId) => genreId !== id)
        : [...current.genreIds, id]
    }));
  }

  function matchGenres(tmdbGenres) {
    const names = tmdbGenres.map((genre) => String(genre.name || '').toLowerCase());
    return genres
      .filter((genre) => names.some((name) => genre.TenTheLoai.toLowerCase().includes(name) || name.includes(genre.TenTheLoai.toLowerCase())))
      .map((genre) => genre.MaTheLoai);
  }

  async function searchTmdb(event) {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    setMessage('');

    try {
      const response = await tmdbApi.search({ query, type: 'multi' });
      setTmdbResults((response.data.data || []).filter((movie) => movie.mediaType === 'movie' || movie.mediaType === 'tv'));
    } catch (searchError) {
      setError(searchError.response?.data?.message || 'Không tìm được phim từ TMDb.');
    } finally {
      setSearching(false);
    }
  }

  async function importMovie(movie) {
    setSearching(true);
    setError('');
    setMessage('');

    try {
      const response = await tmdbApi.importMovie({ tmdbId: movie.tmdbId, type: movie.mediaType || 'movie' });
      const detail = response.data.data;
      setForm((current) => ({
        ...current,
        tmdbId: detail.tmdbId || null,
        tmdbType: detail.mediaType || 'movie',
        name: detail.name || detail.title || '',
        title: detail.title || '',
        description: detail.description || '',
        content: detail.content || detail.description || '',
        duration: detail.duration || '',
        year: detail.year || '',
        rating: detail.rating || 0,
        status: detail.status || current.status,
        type: detail.type || current.type,
        poster: detail.poster || '',
        banner: detail.banner || '',
        link: detail.link || '',
        trailerKey: detail.trailerKey || '',
        genreIds: matchGenres(detail.genres || []),
        cast: detail.cast || [],
        directors: detail.directors || []
      }));
      setActiveStep(1);
      setMessage('Đã lấy thông tin phim từ TMDb.');
    } catch (importError) {
      setError(importError.response?.data?.message || 'Không lấy được chi tiết phim từ TMDb.');
    } finally {
      setSearching(false);
    }
  }

  function addEpisodeRow() {
    if (movieId) {
      episodeApi.create({
        movieId: Number(movieId),
        title: `Tập ${episodeRows.length + 1}`,
        sourceUrl: '',
        hlsUrl: '',
        cloudFrontUrl: '',
        uploadStatus: 'pending',
        duration: null
      }).then((response) => {
        const episode = response.data.data;
        setEpisodeRows((current) => [...current, { ...episode, subtitles: [] }]);
        setSelectedEpisodeId(episode.MaTap);
      }).catch((addError) => {
        setError(addError.response?.data?.message || 'Không thêm được tập phim.');
      });
      return;
    }

    setEpisodeRows((current) => [
      ...current,
      { title: `Tập ${current.length + 1}`, duration: '', status: 'Chờ xử lý' }
    ]);
  }

  async function reloadEpisodes(preferredEpisodeId = selectedEpisodeId) {
    if (!movieId) return;
    const response = await episodeApi.list({ movieId });
    const rows = response.data.data || [];
    setEpisodeRows(rows);
    setSelectedEpisodeId(rows.some((episode) => Number(episode.MaTap) === Number(preferredEpisodeId))
      ? preferredEpisodeId
      : rows[0]?.MaTap || null);
  }

  async function addWizardSubtitle() {
    if (!selectedEpisodeId || !subtitleForm.url) return;
    try {
      setSaving(true);
      await episodeApi.addSubtitle(selectedEpisodeId, subtitleForm);
      setSubtitleForm((current) => ({ ...current, url: '' }));
      await reloadEpisodes();
      setMessage('Đã thêm phụ đề cho tập phim.');
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Không thêm được phụ đề.');
    } finally {
      setSaving(false);
    }
  }

  async function saveMovie(publish = false) {
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên phim.');
      setActiveStep(1);
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await onSubmit(normalizePayload({ ...form, isPublished: publish ? true : form.isPublished }));
      setMessage(publish ? 'Đã xuất bản phim.' : isEditing ? 'Đã lưu thay đổi.' : 'Đã lưu phim.');
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Không lưu được phim.');
    } finally {
      setSaving(false);
    }
  }

  function renderStep() {
    if (activeStep === 1) {
      return (
        <div className="movie-wizard-grid info">
          <section className="wizard-panel">
            <h2>Thông tin cơ bản</h2>
            <div className="form-grid two">
              <label>Tên phim *<input className="input" name="name" value={form.name} onChange={updateField} /></label>
              <label>Tên gốc<input className="input" name="title" value={form.title} onChange={updateField} /></label>
            </div>
            <label>Slug (SEO)<input className="input" value={(form.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')} readOnly /></label>
            <label>Mô tả phim<textarea className="input" name="description" value={form.description} onChange={updateField} rows="5" maxLength="500" /></label>
            <div className="genre-pills">
              {genres.map((genre) => (
                <button className={form.genreIds.includes(genre.MaTheLoai) ? 'active' : ''} key={genre.MaTheLoai} type="button" onClick={() => toggleGenre(genre.MaTheLoai)}>{genre.TenTheLoai}</button>
              ))}
            </div>
            <div className="form-grid four">
              <label>Quốc gia<select className="input" name="countryId" value={form.countryId} onChange={updateField}><option value="">Chưa chọn</option>{countries.map((country) => <option key={country.MaQuocGia} value={country.MaQuocGia}>{country.TenQuocGia}</option>)}</select></label>
              <label>Năm phát hành<input className="input" name="year" value={form.year} onChange={updateField} /></label>
              <label>Thời lượng<input className="input" name="duration" value={form.duration} onChange={updateField} /></label>
              <label>Điểm<input className="input" name="rating" value={form.rating} onChange={updateField} /></label>
            </div>
            <div className="form-grid three">
              <label>Ngôn ngữ<input className="input" name="content" value={form.content} onChange={updateField} placeholder="Tiếng Nhật, Tiếng Việt..." /></label>
              <label>Phân loại<select className="input" name="type" value={form.type} onChange={updateField}>{typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label>Trạng thái<select className="input" name="status" value={form.status} onChange={updateField}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            </div>
          </section>
          <aside className="wizard-panel media-preview-panel">
            <h2>Hình ảnh</h2>
            <FileUrlInput label="Poster" name="poster" value={form.poster} onChange={updateField} onUpload={(file) => uploadMediaFile(file, 'poster')} accept="image/*" placeholder="Dán URL poster hoặc chọn tệp" />
            <div className="wizard-poster-preview">{form.poster ? <img src={form.poster} alt="" /> : <span>Poster</span>}</div>
            <FileUrlInput label="Banner" name="banner" value={form.banner} onChange={updateField} onUpload={(file) => uploadMediaFile(file, 'banner')} accept="image/*" placeholder="Dán URL banner hoặc chọn tệp" />
            <div className="wizard-banner-preview">{form.banner ? <img src={form.banner} alt="" /> : <span>Banner</span>}</div>
          </aside>
        </div>
      );
    }

    if (activeStep === 2) {
      return (
        <section className="wizard-panel">
          <div className="wizard-panel-heading">
            <h2>Chọn diễn viên cho phim</h2>
            <button className="button primary" type="button" onClick={() => addPerson('cast')}>+ Thêm diễn viên mới</button>
          </div>
          <div className="wizard-person-table">
            <div className="wizard-person-head"><span>Diễn viên</span><span>Vai diễn</span><span>Hình ảnh</span><span></span></div>
            {form.cast.map((person, index) => (
              <div className="wizard-person-row" key={`${person.tmdbId || 'cast'}-${index}`}>
                <div className="wizard-person-name"><PersonAvatar person={person} /><input className="input" value={person.name} onChange={(event) => updatePerson('cast', index, 'name', event.target.value)} placeholder="Tên diễn viên" /></div>
                <input className="input" value={person.character || ''} onChange={(event) => updatePerson('cast', index, 'character', event.target.value)} placeholder="Tên nhân vật" />
                <input className="input" value={person.profile || ''} onChange={(event) => updatePerson('cast', index, 'profile', event.target.value)} placeholder="URL ảnh" />
                <button className="danger-icon" type="button" onClick={() => removePerson('cast', index)}>×</button>
              </div>
            ))}
            {form.cast.length === 0 && <p className="admin-empty-state">Chưa có diễn viên. Hãy thêm thủ công hoặc nhập từ TMDb.</p>}
          </div>
        </section>
      );
    }

    if (activeStep === 3) {
      return (
        <section className="wizard-panel">
          <div className="wizard-panel-heading">
            <h2>Chọn đạo diễn cho phim</h2>
            <button className="button primary" type="button" onClick={() => addPerson('directors')}>+ Thêm đạo diễn mới</button>
          </div>
          <div className="director-list">
            {form.directors.map((person, index) => (
              <div className="wizard-director-card" key={`${person.tmdbId || 'director'}-${index}`}>
                <PersonAvatar person={person} />
                <input className="input" value={person.name} onChange={(event) => updatePerson('directors', index, 'name', event.target.value)} placeholder="Tên đạo diễn" />
                <input className="input" value={person.job || ''} onChange={(event) => updatePerson('directors', index, 'job', event.target.value)} placeholder="Vai trò" />
                <input className="input" value={person.profile || ''} onChange={(event) => updatePerson('directors', index, 'profile', event.target.value)} placeholder="URL ảnh" />
                <button className="danger-icon" type="button" onClick={() => removePerson('directors', index)}>×</button>
              </div>
            ))}
            {form.directors.length === 0 && <p className="admin-empty-state">Chưa có đạo diễn. Hãy thêm thủ công hoặc nhập từ TMDb.</p>}
          </div>
        </section>
      );
    }

    if (activeStep === 4) {
      const selectedEpisode = episodeRows.find((episode) => Number(episode.MaTap) === Number(selectedEpisodeId));

      return (
        <div className="movie-wizard-grid video">
          <section className="wizard-panel">
            <div className="wizard-panel-heading">
              <h2>Quản lý video & trailer</h2>
              <button className="button primary" type="button" onClick={addEpisodeRow}>+ Thêm tập phim</button>
            </div>
            <div className="wizard-tabs">
              <button className={activeVideoTab === 'episodes' ? 'active' : ''} type="button" onClick={() => setActiveVideoTab('episodes')}>Tập phim</button>
              <button className={activeVideoTab === 'subtitles' ? 'active' : ''} type="button" onClick={() => setActiveVideoTab('subtitles')}>Phụ đề</button>
            </div>

            {movieId && episodeRows.length > 0 && (
              <label className="wizard-episode-picker">
                <span>Đang quản lý</span>
                <select className="input" value={selectedEpisodeId || ''} onChange={(event) => setSelectedEpisodeId(Number(event.target.value))}>
                  {episodeRows.map((episode, index) => <option key={episode.MaTap} value={episode.MaTap}>{episode.TenTap || `Tập ${index + 1}`}</option>)}
                </select>
              </label>
            )}

            {activeVideoTab === 'episodes' && (
              <div className="wizard-episode-table">
                <div><span>Tập</span><span>Tên tập</span><span>Thời lượng</span><span>Trạng thái</span><span></span></div>
                {episodeRows.map((episode, index) => (
                  <div className={Number(episode.MaTap) === Number(selectedEpisodeId) ? 'selected' : ''} key={episode.MaTap || `${episode.title}-${index}`} onClick={() => episode.MaTap && setSelectedEpisodeId(episode.MaTap)}>
                    <span>{index + 1}</span>
                    <strong>{episode.TenTap || episode.title}</strong>
                    <span>{episode.duration ? `${episode.duration}s` : '-'}</span>
                    <span className="dash-pill pending">{episode.upload_status || episode.status}</span>
                    <button className="wizard-row-open" type="button" onClick={() => { setSelectedEpisodeId(episode.MaTap); setActiveVideoTab('subtitles'); }}>Quản lý</button>
                  </div>
                ))}
                {episodeRows.length === 0 && <p className="admin-empty-state">{movieId ? 'Chưa có tập phim. Bấm “Thêm tập phim” để bắt đầu.' : 'Hãy lưu phim trước để quản lý tập, phụ đề và chất lượng.'}</p>}
              </div>
            )}

            {activeVideoTab === 'subtitles' && (
              <div className="wizard-media-manager">
                {!selectedEpisode ? <p className="admin-empty-state">Chọn hoặc thêm một tập phim trước.</p> : (
                  <>
                    <div className="wizard-media-fields">
                      <input className="input" value={subtitleForm.languageCode} onChange={(event) => setSubtitleForm((current) => ({ ...current, languageCode: event.target.value }))} placeholder="vi" />
                      <input className="input" value={subtitleForm.languageName} onChange={(event) => setSubtitleForm((current) => ({ ...current, languageName: event.target.value }))} placeholder="Tiếng Việt" />
                    </div>
                    <FileUrlInput label="File phụ đề WebVTT" name="subtitleUrl" value={subtitleForm.url} onChange={(event) => setSubtitleForm((current) => ({ ...current, url: event.target.value }))} onUpload={(file) => uploadMediaFile(file, 'subtitle')} accept=".vtt,text/vtt" placeholder="Dán URL hoặc chọn file .vtt" />
                    <label className="wizard-check"><input type="checkbox" checked={subtitleForm.isDefault} onChange={(event) => setSubtitleForm((current) => ({ ...current, isDefault: event.target.checked }))} /> Đặt làm phụ đề mặc định</label>
                    <button className="button primary wizard-add-media" type="button" disabled={saving || !subtitleForm.url} onClick={addWizardSubtitle}>+ Thêm phụ đề</button>
                    <div className="wizard-media-list">
                      {(selectedEpisode.subtitles || []).map((subtitle) => (
                        <div key={subtitle.MaPhuDe}><span><strong>{subtitle.TenNgonNgu}</strong><small>{subtitle.DinhDang.toUpperCase()}{subtitle.MacDinh ? ' · Mặc định' : ''}</small></span><button type="button" onClick={async () => { await episodeApi.removeSubtitle(selectedEpisodeId, subtitle.MaPhuDe); reloadEpisodes(); }}>Xóa</button></div>
                      ))}
                      {(selectedEpisode.subtitles || []).length === 0 && <p>Chưa có phụ đề cho tập này.</p>}
                    </div>
                  </>
                )}
              </div>
            )}

          </section>
          <aside className="wizard-panel">
            <h2>Upload tập phim</h2>
            <FileUrlInput label="Trailer URL" name="link" value={form.link} onChange={updateField} onUpload={(file) => uploadMediaFile(file, 'trailer')} accept="video/*" placeholder="Dán URL trailer hoặc chọn tệp" />
            <label>YouTube key<input className="input" name="trailerKey" value={form.trailerKey} onChange={updateField} /></label>
            <FileUrlInput label="Video URL" name="videoUrl" value={form.videoUrl} onChange={updateField} onUpload={(file) => uploadMediaFile(file, 'video')} accept="video/*" placeholder="Dán URL video hoặc chọn tệp" />
            <FileUrlInput label="HLS master" name="hlsMasterUrl" value={form.hlsMasterUrl} onChange={updateField} onUpload={(file) => uploadMediaFile(file, 'hls')} accept=".m3u8,application/vnd.apple.mpegurl" placeholder="Dán URL HLS hoặc chọn tệp" />
            <div className="wizard-stream-note">
              <strong>Adaptive bitrate tự động</strong>
              <span>Chỉ cần dán manifest HLS master của Cloudflare Stream hoặc AWS MediaConvert. Player tự đọc các mức 360p, 720p, 1080p từ file index.m3u8.</span>
            </div>
          </aside>
        </div>
      );
    }

    return (
      <section className="wizard-panel">
        <h2>Xác nhận thông tin phim</h2>
        <div className="wizard-summary-grid">
          <article>
            <h3>Thông tin phim</h3>
            <div className="wizard-summary-movie">
              {form.poster ? <img src={form.poster} alt="" /> : <span />}
              <dl>
                <dt>Tên phim:</dt><dd>{form.name || '-'}</dd>
                <dt>Tên gốc:</dt><dd>{form.title || '-'}</dd>
                <dt>Thể loại:</dt><dd>{form.genreIds.length} thể loại</dd>
                <dt>Năm:</dt><dd>{form.year || '-'}</dd>
                <dt>Trạng thái:</dt><dd>{statusOptions.find((option) => option.value === form.status)?.label || form.status}</dd>
              </dl>
            </div>
          </article>
          <article><h3>Diễn viên</h3>{form.cast.slice(0, 4).map((person) => <p key={person.name}>{person.name}<small>{person.character}</small></p>) || '-'}</article>
          <article><h3>Đạo diễn</h3>{form.directors.slice(0, 4).map((person) => <p key={person.name}>{person.name}<small>{person.job}</small></p>) || '-'}</article>
          <article><h3>Video & Trailer</h3><p>Số tập: <b>{episodeRows.length || 1}</b></p><p>Trailer: <b>{form.link || form.trailerKey ? 'Có' : 'Chưa có'}</b></p><p>Video: <b>{form.videoUrl || form.hlsMasterUrl ? 'Có' : 'Chưa có'}</b></p></article>
        </div>
      </section>
    );
  }

  if (loading) {
    return <section className="admin-page"><div className="loading">Đang tải...</div></section>;
  }

  return (
    <section className="admin-page movie-wizard-page">
      <div className="admin-page-header movie-wizard-header">
        <div>
          <p className="admin-kicker">Quản lý phim</p>
          <h1>{title}</h1>
        </div>
        <form className="tmdb-search" onSubmit={searchTmdb}>
          <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm phim trên TMDb" />
          <button className="button primary" type="submit" disabled={searching}>{searching ? 'Đang tìm...' : 'Tìm TMDb'}</button>
        </form>
        <div className="admin-actions">
          {publicPath && <Link className="button secondary" to={publicPath}>Xem trang phim</Link>}
          {onDelete && <button className="button danger" type="button" onClick={onDelete}>Xóa phim</button>}
        </div>
      </div>

      <WizardSteps activeStep={activeStep} completedSteps={completedSteps} setActiveStep={setActiveStep} />

      {message && <p className="admin-message">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      {tmdbResults.length > 0 && (
        <section className="admin-card tmdb-card">
          <h2>Kết quả TMDb</h2>
          <div className="tmdb-results">
            {tmdbResults.slice(0, 6).map((movie) => (
              <button className="tmdb-result" key={`${movie.mediaType}-${movie.tmdbId}`} type="button" onClick={() => importMovie(movie)}>
                {movie.poster && <img src={movie.poster} alt="" />}
                <span><strong>{movie.title}</strong><small>{movie.year || 'N/A'} - {movie.mediaType === 'tv' ? 'TV' : 'Phim'}</small></span>
              </button>
            ))}
          </div>
        </section>
      )}

      {renderStep()}

      <div className="wizard-footer-actions">
        <button className="button secondary" type="button" disabled={activeStep === 1} onClick={() => setActiveStep((step) => Math.max(1, step - 1))}>Quay lại</button>
        {activeStep < 5 ? (
          <button className="button primary" type="button" onClick={() => setActiveStep((step) => Math.min(5, step + 1))}>Tiếp tục</button>
        ) : (
          <>
            <button className="button secondary" type="button" disabled={saving} onClick={() => saveMovie(false)}>{saving ? 'Đang lưu...' : 'Lưu nháp'}</button>
            <button className="button publish" type="button" disabled={saving} onClick={() => saveMovie(true)}>{saving ? 'Đang xuất bản...' : 'Xuất bản phim'}</button>
          </>
        )}
      </div>
    </section>
  );
}

export default MovieWizard;
