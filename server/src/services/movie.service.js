const { pool } = require('../config/database');
const HttpError = require('../utils/httpError');

const movieFields = `
  p.MaPhim,
  p.TenPhim,
  p.TieuDe,
  p.MoTa,
  p.NoiDung,
  p.ThoiLuong,
  p.NamPhatHanh,
  p.DanhGia,
  p.LuotXem,
  p.TinhTrang,
  p.PhanLoai,
  p.HinhAnh,
  p.HinhAnhBanner,
  p.Link,
  p.NgayTao,
  p.NgayCapNhat,
  p.MaQuocGia,
  p.cloudfront_base_url,
  p.hls_master_url,
  p.aws_status,
  p.is_published,
  p.published_at,
  qg.TenQuocGia
`;

const publicMovieWhere = 'p.is_published = 1';

function mapMovie(row) {
  if (!row) {
    return null;
  }

  return {
    MaPhim: row.MaPhim,
    TenPhim: row.TenPhim,
    TieuDe: row.TieuDe,
    MoTa: row.MoTa,
    NoiDung: row.NoiDung,
    ThoiLuong: row.ThoiLuong,
    NamPhatHanh: row.NamPhatHanh,
    DanhGia: row.DanhGia,
    LuotXem: row.LuotXem,
    TinhTrang: row.TinhTrang,
    PhanLoai: row.PhanLoai,
    HinhAnh: row.HinhAnh,
    HinhAnhBanner: row.HinhAnhBanner,
    Link: row.Link,
    NgayTao: row.NgayTao,
    NgayCapNhat: row.NgayCapNhat,
    MaQuocGia: row.MaQuocGia,
    TenQuocGia: row.TenQuocGia,
    cloudfront_base_url: row.cloudfront_base_url,
    hls_master_url: row.hls_master_url,
    aws_status: row.aws_status,
    is_published: Boolean(row.is_published),
    published_at: row.published_at
  };
}

function buildMovieFilters(filters = {}, publicOnly = true) {
  const where = publicOnly ? [publicMovieWhere] : ['1 = 1'];
  const params = {};

  if (filters.search) {
    where.push('(p.TenPhim LIKE :search OR p.TieuDe LIKE :search OR p.MoTa LIKE :search)');
    params.search = `%${filters.search}%`;
  }

  if (filters.genreId) {
    where.push('EXISTS (SELECT 1 FROM phim_theloai ptl WHERE ptl.MaPhim = p.MaPhim AND ptl.MaTheLoai = :genreId)');
    params.genreId = filters.genreId;
  }

  if (filters.countryId) {
    where.push('p.MaQuocGia = :countryId');
    params.countryId = filters.countryId;
  }

  if (filters.year) {
    where.push('p.NamPhatHanh = :year');
    params.year = filters.year;
  }

  if (filters.type) {
    where.push('p.PhanLoai = :type');
    params.type = filters.type;
  }

  if (filters.status) {
    where.push('p.TinhTrang = :status');
    params.status = filters.status;
  }

  return {
    sql: where.join(' AND '),
    params
  };
}

function getSortSql(sort) {
  const sortMap = {
    latest: 'COALESCE(p.published_at, p.NgayTao) DESC, p.MaPhim DESC',
    popular: 'COALESCE(p.LuotXem, 0) DESC, p.MaPhim DESC',
    rating: 'COALESCE(p.DanhGia, 0) DESC, p.MaPhim DESC',
    year: 'COALESCE(p.NamPhatHanh, 0) DESC, p.MaPhim DESC'
  };

  return sortMap[sort] || sortMap.latest;
}

async function listMovies({ page = 1, limit = 20, sort = 'latest', publicOnly = true, ...filters }) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const built = buildMovieFilters(filters, publicOnly);

  const [rows] = await pool.execute(
    `
      SELECT ${movieFields}
      FROM phim p
      LEFT JOIN quocgia qg ON qg.MaQuocGia = p.MaQuocGia
      WHERE ${built.sql}
      ORDER BY ${getSortSql(sort)}
      LIMIT :limit OFFSET :offset
    `,
    { ...built.params, limit: safeLimit, offset }
  );

  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM phim p
      WHERE ${built.sql}
    `,
    built.params
  );

  return {
    data: rows.map(mapMovie),
    meta: {
      page: safePage,
      limit: safeLimit,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / safeLimit)
    }
  };
}

async function getMovieById(id, userId = null) {
  const [rows] = await pool.execute(
    `
      SELECT ${movieFields}
      FROM phim p
      LEFT JOIN quocgia qg ON qg.MaQuocGia = p.MaQuocGia
      WHERE p.MaPhim = :id AND ${publicMovieWhere}
      LIMIT 1
    `,
    { id }
  );

  const movie = mapMovie(rows[0]);

  if (!movie) {
    throw new HttpError(404, 'Khong tim thay phim.');
  }

  const [genres] = await pool.execute(
    `
      SELECT tl.MaTheLoai, tl.TenTheLoai
      FROM theloai tl
      INNER JOIN phim_theloai ptl ON ptl.MaTheLoai = tl.MaTheLoai
      WHERE ptl.MaPhim = :id
      ORDER BY tl.TenTheLoai ASC
    `,
    { id }
  );

  const [episodes] = await pool.execute(
    `
      SELECT MaTap, MaPhim, TenTap, Link, hls_url, cloudfront_url, upload_status, duration, created_at, updated_at
      FROM tapphim
      WHERE MaPhim = :id AND upload_status <> 'deleted'
      ORDER BY MaTap ASC
    `,
    { id }
  );

  const [actors] = await pool.execute(
    `
      SELECT dv.MaDienVien, dv.TenDienVien, dv.NgaySinh, dv.MaQuocGia, dv.TieuSu, dv.HinhAnh, qg.TenQuocGia
      FROM dienvien dv
      INNER JOIN phim_dienvien pdv ON pdv.MaDienVien = dv.MaDienVien
      LEFT JOIN quocgia qg ON qg.MaQuocGia = dv.MaQuocGia
      WHERE pdv.MaPhim = :id
      ORDER BY dv.TenDienVien ASC
    `,
    { id }
  );

  const [directors] = await pool.execute(
    `
      SELECT dd.MaDaoDien, dd.TenDaoDien, dd.NgaySinh, dd.MaQuocGia, dd.TieuSu, dd.HinhAnh, qg.TenQuocGia
      FROM daodien dd
      INNER JOIN phim_daodien pdd ON pdd.MaDaoDien = dd.MaDaoDien
      LEFT JOIN quocgia qg ON qg.MaQuocGia = dd.MaQuocGia
      WHERE pdd.MaPhim = :id
      ORDER BY dd.TenDaoDien ASC
    `,
    { id }
  );

  let isFavorite = false;

  if (userId) {
    const [favoriteRows] = await pool.execute(
      `
        SELECT id
        FROM phim_yeuthich
        WHERE MaPhim = :id AND UserID = :userId
        LIMIT 1
      `,
      { id, userId }
    );
    isFavorite = favoriteRows.length > 0;
  }

  return {
    ...movie,
    the_loai: genres,
    dien_vien: actors,
    dao_dien: directors,
    tap_phim: episodes,
    isFavorite
  };
}

async function getAdminMovieById(id) {
  const [rows] = await pool.execute(
    `
      SELECT ${movieFields}
      FROM phim p
      LEFT JOIN quocgia qg ON qg.MaQuocGia = p.MaQuocGia
      WHERE p.MaPhim = :id
      LIMIT 1
    `,
    { id }
  );

  const movie = mapMovie(rows[0]);

  if (!movie) {
    throw new HttpError(404, 'Khong tim thay phim.');
  }

  const [genres] = await pool.execute(
    `
      SELECT tl.MaTheLoai, tl.TenTheLoai
      FROM theloai tl
      INNER JOIN phim_theloai ptl ON ptl.MaTheLoai = tl.MaTheLoai
      WHERE ptl.MaPhim = :id
      ORDER BY tl.TenTheLoai ASC
    `,
    { id }
  );

  const [actors] = await pool.execute(
    `
      SELECT dv.MaDienVien, dv.TenDienVien, dv.NgaySinh, dv.MaQuocGia, dv.TieuSu, dv.HinhAnh, qg.TenQuocGia
      FROM dienvien dv
      INNER JOIN phim_dienvien pdv ON pdv.MaDienVien = dv.MaDienVien
      LEFT JOIN quocgia qg ON qg.MaQuocGia = dv.MaQuocGia
      WHERE pdv.MaPhim = :id
      ORDER BY dv.TenDienVien ASC
    `,
    { id }
  );

  const [directors] = await pool.execute(
    `
      SELECT dd.MaDaoDien, dd.TenDaoDien, dd.NgaySinh, dd.MaQuocGia, dd.TieuSu, dd.HinhAnh, qg.TenQuocGia
      FROM daodien dd
      INNER JOIN phim_daodien pdd ON pdd.MaDaoDien = dd.MaDaoDien
      LEFT JOIN quocgia qg ON qg.MaQuocGia = dd.MaQuocGia
      WHERE pdd.MaPhim = :id
      ORDER BY dd.TenDaoDien ASC
    `,
    { id }
  );

  return {
    ...movie,
    the_loai: genres,
    dien_vien: actors,
    dao_dien: directors
  };
}

async function syncMovieGenres(connection, movieId, genreIds = []) {
  await connection.execute(
    `
      DELETE FROM phim_theloai
      WHERE MaPhim = :movieId
    `,
    { movieId }
  );

  const uniqueGenreIds = [...new Set((genreIds || []).map(Number).filter(Boolean))];

  for (const genreId of uniqueGenreIds) {
    await connection.execute(
      `
        INSERT INTO phim_theloai (MaPhim, MaTheLoai)
        VALUES (:movieId, :genreId)
      `,
      { movieId, genreId }
    );
  }
}

async function syncMoviePeople(connection, movieId, table, idColumn, ids = []) {
  await connection.execute(
    `
      DELETE FROM ${table}
      WHERE MaPhim = :movieId
    `,
    { movieId }
  );

  const uniqueIds = [...new Set((ids || []).map(Number).filter(Boolean))];

  for (const id of uniqueIds) {
    await connection.execute(
      `
        INSERT INTO ${table} (MaPhim, ${idColumn})
        VALUES (:movieId, :id)
      `,
      { movieId, id }
    );
  }
}

async function createMovie(payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const isPublished = Boolean(payload.isPublished);
    const [result] = await connection.execute(
      `
        INSERT INTO phim (
          TenPhim, TieuDe, MoTa, NoiDung, ThoiLuong, NamPhatHanh, DanhGia, LuotXem,
          TinhTrang, PhanLoai, HinhAnh, HinhAnhBanner, Link, MaQuocGia,
          hls_master_url, is_published, published_at
        )
        VALUES (
          :name, :title, :description, :content, :duration, :year, :rating, :views,
          :status, :type, :poster, :banner, :link, :countryId,
          :hlsMasterUrl, :isPublished, :publishedAt
        )
      `,
      {
        name: payload.name,
        title: payload.title || null,
        description: payload.description || null,
        content: payload.content || null,
        duration: payload.duration || null,
        year: payload.year || null,
        rating: payload.rating ?? 0,
        views: payload.views ?? 0,
        status: payload.status || 'Đang chiếu',
        type: payload.type || 'Lẻ',
        poster: payload.poster || null,
        banner: payload.banner || null,
        link: payload.link || null,
        countryId: payload.countryId || null,
        hlsMasterUrl: payload.hlsMasterUrl || null,
        isPublished,
        publishedAt: isPublished ? new Date() : null
      }
    );

    await syncMovieGenres(connection, result.insertId, payload.genreIds);
    await syncMoviePeople(connection, result.insertId, 'phim_dienvien', 'MaDienVien', payload.actorIds);
    await syncMoviePeople(connection, result.insertId, 'phim_daodien', 'MaDaoDien', payload.directorIds);
    await connection.commit();

    return getAdminMovieById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateMovie(id, payload) {
  await getAdminMovieById(id);

  const columnMap = {
    name: 'TenPhim',
    title: 'TieuDe',
    description: 'MoTa',
    content: 'NoiDung',
    duration: 'ThoiLuong',
    year: 'NamPhatHanh',
    rating: 'DanhGia',
    views: 'LuotXem',
    status: 'TinhTrang',
    type: 'PhanLoai',
    poster: 'HinhAnh',
    banner: 'HinhAnhBanner',
    link: 'Link',
    countryId: 'MaQuocGia',
    hlsMasterUrl: 'hls_master_url',
    isPublished: 'is_published'
  };

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const sets = [];
    const params = { id };

    for (const [key, column] of Object.entries(columnMap)) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        sets.push(`${column} = :${key}`);
        params[key] = payload[key] === undefined ? null : payload[key];
      }
    }

    if (payload.isPublished === true) {
      sets.push('published_at = COALESCE(published_at, NOW())');
    } else if (payload.isPublished === false) {
      sets.push('published_at = NULL');
    }

    if (sets.length > 0) {
      await connection.execute(
        `
          UPDATE phim
          SET ${sets.join(', ')}
          WHERE MaPhim = :id
        `,
        params
      );
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'genreIds')) {
      await syncMovieGenres(connection, id, payload.genreIds);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'actorIds')) {
      await syncMoviePeople(connection, id, 'phim_dienvien', 'MaDienVien', payload.actorIds);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'directorIds')) {
      await syncMoviePeople(connection, id, 'phim_daodien', 'MaDaoDien', payload.directorIds);
    }

    await connection.commit();
    return getAdminMovieById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deleteMovie(id) {
  const [result] = await pool.execute(
    `
      DELETE FROM phim
      WHERE MaPhim = :id
    `,
    { id }
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Khong tim thay phim.');
  }
}

async function listEpisodes(movieId) {
  await getMovieById(movieId);

  const [rows] = await pool.execute(
    `
      SELECT MaTap, MaPhim, TenTap, Link, hls_url, cloudfront_url, upload_status, duration, created_at, updated_at
      FROM tapphim
      WHERE MaPhim = :movieId AND upload_status <> 'deleted'
      ORDER BY MaTap ASC
    `,
    { movieId }
  );

  return rows;
}

async function listAdminEpisodes({ movieId = null, page = 1, limit = 50 }) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const where = ['tp.upload_status <> "deleted"'];
  const params = { limit: safeLimit, offset };

  if (movieId) {
    where.push('tp.MaPhim = :movieId');
    params.movieId = Number(movieId);
  }

  const [rows] = await pool.execute(
    `
      SELECT
        tp.MaTap, tp.MaPhim, tp.TenTap, tp.Link, tp.original_file, tp.hls_url,
        tp.cloudfront_url, tp.status, tp.duration, tp.upload_status,
        tp.error_message, tp.file_size_bytes, tp.created_at, tp.updated_at,
        p.TenPhim
      FROM tapphim tp
      LEFT JOIN phim p ON p.MaPhim = tp.MaPhim
      WHERE ${where.join(' AND ')}
      ORDER BY tp.MaTap DESC
      LIMIT :limit OFFSET :offset
    `,
    params
  );

  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM tapphim tp
      WHERE ${where.join(' AND ')}
    `,
    params
  );

  return {
    data: rows,
    meta: {
      page: safePage,
      limit: safeLimit,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / safeLimit)
    }
  };
}

async function getAdminEpisodeById(id) {
  const [rows] = await pool.execute(
    `
      SELECT
        tp.MaTap, tp.MaPhim, tp.TenTap, tp.Link, tp.original_file, tp.hls_url,
        tp.cloudfront_url, tp.status, tp.duration, tp.upload_status,
        tp.error_message, tp.file_size_bytes, tp.created_at, tp.updated_at,
        p.TenPhim
      FROM tapphim tp
      LEFT JOIN phim p ON p.MaPhim = tp.MaPhim
      WHERE tp.MaTap = :id AND tp.upload_status <> 'deleted'
      LIMIT 1
    `,
    { id }
  );

  if (!rows[0]) {
    throw new HttpError(404, 'Khong tim thay tap phim.');
  }

  return rows[0];
}

async function createEpisode(payload) {
  await getAdminMovieById(payload.movieId);

  const [result] = await pool.execute(
    `
      INSERT INTO tapphim (
        MaPhim, TenTap, Link, original_file, hls_url, cloudfront_url,
        status, duration, upload_status
      )
      VALUES (
        :movieId, :name, :link, :originalFile, :hlsUrl, :cloudfrontUrl,
        :status, :duration, :uploadStatus
      )
    `,
    {
      movieId: payload.movieId,
      name: payload.name || null,
      link: payload.link || null,
      originalFile: payload.originalFile || null,
      hlsUrl: payload.hlsUrl || null,
      cloudfrontUrl: payload.cloudfrontUrl || null,
      status: payload.status || 'active',
      duration: payload.duration || null,
      uploadStatus: payload.uploadStatus || 'ready'
    }
  );

  return getAdminEpisodeById(result.insertId);
}

async function updateEpisode(id, payload) {
  await getAdminEpisodeById(id);

  if (payload.movieId) {
    await getAdminMovieById(payload.movieId);
  }

  const columnMap = {
    movieId: 'MaPhim',
    name: 'TenTap',
    link: 'Link',
    originalFile: 'original_file',
    hlsUrl: 'hls_url',
    cloudfrontUrl: 'cloudfront_url',
    status: 'status',
    duration: 'duration',
    uploadStatus: 'upload_status'
  };
  const sets = [];
  const params = { id };

  for (const [key, column] of Object.entries(columnMap)) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      sets.push(`${column} = :${key}`);
      params[key] = payload[key] === undefined ? null : payload[key];
    }
  }

  if (sets.length > 0) {
    await pool.execute(
      `
        UPDATE tapphim
        SET ${sets.join(', ')}
        WHERE MaTap = :id
      `,
      params
    );
  }

  return getAdminEpisodeById(id);
}

async function deleteEpisode(id) {
  const [result] = await pool.execute(
    `
      UPDATE tapphim
      SET upload_status = 'deleted'
      WHERE MaTap = :id
    `,
    { id }
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Khong tim thay tap phim.');
  }
}

async function getAdminStats() {
  const [[movieRows], [episodeRows], [userRows], [genreRows], [countryRows], [commentRows], [favoriteRows], [viewRows], [latestRows]] = await Promise.all([
    pool.execute('SELECT COUNT(*) AS total, SUM(is_published = 1) AS published, COALESCE(SUM(LuotXem), 0) AS views FROM phim'),
    pool.execute("SELECT COUNT(*) AS total, SUM(upload_status = 'ready') AS ready FROM tapphim WHERE upload_status <> 'deleted'"),
    pool.execute("SELECT COUNT(*) AS total, SUM(vai_tro = 'admin') AS admins, SUM(trang_thai = 'active') AS active FROM tai_khoan"),
    pool.execute('SELECT COUNT(*) AS total FROM theloai'),
    pool.execute('SELECT COUNT(*) AS total FROM quocgia'),
    pool.execute('SELECT COUNT(*) AS total FROM binhluan'),
    pool.execute('SELECT COUNT(*) AS total FROM phim_yeuthich'),
    pool.execute('SELECT COALESCE(SUM(ThoiGianXem), 0) AS watchedSeconds FROM lichsu'),
    pool.execute(`
      SELECT MaPhim, TenPhim, LuotXem, DanhGia, NgayTao
      FROM phim
      ORDER BY MaPhim DESC
      LIMIT 6
    `)
  ]);

  return {
    movies: movieRows[0],
    episodes: episodeRows[0],
    users: userRows[0],
    genres: genreRows[0],
    countries: countryRows[0],
    comments: commentRows[0],
    favorites: favoriteRows[0],
    history: viewRows[0],
    latestMovies: latestRows
  };
}

async function addFavorite(movieId, userId) {
  await getMovieById(movieId);

  await pool.execute(
    `
      INSERT INTO phim_yeuthich (MaPhim, UserID, NgayThem)
      SELECT :movieId, :userId, NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM phim_yeuthich WHERE MaPhim = :movieId AND UserID = :userId
      )
    `,
    { movieId, userId }
  );
}

async function removeFavorite(movieId, userId) {
  await pool.execute(
    `
      DELETE FROM phim_yeuthich
      WHERE MaPhim = :movieId AND UserID = :userId
    `,
    { movieId, userId }
  );
}

async function listFavorites(userId, { page = 1, limit = 20 }) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.execute(
    `
      SELECT ${movieFields}, py.NgayThem
      FROM phim_yeuthich py
      INNER JOIN phim p ON p.MaPhim = py.MaPhim
      LEFT JOIN quocgia qg ON qg.MaQuocGia = p.MaQuocGia
      WHERE py.UserID = :userId AND ${publicMovieWhere}
      ORDER BY py.NgayThem DESC
      LIMIT :limit OFFSET :offset
    `,
    { userId, limit: safeLimit, offset }
  );

  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM phim_yeuthich py
      INNER JOIN phim p ON p.MaPhim = py.MaPhim
      WHERE py.UserID = :userId AND ${publicMovieWhere}
    `,
    { userId }
  );

  return {
    data: rows.map((row) => ({ ...mapMovie(row), NgayThem: row.NgayThem })),
    meta: {
      page: safePage,
      limit: safeLimit,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / safeLimit)
    }
  };
}

async function saveHistory({ user, movieId, episodeId = null, watchedSeconds = 0 }) {
  await getMovieById(movieId);

  await pool.execute(
    `
      INSERT INTO lichsu (UserID, TenDN, MaPhim, MaTap, ThoiGianXem, ThoiGian)
      VALUES (:userId, :username, :movieId, :episodeId, :watchedSeconds, NOW())
      ON DUPLICATE KEY UPDATE
        MaTap = VALUES(MaTap),
        ThoiGianXem = VALUES(ThoiGianXem),
        ThoiGian = VALUES(ThoiGian)
    `,
    {
      userId: user.id,
      username: user.ten_dang_nhap,
      movieId,
      episodeId,
      watchedSeconds
    }
  );
}

async function listHistory(user, { page = 1, limit = 20 }) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.execute(
    `
      SELECT ${movieFields}, ls.MaTap, ls.ThoiGianXem, ls.ThoiGian
      FROM lichsu ls
      INNER JOIN phim p ON p.MaPhim = ls.MaPhim
      LEFT JOIN quocgia qg ON qg.MaQuocGia = p.MaQuocGia
      WHERE ls.TenDN = :username AND ${publicMovieWhere}
      ORDER BY ls.ThoiGian DESC
      LIMIT :limit OFFSET :offset
    `,
    { username: user.ten_dang_nhap, limit: safeLimit, offset }
  );

  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM lichsu ls
      INNER JOIN phim p ON p.MaPhim = ls.MaPhim
      WHERE ls.TenDN = :username AND ${publicMovieWhere}
    `,
    { username: user.ten_dang_nhap }
  );

  return {
    data: rows.map((row) => ({
      ...mapMovie(row),
      MaTap: row.MaTap,
      ThoiGianXem: row.ThoiGianXem,
      ThoiGian: row.ThoiGian
    })),
    meta: {
      page: safePage,
      limit: safeLimit,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / safeLimit)
    }
  };
}

async function rateMovie({ user, movieId, score, comment = null }) {
  await getMovieById(movieId);

  await pool.execute(
    `
      INSERT INTO danhgia (TenDN, MaPhim, SoDiem, BinhLuan, ThoiGian)
      VALUES (:username, :movieId, :score, :comment, NOW())
      ON DUPLICATE KEY UPDATE
        SoDiem = VALUES(SoDiem),
        BinhLuan = VALUES(BinhLuan),
        ThoiGian = VALUES(ThoiGian)
    `,
    {
      username: user.ten_dang_nhap,
      movieId,
      score,
      comment
    }
  );

  await pool.execute(
    `
      UPDATE phim
      SET DanhGia = (
        SELECT ROUND(AVG(SoDiem), 1)
        FROM danhgia
        WHERE MaPhim = :movieId
      )
      WHERE MaPhim = :movieId
    `,
    { movieId }
  );
}

async function listComments(movieId, { page = 1, limit = 20 }) {
  await getMovieById(movieId);

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.execute(
    `
      SELECT MaBinhLuan, TenDN, MaPhim, NoiDung, ThoiGian, parent_id
      FROM binhluan
      WHERE MaPhim = :movieId
      ORDER BY ThoiGian DESC
      LIMIT :limit OFFSET :offset
    `,
    { movieId, limit: safeLimit, offset }
  );

  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM binhluan
      WHERE MaPhim = :movieId
    `,
    { movieId }
  );

  return {
    data: rows,
    meta: {
      page: safePage,
      limit: safeLimit,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / safeLimit)
    }
  };
}

async function createComment({ user, movieId, content, parentId = null }) {
  await getMovieById(movieId);

  const [result] = await pool.execute(
    `
      INSERT INTO binhluan (TenDN, MaPhim, NoiDung, ThoiGian, parent_id)
      VALUES (:username, :movieId, :content, NOW(), :parentId)
    `,
    {
      username: user.ten_dang_nhap,
      movieId,
      content,
      parentId
    }
  );

  const [rows] = await pool.execute(
    `
      SELECT MaBinhLuan, TenDN, MaPhim, NoiDung, ThoiGian, parent_id
      FROM binhluan
      WHERE MaBinhLuan = :id
      LIMIT 1
    `,
    { id: result.insertId }
  );

  return rows[0];
}

module.exports = {
  addFavorite,
  createComment,
  createEpisode,
  createMovie,
  deleteEpisode,
  deleteMovie,
  getAdminEpisodeById,
  getAdminMovieById,
  getAdminStats,
  getMovieById,
  listAdminEpisodes,
  listComments,
  listEpisodes,
  listFavorites,
  listHistory,
  listMovies,
  rateMovie,
  removeFavorite,
  saveHistory,
  updateEpisode,
  updateMovie
};
