const { pool } = require('../config/database');

async function countFrom(sql, params = {}) {
  const [rows] = await pool.execute(sql, params);
  return Number(rows[0]?.total || 0);
}

function normalizePeriod(period) {
  return ['day', 'week', 'month', 'year'].includes(period) ? period : 'week';
}

function chartQueryForPeriod(period) {
  if (period === 'day') {
    return `
      SELECT DATE_FORMAT(ThoiGian, '%H') AS bucket, COUNT(*) AS views
      FROM lichsu
      WHERE DATE(ThoiGian) = CURDATE()
      GROUP BY HOUR(ThoiGian)
      ORDER BY HOUR(ThoiGian)
    `;
  }

  if (period === 'month') {
    return `
      SELECT DATE_FORMAT(ThoiGian, '%Y-%m-%d') AS bucket, COUNT(*) AS views
      FROM lichsu
      WHERE ThoiGian >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
        AND ThoiGian < DATE_ADD(LAST_DAY(CURDATE()), INTERVAL 1 DAY)
      GROUP BY DATE(ThoiGian)
      ORDER BY DATE(ThoiGian)
    `;
  }

  if (period === 'year') {
    return `
      SELECT DATE_FORMAT(ThoiGian, '%Y-%m') AS bucket, COUNT(*) AS views
      FROM lichsu
      WHERE YEAR(ThoiGian) = YEAR(CURDATE())
      GROUP BY YEAR(ThoiGian), MONTH(ThoiGian)
      ORDER BY YEAR(ThoiGian), MONTH(ThoiGian)
    `;
  }

  return `
    SELECT DATE_FORMAT(ThoiGian, '%Y-%m-%d') AS bucket, COUNT(*) AS views
    FROM lichsu
    WHERE ThoiGian >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(ThoiGian)
    ORDER BY DATE(ThoiGian)
  `;
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function buildChart(period, rows) {
  const chartMap = new Map(rows.map((row) => [row.bucket, Number(row.views || 0)]));
  const now = new Date();

  if (period === 'day') {
    return Array.from({ length: 24 }, (_, hour) => {
      const key = String(hour).padStart(2, '0');
      return {
        bucket: key,
        label: `${key}:00`,
        detail: now.toLocaleDateString('vi-VN'),
        views: chartMap.get(key) || 0
      };
    });
  }

  if (period === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month, index + 1);
      const key = dateKey(date);
      return {
        bucket: key,
        label: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        detail: date.toLocaleDateString('vi-VN'),
        views: chartMap.get(key) || 0
      };
    });
  }

  if (period === 'year') {
    const year = now.getFullYear();
    return Array.from({ length: 12 }, (_, month) => {
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      return {
        bucket: key,
        label: `T${month + 1}`,
        detail: `Tháng ${month + 1}/${year}`,
        views: chartMap.get(key) || 0
      };
    });
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = dateKey(date);
    return {
      bucket: key,
      label: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      detail: date.toLocaleDateString('vi-VN'),
      views: chartMap.get(key) || 0
    };
  });
}

async function listDashboard({ period = 'week' } = {}) {
  const chartPeriod = normalizePeriod(period);
  const viewStatsJoin = `
    LEFT JOIN (
      SELECT MaPhim, COUNT(*) AS total
      FROM lichsu
      GROUP BY MaPhim
    ) view_stats ON view_stats.MaPhim = p.MaPhim
  `;
  const resolvedViews = 'GREATEST(COALESCE(p.LuotXem, 0), COALESCE(view_stats.total, 0))';

  const [
    userTotal,
    movieTotal,
    totalViews,
    genreTotal,
    episodeTotal,
    todayViews,
    commentTotal,
    ratingTotal,
    processingTotal,
    recentUsers,
    recentMovies,
    topMovies,
    processingEpisodes,
    recentComments,
    recentRatings,
    chartRows
  ] = await Promise.all([
    countFrom('SELECT COUNT(*) AS total FROM tai_khoan WHERE deleted_at IS NULL'),
    countFrom('SELECT COUNT(*) AS total FROM phim WHERE deleted_at IS NULL'),
    countFrom('SELECT COALESCE(SUM(LuotXem), 0) AS total FROM phim WHERE deleted_at IS NULL'),
    countFrom('SELECT COUNT(*) AS total FROM theloai'),
    countFrom("SELECT COUNT(*) AS total FROM tapphim WHERE upload_status <> 'deleted'"),
    countFrom(`
      SELECT COUNT(*) AS total
      FROM lichsu ls
      INNER JOIN phim p ON p.MaPhim = ls.MaPhim AND p.deleted_at IS NULL
      WHERE DATE(ls.ThoiGian) = CURDATE()
    `),
    countFrom("SELECT COUNT(*) AS total FROM binhluan WHERE TrangThai = 'visible'"),
    countFrom('SELECT COUNT(*) AS total FROM danhgia'),
    countFrom("SELECT COUNT(*) AS total FROM tapphim WHERE upload_status IN ('pending', 'uploading', 'uploaded', 'processing')"),
    pool.execute(`
      SELECT id, ten_dang_nhap, email, ho_ten, hinh_dai_dien, vai_tro, trang_thai, ngay_tao
      FROM tai_khoan
      WHERE deleted_at IS NULL
      ORDER BY ngay_tao DESC, id DESC
      LIMIT 5
    `),
    pool.execute(`
      SELECT p.MaPhim, p.TenPhim, p.NamPhatHanh, ${resolvedViews} AS LuotXem, p.TinhTrang, p.HinhAnh, p.HinhAnhBanner, p.is_published,
             p.NgayTao, p.NgayCapNhat,
             GROUP_CONCAT(tl.TenTheLoai ORDER BY tl.TenTheLoai SEPARATOR ', ') AS TheLoai
      FROM phim p
      ${viewStatsJoin}
      LEFT JOIN phim_theloai ptl ON ptl.MaPhim = p.MaPhim
      LEFT JOIN theloai tl ON tl.MaTheLoai = ptl.MaTheLoai
      WHERE p.deleted_at IS NULL
      GROUP BY p.MaPhim
      ORDER BY COALESCE(p.NgayCapNhat, p.NgayTao) DESC, p.MaPhim DESC
      LIMIT 5
    `),
    pool.execute(`
      SELECT p.MaPhim, p.TenPhim, p.HinhAnh, p.HinhAnhBanner, ${resolvedViews} AS LuotXem
      FROM phim p
      ${viewStatsJoin}
      WHERE p.deleted_at IS NULL
      ORDER BY ${resolvedViews} DESC, p.MaPhim DESC
      LIMIT 5
    `),
    pool.execute(`
      SELECT t.MaTap, t.MaPhim, t.TenTap, t.upload_status, t.duration, t.updated_at, p.TenPhim
      FROM tapphim t
      LEFT JOIN phim p ON p.MaPhim = t.MaPhim
      WHERE t.upload_status <> 'deleted' AND p.deleted_at IS NULL
      ORDER BY FIELD(t.upload_status, 'processing', 'pending', 'failed', 'ready'), t.updated_at DESC, t.MaTap DESC
      LIMIT 5
    `),
    pool.execute(`
      SELECT bl.MaBinhLuan, bl.TenDN, bl.MaPhim, bl.NoiDung, bl.ThoiGian, p.TenPhim
      FROM binhluan bl
      LEFT JOIN phim p ON p.MaPhim = bl.MaPhim
      WHERE bl.TrangThai = 'visible'
      ORDER BY bl.ThoiGian DESC, bl.MaBinhLuan DESC
      LIMIT 5
    `),
    pool.execute(`
      SELECT dg.TenDN, dg.MaPhim, dg.SoDiem, dg.BinhLuan, dg.ThoiGian, p.TenPhim
      FROM danhgia dg
      LEFT JOIN phim p ON p.MaPhim = dg.MaPhim
      ORDER BY dg.ThoiGian DESC
      LIMIT 5
    `),
    pool.execute(chartQueryForPeriod(chartPeriod))
  ]);

  const chart = buildChart(chartPeriod, chartRows[0]);

  const activity = [
    ...recentMovies[0].slice(0, 3).map((movie) => ({
      type: 'movie',
      message: `Đã cập nhật phim ${movie.TenPhim}`,
      time: movie.NgayCapNhat || movie.NgayTao
    })),
    ...recentComments[0].slice(0, 3).map((comment) => ({
      type: 'comment',
      message: `${comment.TenDN || 'Người dùng'} bình luận phim ${comment.TenPhim || `#${comment.MaPhim}`}`,
      time: comment.ThoiGian
    })),
    ...recentRatings[0].slice(0, 2).map((rating) => ({
      type: 'rating',
      message: `${rating.TenDN || 'Người dùng'} đánh giá ${rating.SoDiem} sao cho ${rating.TenPhim || `#${rating.MaPhim}`}`,
      time: rating.ThoiGian
    })),
    ...recentUsers[0].slice(0, 2).map((user) => ({
      type: 'user',
      message: `${user.ten_dang_nhap} đã đăng ký tài khoản`,
      time: user.ngay_tao
    }))
  ]
    .filter((item) => item.time)
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 6);

  return {
    metrics: {
      users: userTotal,
      movies: movieTotal,
      totalViews,
      genres: genreTotal,
      episodes: episodeTotal,
      todayViews,
      comments: commentTotal,
      ratings: ratingTotal,
      processing: processingTotal,
      revenue: 0
    },
    chartPeriod,
    chart,
    topMovies: topMovies[0],
    recentMovies: recentMovies[0],
    processingEpisodes: processingEpisodes[0],
    recentUsers: recentUsers[0],
    recentComments: recentComments[0],
    recentRatings: recentRatings[0],
    activity,
    system: [
      { name: 'Database', status: 'Hoạt động' },
      { name: 'API Server', status: 'Hoạt động' },
      { name: 'Upload Service', status: processingTotal > 0 ? 'Đang xử lý' : 'Sẵn sàng' },
      { name: 'Streaming HLS', status: 'Sẵn sàng' }
    ]
  };
}

module.exports = {
  listDashboard
};
