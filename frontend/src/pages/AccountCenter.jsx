import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import FileUrlInput from '../components/FileUrlInput.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { authApi } from '../services/authApi.js';
import { movieApi } from '../services/movieApi.js';
import { uploadApi } from '../services/uploadApi.js';
import { normalizeMovies } from '../utils/normalizeMovie.js';

const menuItems = [
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: 'U' },
  { id: 'history', label: 'Lịch sử xem', icon: 'H' },
  { id: 'continue', label: 'Tiếp tục xem', icon: 'P' },
  { id: 'favorites', label: 'Phim yêu thích', icon: 'F' },
  { id: 'reviews', label: 'Đánh giá của tôi', icon: 'R' },
  { id: 'comments', label: 'Bình luận của tôi', icon: 'C' },
  { id: 'settings', label: 'Cài đặt tài khoản', icon: 'S' },
  { id: 'password', label: 'Đổi mật khẩu', icon: 'K' },
  { id: 'logout', label: 'Đăng xuất', icon: 'L' }
];

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : 'Đang cập nhật';
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : 'Đang cập nhật';
}

function formatWatchTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value || 0)));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function movieDurationSeconds(movie) {
  const value = Number.parseFloat(String(movie?.duration || '').replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value > 600 ? value : value * 60;
}

function watchProgress(movie) {
  const duration = movieDurationSeconds(movie);
  if (!duration) return 0;
  return Math.min(100, Math.max(0, (Number(movie.watchedSeconds || 0) / duration) * 100));
}

function continueWatchUrl(movie) {
  const params = new URLSearchParams({ resume: '1' });
  if (movie.historyEpisodeId) params.set('episode', String(movie.historyEpisodeId));
  return `/watch/${movie.id}?${params.toString()}`;
}

function MiniPoster({ movie }) {
  return (
    <span className="account-mini-poster">
      {movie?.poster ? <img src={movie.poster} alt="" /> : movie?.name?.charAt(0) || 'M'}
    </span>
  );
}

async function uploadMediaFile(file, category) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  const response = await uploadApi.uploadMedia(formData);
  return response.data.data.url;
}

function AccountCenter() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab = menuItems.some((item) => item.id === requestedTab) ? requestedTab : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [historyMovies, setHistoryMovies] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [myComments, setMyComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [profileDraft, setProfileDraft] = useState({
    fullName: user?.ho_ten || user?.ten_dang_nhap || '',
    email: user?.email || '',
    avatar: user?.hinh_dai_dien || '',
  });
  const [passwordDraft, setPasswordDraft] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    setProfileDraft((current) => ({
      ...current,
      fullName: user?.ho_ten || user?.ten_dang_nhap || '',
      email: user?.email || '',
      avatar: user?.hinh_dai_dien || ''
    }));
  }, [user]);

  useEffect(() => {
    const nextTab = menuItems.some((item) => item.id === requestedTab) ? requestedTab : 'profile';
    setActiveTab(nextTab);
  }, [requestedTab]);

  useEffect(() => {
    async function loadAccountData() {
      try {
        setLoading(true);
        const [historyResponse, favoritesResponse, ratingsResponse, commentsResponse] = await Promise.all([
          movieApi.history({ limit: 20 }),
          movieApi.favorites({ limit: 20 }),
          authApi.myRatings({ limit: 50 }),
          authApi.myComments({ limit: 50 })
        ]);
        setHistoryMovies(normalizeMovies(historyResponse.data.data || []));
        setFavoriteMovies(normalizeMovies(favoritesResponse.data.data || []));
        setMyRatings(ratingsResponse.data.data || []);
        setMyComments(commentsResponse.data.data || []);
        setError('');
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Không tải được dữ liệu tài khoản.');
      } finally {
        setLoading(false);
      }
    }

    loadAccountData();
  }, []);

  const fullName = profileDraft.fullName || user?.ho_ten || user?.ten_dang_nhap || 'Người dùng Netflop';
  const username = user?.ten_dang_nhap || 'user';
  const continueMovies = useMemo(
    () => historyMovies
      .filter((movie) => Number(movie.watchedSeconds || 0) >= 5)
      .filter((movie) => !movieDurationSeconds(movie) || watchProgress(movie) < 95)
      .slice(0, 8),
    [historyMovies]
  );
  const totalWatchMinutes = historyMovies.reduce(
    (sum, movie) => sum + Number(movie.ThoiGianXem || 0),
    0
  ) / 60;
  const stats = [
    { label: 'Phim đã xem', value: historyMovies.length, hint: 'Phim đã mở' },
    { label: 'Tập đã xem', value: historyMovies.filter((movie) => movie.MaTap).length || historyMovies.length, hint: 'Tập đã phát' },
    { label: 'Thời gian xem', value: `${Math.round(totalWatchMinutes / 60)}h`, hint: 'Tổng thời lượng' },
    { label: 'Phim yêu thích', value: favoriteMovies.length, hint: 'Trong danh sách' },
    { label: 'Đánh giá', value: myRatings.length, hint: 'Đã gửi' },
    { label: 'Bình luận', value: myComments.length, hint: 'Đã gửi' }
  ];

  function updateProfileDraft(event) {
    const { name, value } = event.target;
    setProfileDraft((current) => ({ ...current, [name]: value }));
  }

  function handleMenuClick(item) {
    setNotice('');
    if (item.id === 'logout') {
      logout();
      navigate('/');
      return;
    }
    setActiveTab(item.id);
    setSearchParams(item.id === 'profile' ? {} : { tab: item.id });
  }

  async function saveProfile(event) {
    event.preventDefault();
    setNotice('');
    try {
      const response = await authApi.updateMe({
        fullName: profileDraft.fullName,
        email: profileDraft.email,
        avatarUrl: profileDraft.avatar
      });
      setUser?.(response.data.data);
      setNotice('Đã lưu cài đặt tài khoản.');
    } catch (saveError) {
      setNotice(saveError.response?.data?.message || 'Không lưu được cài đặt tài khoản.');
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    if (!passwordDraft.current || !passwordDraft.next || !passwordDraft.confirm) {
      setNotice('Vui lòng nhập đầy đủ thông tin mật khẩu.');
      return;
    }
    if (passwordDraft.next.length < 6) {
      setNotice('Mật khẩu mới cần tối thiểu 6 ký tự.');
      return;
    }
    if (passwordDraft.next !== passwordDraft.confirm) {
      setNotice('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    try {
      await authApi.changePassword({
        currentPassword: passwordDraft.current,
        newPassword: passwordDraft.next
      });
      setPasswordDraft({ current: '', next: '', confirm: '' });
      setNotice('Đã cập nhật mật khẩu.');
    } catch (passwordError) {
      setNotice(passwordError.response?.data?.message || 'Không cập nhật được mật khẩu.');
    }
  }

  async function removeFavorite(movieId) {
    try {
      await movieApi.removeFavorite(movieId);
      setFavoriteMovies((current) => current.filter((movie) => movie.id !== movieId));
      setNotice('Đã xóa phim khỏi danh sách yêu thích.');
    } catch (favoriteError) {
      setNotice(favoriteError.response?.data?.message || 'Không xóa được phim yêu thích.');
    }
  }

  function renderStats() {
    return (
      <section className="account-stat-grid">
        {stats.map((stat) => (
          <article className="account-stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.hint}</small>
          </article>
        ))}
      </section>
    );
  }

  function renderContent() {
    if (activeTab === 'profile') {
      return (
        <>
          <section className="account-profile-card">
            <UserAvatar className="account-avatar-large" src={profileDraft.avatar} name={fullName} alt={fullName} />
            <div className="account-profile-info">
              <p>Hồ sơ cá nhân</p>
              <h2>{fullName}</h2>
              <dl>
                <div><dt>Tên đăng nhập</dt><dd>{username}</dd></div>
                <div><dt>Email</dt><dd>{profileDraft.email || 'Đang cập nhật'}</dd></div>
                <div><dt>Ngày tham gia</dt><dd>{formatDate(user?.ngay_tao)}</dd></div>
                <div><dt>Vai trò</dt><dd>{user?.vai_tro || 'user'}</dd></div>
                <div><dt>Trạng thái</dt><dd>{user?.trang_thai || 'active'}</dd></div>
              </dl>
            </div>
            <button className="button secondary" type="button" onClick={() => setActiveTab('settings')}>Chỉnh sửa</button>
          </section>
          {renderStats()}
        </>
      );
    }

    if (activeTab === 'continue') {
      return (
        <section className="account-section">
          <header><h2>Tiếp tục xem</h2><span>{continueMovies.length} phim</span></header>
          <div className="continue-grid">
            {continueMovies.map((movie) => (
              <article className="continue-card" key={movie.id}>
                <MiniPoster movie={movie} />
                <div>
                  <strong>{movie.name}</strong>
                  <span>{movie.MaTap ? `Tập #${movie.MaTap}` : 'Full HD'}</span>
                  <i><b style={{ width: `${watchProgress(movie)}%` }} /></i>
                  <small>Đã xem {formatWatchTime(movie.watchedSeconds)}</small>
                </div>
                <Link to={continueWatchUrl(movie)}>Tiếp tục</Link>
              </article>
            ))}
            {continueMovies.length === 0 && <p className="account-empty">Chưa có phim đang xem.</p>}
          </div>
        </section>
      );
    }

    if (activeTab === 'history') {
      return (
        <section className="account-section">
          <header><h2>Lịch sử xem</h2><span>{historyMovies.length} mục</span></header>
          <div className="account-history-table">
            <div className="account-table-head"><span>Poster</span><span>Tên phim</span><span>Tập</span><span>Lần xem gần nhất</span><span>Thời lượng xem</span><span></span></div>
            {historyMovies.slice(0, 8).map((movie) => (
              <div className="account-table-row" key={`${movie.id}-${movie.MaTap || 'movie'}`}>
                <MiniPoster movie={movie} />
                <strong>{movie.name}</strong>
                <span>{movie.MaTap ? `Tập #${movie.MaTap}` : 'Full HD'}</span>
                <span>{formatDateTime(movie.ThoiGian)}</span>
                <span>{Math.round(Number(movie.ThoiGianXem || 0) / 60)} phút</span>
                <Link to={continueWatchUrl(movie)}>Tiếp tục</Link>
              </div>
            ))}
            {historyMovies.length === 0 && <p className="account-empty">Chưa có lịch sử xem.</p>}
          </div>
        </section>
      );
    }

    if (activeTab === 'favorites') {
      return (
        <section className="account-section">
          <header><h2>Phim yêu thích</h2><span>{favoriteMovies.length} phim</span></header>
          <div className="account-favorite-grid">
            {favoriteMovies.slice(0, 8).map((movie) => (
              <article className="favorite-account-card" key={movie.id}>
                <MiniPoster movie={movie} />
                <div>
                  <strong>{movie.name}</strong>
                  <span>{movie.genres?.[0]?.name || movie.type || 'Phim'} - {Number(movie.rating || 0).toFixed(1)}</span>
                </div>
                <Link to={`/watch/${movie.id}`}>Xem ngay</Link>
                <button type="button" onClick={() => removeFavorite(movie.id)}>Xóa</button>
              </article>
            ))}
            {favoriteMovies.length === 0 && <p className="account-empty">Bạn chưa thêm phim yêu thích.</p>}
          </div>
        </section>
      );
    }

    if (activeTab === 'reviews' || activeTab === 'comments') {
      const items = activeTab === 'reviews' ? myRatings : myComments;
      return (
        <section className="account-section">
          <header>
            <h2>{activeTab === 'reviews' ? 'Đánh giá của tôi' : 'Bình luận của tôi'}</h2>
            <span>{items.length}</span>
          </header>
          <div className="account-feedback-list">
            {items.map((item, index) => (
              <article key={`${item.MaPhim}-${item.ThoiGian}-${index}`}>
                <div>
                  <Link to={`/movies/${item.MaPhim}`}>{item.TenPhim || `Phim #${item.MaPhim}`}</Link>
                  <time>{formatDateTime(item.ThoiGian)}</time>
                </div>
                {activeTab === 'reviews' && <strong>{Number(item.SoDiem || 0).toFixed(1)}/10</strong>}
                <p>{activeTab === 'reviews' ? (item.BinhLuan || 'Không có nội dung nhận xét.') : item.NoiDung}</p>
              </article>
            ))}
            {items.length === 0 && (
              <p className="account-empty">
                {activeTab === 'reviews' ? 'Chưa có đánh giá nào.' : 'Chưa có bình luận nào.'}
              </p>
            )}
          </div>
        </section>
      );
    }

    if (activeTab === 'settings') {
      return (
        <form className="account-section account-form" onSubmit={saveProfile}>
          <header><h2>Cài đặt tài khoản</h2></header>
          <FileUrlInput
            label="Ảnh đại diện"
            name="avatar"
            value={profileDraft.avatar}
            onChange={updateProfileDraft}
            onUpload={(file) => uploadMediaFile(file, 'avatar')}
            accept="image/*"
            placeholder="Dán URL ảnh hoặc chọn tệp"
          />
          <label>Họ tên<input className="input" name="fullName" value={profileDraft.fullName} onChange={updateProfileDraft} /></label>
          <label>Email<input className="input" name="email" value={profileDraft.email} onChange={updateProfileDraft} /></label>
          <button className="button primary" type="submit">Lưu cài đặt</button>
        </form>
      );
    }

    return (
      <form className="account-section account-form" onSubmit={savePassword}>
        <header><h2>Đổi mật khẩu</h2></header>
        <label>Mật khẩu hiện tại<input className="input" type="password" value={passwordDraft.current} onChange={(event) => setPasswordDraft((current) => ({ ...current, current: event.target.value }))} /></label>
        <label>Mật khẩu mới<input className="input" type="password" value={passwordDraft.next} onChange={(event) => setPasswordDraft((current) => ({ ...current, next: event.target.value }))} /></label>
        <label>Xác nhận mật khẩu<input className="input" type="password" value={passwordDraft.confirm} onChange={(event) => setPasswordDraft((current) => ({ ...current, confirm: event.target.value }))} /></label>
        <button className="button primary" type="submit">Lưu mật khẩu</button>
      </form>
    );
  }

  if (loading) {
    return <main className="account-center-page"><div className="account-loading">Đang tải trung tâm tài khoản...</div></main>;
  }

  return (
    <main className="account-center-page account-tab-page">
      <aside className="account-sidebar">
        <div className="account-sidebar-title">
          <UserAvatar src={profileDraft.avatar} name={username} />
          <div>
            <strong>Trung tâm tài khoản</strong>
            <small>{username}</small>
          </div>
        </div>
        <nav>
          {menuItems.map((item) => (
            <button
              className={activeTab === item.id ? 'active' : ''}
              key={item.id}
              type="button"
              onClick={() => handleMenuClick(item)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="account-content">
        <div className="account-hero">
          <div>
            <p>Netflop cá nhân</p>
            <h1>{menuItems.find((item) => item.id === activeTab)?.label || 'Hồ sơ cá nhân'}</h1>
            <span>Chọn mục ở sidebar để xem và cập nhật thông tin ngay bên phải.</span>
          </div>
          <Link className="button primary" to="/movies">Khám phá phim</Link>
        </div>

        {error && <p className="form-error">{error}</p>}
        {notice && <p className="admin-message account-notice">{notice}</p>}
        {renderContent()}
      </section>
    </main>
  );
}

export default AccountCenter;
