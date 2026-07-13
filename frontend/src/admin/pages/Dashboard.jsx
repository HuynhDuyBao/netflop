import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi.js';

const emptyDashboard = {
  metrics: {},
  chart: [],
  topMovies: [],
  recentMovies: [],
  processingEpisodes: [],
  recentUsers: [],
  activity: [],
  system: []
};

const chartPeriods = [
  { value: 'day', label: 'Ngày', title: 'Hoạt động xem hôm nay' },
  { value: 'week', label: 'Tuần', title: 'Hoạt động xem 7 ngày' },
  { value: 'month', label: 'Tháng', title: 'Hoạt động xem trong tháng' },
  { value: 'year', label: 'Năm', title: 'Hoạt động xem trong năm' }
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('vi-VN');
}

function initials(value) {
  return String(value || 'NA').slice(0, 2).toUpperCase();
}

function statusLabel(value) {
  const map = {
    ready: 'Sẵn sàng',
    pending: 'Đang chờ',
    processing: 'Đang xử lý',
    failed: 'Thất bại'
  };
  return map[value] || value || '-';
}

function roleLabel(value) {
  const map = {
    user: 'Người dùng',
    moderator: 'Kiểm duyệt viên',
    admin: 'Quản trị viên',
    super_admin: 'Quản trị cao cấp'
  };
  return map[value] || value || '-';
}

function accountStatusLabel(value) {
  const map = {
    active: 'Đang hoạt động',
    inactive: 'Tạm khóa',
    banned: 'Bị cấm'
  };
  return map[value] || value || '-';
}

function Dashboard() {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [chartPeriod, setChartPeriod] = useState('week');
  const [hoveredChart, setHoveredChart] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    setChartLoading(true);
    adminApi.dashboard({ period: chartPeriod })
      .then((data) => {
        setDashboard({ ...emptyDashboard, ...data });
        setError('');
      })
      .catch((dashboardError) => setError(dashboardError.response?.data?.message || 'Không tải được dashboard.'))
      .finally(() => {
        setLoading(false);
        setChartLoading(false);
      });
  }, [chartPeriod]);

  const activeChartPeriod = chartPeriods.find((period) => period.value === chartPeriod) || chartPeriods[1];
  const fallbackChartLength = chartPeriod === 'day' ? 24 : chartPeriod === 'year' ? 12 : chartPeriod === 'month' ? 30 : 7;
  const chart = dashboard.chart.length ? dashboard.chart : Array.from({ length: fallbackChartLength }, (_, index) => ({
    label: `${index + 1}`,
    views: 0
  }));
  const maxViews = Math.max(...chart.map((item) => Number(item.views || 0)), 1);
  const chartPoints = chart.map((item, index) => {
    const x = 48 + index * (624 / Math.max(chart.length - 1, 1));
    const y = 180 - (Number(item.views || 0) / maxViews) * 140;
    return { item, index, x, y };
  });
  const chartPath = chartPoints.map(({ index, x, y }) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const chartTotal = chart.reduce((total, item) => total + Number(item.views || 0), 0);
  const chartSummaryLabel = chartPeriod === 'day'
    ? 'Hôm nay'
    : chartPeriod === 'week'
      ? 'Tổng tuần này'
      : chartPeriod === 'month'
        ? 'Tổng tháng này'
        : 'Tổng năm này';

  const metrics = dashboard.metrics;
  const highestMovieViews = useMemo(
    () => Math.max(...dashboard.topMovies.map((movie) => Number(movie.LuotXem || 0)), 1),
    [dashboard.topMovies]
  );

  return (
    <section className="admin-page admin-dashboard">
      {error && <p className="form-error">{error}</p>}
      {loading && <p className="admin-message">Đang tải dữ liệu dashboard...</p>}

      <div className="dashboard-stat-grid">
        <StatCard icon="U" label="Tổng người dùng" value={formatNumber(metrics.users)} change="Tài khoản trong hệ thống" tone="purple" />
        <StatCard icon="F" label="Tổng phim" value={formatNumber(metrics.movies)} change="Phim đã tạo" tone="blue" />
        <StatCard icon="P" label="Tổng tập phim" value={formatNumber(metrics.episodes)} change="Tập phim trong thư viện" tone="green" />
        <StatCard icon="V" label="Tổng lượt xem" value={formatNumber(metrics.totalViews)} change="Lượt xem của toàn bộ phim" tone="amber" />
        <StatCard icon="N" label="Người xem hôm nay" value={formatNumber(metrics.todayViews)} change="Lịch sử được cập nhật hôm nay" tone="cyan" />
        <StatCard icon="C" label="Bình luận" value={formatNumber(metrics.comments)} change="Bình luận đang lưu" tone="rose" />
        <StatCard icon="R" label="Đánh giá" value={formatNumber(metrics.ratings)} change="Tổng lượt đánh giá" tone="pink" />
        <StatCard icon="S" label="Video đang xử lý" value={formatNumber(metrics.processing)} change="Đang chờ hoặc đang chuyển đổi" tone="cyan" neutral />
      </div>

      <div className="dashboard-main-grid">
        <Panel
          className="view-chart"
          title={activeChartPeriod.title}
          action={<Segmented value={chartPeriod} onChange={(nextPeriod) => { setChartPeriod(nextPeriod); setHoveredChart(null); }} />}
        >
          <div className="chart-wrap">
            {chartPeriod !== 'day' && (
              <div className={`chart-summary ${chartLoading ? 'is-loading' : ''}`}>
                <span>{chartSummaryLabel}</span>
                <strong>{formatNumber(chartTotal)} lượt xem</strong>
              </div>
            )}
            <svg viewBox="0 0 720 230" role="img" aria-label={`Biểu đồ ${activeChartPeriod.title}`} onMouseLeave={() => setHoveredChart(null)}>
              <defs>
                <linearGradient id="viewFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4].map((line) => (
                <line className="chart-grid-line" key={line} x1="48" x2="680" y1={34 + line * 38} y2={34 + line * 38} />
              ))}
              {chart.map((_, index) => {
                const x = 48 + index * (624 / Math.max(chart.length - 1, 1));
                return <line className="chart-grid-line" key={`v${index}`} x1={x} x2={x} y1="28" y2="184" />;
              })}
              <path className="chart-area" d={`${chartPath} L 672 184 L 48 184 Z`} />
              <path className="chart-line" d={chartPath} />
              {chartPoints.map((point) => (
                <g key={`${point.item.label}-${point.index}`}>
                  <circle className="chart-dot" cx={point.x} cy={point.y} r="5" />
                  <circle
                    className="chart-hit"
                    cx={point.x}
                    cy={point.y}
                    r="15"
                    tabIndex="0"
                    onMouseEnter={() => setHoveredChart(point)}
                    onFocus={() => setHoveredChart(point)}
                  />
                </g>
              ))}
            </svg>
            {hoveredChart && (
              <div
                className="chart-tooltip"
                style={{
                  left: `${(hoveredChart.x / 720) * 100}%`,
                  top: `${(hoveredChart.y / 230) * 100}%`
                }}
              >
                <span>{hoveredChart.item.detail || hoveredChart.item.label}</span>
                <strong>{formatNumber(hoveredChart.item.views)} lượt xem</strong>
              </div>
            )}
            <div className="chart-y-axis">
              <span>{formatNumber(maxViews)}</span>
              <span>{formatNumber(Math.round(maxViews * 0.75))}</span>
              <span>{formatNumber(Math.round(maxViews * 0.5))}</span>
              <span>{formatNumber(Math.round(maxViews * 0.25))}</span>
              <span>0</span>
            </div>
            <div className="chart-x-axis" style={{ gridTemplateColumns: `repeat(${chart.length}, minmax(0, 1fr))` }}>
              {chart.map((item, index) => <span key={`${item.label}-${index}`}>{item.label}</span>)}
            </div>
          </div>
        </Panel>

        <Panel title="Top phim xem nhiều" link="/admin/movies">
          <div className="top-movie-list">
            {dashboard.topMovies.length === 0 && <EmptyState text="Chưa có phim." />}
            {dashboard.topMovies.map((movie, index) => (
              <div className="top-movie-row" key={movie.MaPhim}>
                <span className="rank">{index + 1}</span>
                {movie.HinhAnh || movie.HinhAnhBanner ? <img src={movie.HinhAnh || movie.HinhAnhBanner} alt={movie.TenPhim} /> : <span className="poster-chip violet">{initials(movie.TenPhim)}</span>}
                <div>
                  <strong>{movie.TenPhim}</strong>
                  <small>{formatNumber(movie.LuotXem)} lượt xem</small>
                </div>
                <span className="progress"><i style={{ width: `${Math.max((Number(movie.LuotXem || 0) / highestMovieViews) * 100, 8)}%` }} /></span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Hoạt động gần đây" link="/admin/settings">
          <div className="activity-list">
            {dashboard.activity.length === 0 && <EmptyState text="Chưa có hoạt động mới." />}
            {dashboard.activity.map((item, index) => (
              <div className="activity-row" key={`${item.message}-${index}`}>
                <span className={`activity-icon tone-${index % 6}`}>{initials(item.type)}</span>
                <p>{item.message}</p>
                <small>{formatDate(item.time)}</small>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="dashboard-table-grid">
        <Panel title="Phim mới cập nhật" link="/admin/movies">
          <div className="mini-table movie-update-table">
            <div className="mini-table-head"><span>Phim</span><span>Thể loại</span><span>Năm</span><span>Trạng thái</span><span>Lượt xem</span></div>
            {dashboard.recentMovies.map((movie) => (
              <div className="mini-table-row" key={movie.MaPhim}>
                <span className="movie-cell">{movie.HinhAnh || movie.HinhAnhBanner ? <img src={movie.HinhAnh || movie.HinhAnhBanner} alt="" /> : <i className="poster-chip violet">{initials(movie.TenPhim)}</i>}{movie.TenPhim}</span>
                <span>{movie.TheLoai || '-'}</span>
                <span>{movie.NamPhatHanh || '-'}</span>
                <span className={movie.is_published ? 'dash-pill' : 'dash-pill pending'}>{movie.is_published ? 'Đã xuất bản' : 'Bản nháp'}</span>
                <span>{formatNumber(movie.LuotXem)}</span>
              </div>
            ))}
            {dashboard.recentMovies.length === 0 && <EmptyState text="Chưa có phim mới." />}
          </div>
        </Panel>

        <Panel title="Trạng thái video gần đây" link="/admin/episodes">
          <div className="mini-table processing-table">
            <div className="mini-table-head"><span>Video</span><span>Trạng thái</span><span>Thời lượng</span><span>Cập nhật</span></div>
            {dashboard.processingEpisodes.map((episode) => (
              <div className="mini-table-row" key={episode.MaTap}>
                <span>{episode.TenPhim ? `${episode.TenPhim} - ${episode.TenTap}` : episode.TenTap}</span>
                <span className={episode.upload_status === 'failed' ? 'dash-pill danger' : episode.upload_status === 'ready' ? 'dash-pill' : 'dash-pill pending'}>{statusLabel(episode.upload_status)}</span>
                <span>{episode.duration ? `${episode.duration}s` : '-'}</span>
                <span>{formatDate(episode.updated_at)}</span>
              </div>
            ))}
            {dashboard.processingEpisodes.length === 0 && <EmptyState text="Chưa có video." />}
          </div>
        </Panel>

        <Panel title="Người dùng mới" link="/admin/users">
          <div className="mini-table user-table">
            <div className="mini-table-head"><span>Người dùng</span><span>Vai trò</span><span>Ngày đăng ký</span><span>Trạng thái</span></div>
            {dashboard.recentUsers.map((user) => {
              const displayName = user.ho_ten || user.ten_dang_nhap || user.email || 'Người dùng';
              return (
                <div className="mini-table-row" key={user.id}>
                  <span className="user-cell"><i>{initials(displayName)}</i>{displayName}</span>
                  <span>{roleLabel(user.vai_tro)}</span>
                  <span>{formatDate(user.ngay_tao)}</span>
                  <span className={user.trang_thai === 'active' ? 'dash-pill' : user.trang_thai === 'banned' ? 'dash-pill danger' : 'dash-pill pending'}>{accountStatusLabel(user.trang_thai)}</span>
                </div>
              );
            })}
            {dashboard.recentUsers.length === 0 && <EmptyState text="Chưa có người dùng." />}
          </div>
        </Panel>
      </div>

      <div className="dashboard-bottom-grid">
        <Panel title="Thao tác nhanh">
          <div className="quick-actions">
            <QuickAction to="/admin/movies/create" icon="+" label="Thêm phim mới" />
            <QuickAction to="/admin/episodes/create" icon="▶" label="Thêm tập phim" />
            <QuickAction to="/admin/episodes/create" icon="↑" label="Upload video" />
            <QuickAction to="/admin/banners" icon="▣" label="Quản lý banner" />
            <QuickAction to="/admin/genres" icon="≡" label="Thêm thể loại" />
            <QuickAction to="/admin/users" icon="U" label="Người dùng" />
          </div>
        </Panel>

        <Panel title="Trạng thái hệ thống">
          <div className="system-grid">
            <div className="system-list">
              {dashboard.system.map((service) => (
                <div className="system-row" key={service.name}><span>{service.name}</span><strong>{service.status}</strong></div>
              ))}
            </div>
            <div className="storage-summary">
              <strong>{formatNumber(metrics.genres)}</strong>
              <span>thể loại</span>
              <small>Dữ liệu lấy trực tiếp từ catalog</small>
            </div>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function StatCard({ icon, label, value, change, tone, neutral = false }) {
  return (
    <article className="dashboard-stat-card">
      <span className={`stat-icon ${tone}`}>{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small className={neutral ? 'neutral' : ''}>{change}</small>
      </div>
    </article>
  );
}

function Panel({ title, action, link, className = '', children }) {
  return (
    <article className={`dashboard-panel ${className}`}>
      <header>
        <h2>{title}</h2>
        {action || (link ? <Link to={link}>Xem tất cả</Link> : null)}
      </header>
      {children}
    </article>
  );
}

function Segmented({ value, onChange }) {
  return (
    <div className="dashboard-segmented">
      {chartPeriods.map((period) => (
        <button
          key={period.value}
          type="button"
          className={value === period.value ? 'active' : ''}
          onClick={() => {
            if (value !== period.value) onChange(period.value);
          }}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

function QuickAction({ to, icon, label }) {
  return (
    <Link className="quick-action" to={to}>
      <span>{icon}</span>
      <strong>{label}</strong>
    </Link>
  );
}

function EmptyState({ text }) {
  return <p className="admin-empty-state">{text}</p>;
}

export default Dashboard;
