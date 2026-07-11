const { pool } = require('../config/database');
const HttpError = require('../utils/httpError');
const slugify = require('../utils/slugify');

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
  p.TrailerURL AS Link,
  p.TrailerYoutubeKey,
  p.Link AS VideoUrl,
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

const publicMovieWhere = '(p.is_published = 1 OR p.is_published IS NULL)';

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
    TrailerYoutubeKey: row.TrailerYoutubeKey,
    VideoUrl: row.VideoUrl,
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
    where.push(`(
      p.TenPhim LIKE :search
      OR p.TieuDe LIKE :search
      OR p.MoTa LIKE :search
      OR EXISTS (
        SELECT 1
        FROM phim_dienvien pdv
        INNER JOIN dienvien dv ON dv.MaDienVien = pdv.MaDienVien
        WHERE pdv.MaPhim = p.MaPhim AND dv.TenDienVien LIKE :search
      )
      OR EXISTS (
        SELECT 1
        FROM phim_daodien pdd
        INNER JOIN daodien dd ON dd.MaDaoDien = pdd.MaDaoDien
        WHERE pdd.MaPhim = p.MaPhim AND dd.TenDaoDien LIKE :search
      )
    )`);
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

async function getMovieById(id, user = null) {
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
      SELECT MaTap, MaPhim, TenTap, Link, hls_url, cloudfront_url, thumbnail_url, upload_status, duration, created_at, updated_at
      FROM tapphim
      WHERE MaPhim = :id AND (upload_status IS NULL OR upload_status = 'ready')
      ORDER BY MaTap ASC
    `,
    { id }
  );

  const [cast] = await pool.execute(
    `
      SELECT dv.MaDienVien, dv.tmdb_id, dv.TenDienVien, dv.HinhAnh, pdv.TenNhanVat, pdv.ThuTuHienThi
      FROM phim_dienvien pdv
      INNER JOIN dienvien dv ON dv.MaDienVien = pdv.MaDienVien
      WHERE pdv.MaPhim = :id
      ORDER BY pdv.ThuTuHienThi ASC, dv.TenDienVien ASC
    `,
    { id }
  );

  const [directors] = await pool.execute(
    `
      SELECT dd.MaDaoDien, dd.tmdb_id, dd.TenDaoDien, dd.HinhAnh, pdd.VaiTro
      FROM phim_daodien pdd
      INNER JOIN daodien dd ON dd.MaDaoDien = pdd.MaDaoDien
      WHERE pdd.MaPhim = :id
      ORDER BY dd.TenDaoDien ASC
    `,
    { id }
  );

  let isFavorite = false;

  let userRating = null;

  if (user?.id) {
    const [favoriteRows] = await pool.execute(
      `
        SELECT MaPhim
        FROM phim_yeuthich
        WHERE MaPhim = :id AND UserID = :userId
        LIMIT 1
      `,
      { id, userId: user.id }
    );
    isFavorite = favoriteRows.length > 0;

    const [ratingRows] = await pool.execute(
      `
        SELECT SoDiem, BinhLuan, ThoiGian
        FROM danhgia
        WHERE MaPhim = :id AND (UserID = :userId OR TenDN = :username)
        ORDER BY ThoiGian DESC
        LIMIT 1
      `,
      { id, userId: user.id, username: user.ten_dang_nhap }
    );
    if (ratingRows.length > 0) {
      userRating = {
        score: ratingRows[0].SoDiem,
        comment: ratingRows[0].BinhLuan,
        updatedAt: ratingRows[0].ThoiGian
      };
    }
  }

  return {
    ...movie,
    the_loai: genres,
    tap_phim: episodes,
    dien_vien: cast,
    dao_dien: directors,
    isFavorite,
    userRating
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

  const [cast] = await pool.execute(
    `
      SELECT dv.MaDienVien, dv.tmdb_id, dv.TenDienVien, dv.HinhAnh, pdv.TenNhanVat, pdv.ThuTuHienThi
      FROM phim_dienvien pdv
      INNER JOIN dienvien dv ON dv.MaDienVien = pdv.MaDienVien
      WHERE pdv.MaPhim = :id
      ORDER BY pdv.ThuTuHienThi ASC, dv.TenDienVien ASC
    `,
    { id }
  );

  const [directors] = await pool.execute(
    `
      SELECT dd.MaDaoDien, dd.tmdb_id, dd.TenDaoDien, dd.HinhAnh, pdd.VaiTro
      FROM phim_daodien pdd
      INNER JOIN daodien dd ON dd.MaDaoDien = pdd.MaDaoDien
      WHERE pdd.MaPhim = :id
      ORDER BY dd.TenDaoDien ASC
    `,
    { id }
  );

  return {
    ...movie,
    the_loai: genres,
    dien_vien: cast,
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

async function upsertActor(connection, person) {
  const slug = slugify(person.name) || `actor-${person.tmdbId || Date.now()}`;

  await connection.execute(
    `
      INSERT INTO dienvien (tmdb_id, TenDienVien, slug, HinhAnh)
      VALUES (:tmdbId, :name, :slug, :profile)
      ON DUPLICATE KEY UPDATE
        TenDienVien = VALUES(TenDienVien),
        HinhAnh = COALESCE(VALUES(HinhAnh), HinhAnh)
    `,
    {
      tmdbId: person.tmdbId || null,
      name: person.name,
      slug,
      profile: person.profile || null
    }
  );

  const [rows] = await connection.execute(
    `
      SELECT MaDienVien
      FROM dienvien
      WHERE (:tmdbId IS NOT NULL AND tmdb_id = :tmdbId) OR slug = :slug
      LIMIT 1
    `,
    { tmdbId: person.tmdbId || null, slug }
  );

  return rows[0]?.MaDienVien;
}

async function upsertDirector(connection, person) {
  const slug = slugify(person.name) || `director-${person.tmdbId || Date.now()}`;

  await connection.execute(
    `
      INSERT INTO daodien (tmdb_id, TenDaoDien, slug, HinhAnh)
      VALUES (:tmdbId, :name, :slug, :profile)
      ON DUPLICATE KEY UPDATE
        TenDaoDien = VALUES(TenDaoDien),
        HinhAnh = COALESCE(VALUES(HinhAnh), HinhAnh)
    `,
    {
      tmdbId: person.tmdbId || null,
      name: person.name,
      slug,
      profile: person.profile || null
    }
  );

  const [rows] = await connection.execute(
    `
      SELECT MaDaoDien
      FROM daodien
      WHERE (:tmdbId IS NOT NULL AND tmdb_id = :tmdbId) OR slug = :slug
      LIMIT 1
    `,
    { tmdbId: person.tmdbId || null, slug }
  );

  return rows[0]?.MaDaoDien;
}

async function syncMoviePeople(connection, movieId, { cast = [], directors = [] } = {}) {
  await connection.execute('DELETE FROM phim_dienvien WHERE MaPhim = :movieId', { movieId });
  await connection.execute('DELETE FROM phim_daodien WHERE MaPhim = :movieId', { movieId });

  for (const [index, person] of cast.entries()) {
    if (!person?.name) continue;
    const actorId = await upsertActor(connection, person);
    if (!actorId) continue;

    await connection.execute(
      `
        INSERT INTO phim_dienvien (MaPhim, MaDienVien, TenNhanVat, ThuTuHienThi)
        VALUES (:movieId, :actorId, :character, :sortOrder)
      `,
      {
        movieId,
        actorId,
        character: person.character || null,
        sortOrder: index + 1
      }
    );
  }

  for (const person of directors) {
    if (!person?.name) continue;
    const directorId = await upsertDirector(connection, person);
    if (!directorId) continue;

    await connection.execute(
      `
        INSERT IGNORE INTO phim_daodien (MaPhim, MaDaoDien, VaiTro)
        VALUES (:movieId, :directorId, :job)
      `,
      {
        movieId,
        directorId,
        job: person.job || 'Director'
      }
    );
  }
}

function mapMovieStatus(status) {
  const value = String(status || '').toLowerCase();
  if (value.includes('upcoming') || value.includes('sap')) return 'upcoming';
  if (value.includes('ongoing') || value.includes('dang')) return 'ongoing';
  if (value.includes('cancel')) return 'cancelled';
  return 'completed';
}

function mapMovieType(type) {
  const value = String(type || '').toLowerCase();
  return value.includes('series') || value.includes('bo') ? 'series' : 'movie';
}

async function makeUniqueSlug(connection, name, ignoreId = null) {
  const base = slugify(name) || `movie-${Date.now()}`;
  let slug = base;
  let index = 1;

  while (true) {
    const [rows] = await connection.execute(
      `
        SELECT MaPhim AS id
        FROM phim
        WHERE slug = :slug AND (:ignoreId IS NULL OR MaPhim <> :ignoreId)
        LIMIT 1
      `,
      { slug, ignoreId }
    );

    if (rows.length === 0) return slug;
    index += 1;
    slug = `${base}-${index}`;
  }
}

async function createMovie(payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const isPublished = Boolean(payload.isPublished);
    const slug = await makeUniqueSlug(connection, payload.name);
    const [result] = await connection.execute(
      `
        INSERT INTO phim (
          tmdb_id, tmdb_type, tmdb_imported_at, TenPhim, TieuDe, slug, MoTa, NoiDung, ThoiLuong, NamPhatHanh,
          DanhGia, LuotXem, TinhTrang, PhanLoai, HinhAnh, HinhAnhBanner, TrailerURL,
          TrailerYoutubeKey, Link, MaQuocGia, hls_master_url, is_published, published_at
        )
        VALUES (
          :tmdbId, :tmdbType, :tmdbImportedAt, :name, :title, :slug, :description, :content, :duration, :year, :rating, :views,
          :status, :type, :poster, :banner, :link, :trailerKey,
          :videoUrl, :countryId, :hlsMasterUrl, :isPublished, :publishedAt
        )
      `,
      {
        tmdbId: payload.tmdbId || null,
        tmdbType: payload.tmdbType || payload.mediaType || 'movie',
        tmdbImportedAt: payload.tmdbId ? new Date() : null,
        name: payload.name,
        title: payload.title || null,
        slug,
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
        trailerKey: payload.trailerKey || null,
        videoUrl: payload.videoUrl || null,
        countryId: payload.countryId || null,
        hlsMasterUrl: payload.hlsMasterUrl || null,
        isPublished: isPublished ? 1 : 0,
        publishedAt: isPublished ? new Date() : null
      }
    );

    await syncMovieGenres(connection, result.insertId, payload.genreIds);
    await syncMoviePeople(connection, result.insertId, {
      cast: payload.cast || [],
      directors: payload.directors || []
    });
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
    tmdbId: 'tmdb_id',
    tmdbType: 'tmdb_type',
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
    link: 'TrailerURL',
    videoUrl: 'Link',
    trailerKey: 'TrailerYoutubeKey',
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

    if (Object.prototype.hasOwnProperty.call(payload, 'cast') || Object.prototype.hasOwnProperty.call(payload, 'directors')) {
      await syncMoviePeople(connection, id, {
        cast: payload.cast || [],
        directors: payload.directors || []
      });
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

  const episodeModel = require('../models/episode.model');
  const rows = await episodeModel.listByMovieId(movieId);
  return rows
    .filter((episode) => !episode.upload_status || episode.upload_status === 'ready')
    .sort((left, right) => Number(left.MaTap) - Number(right.MaTap));
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

async function recordView(movieId) {
  await getMovieById(movieId);

  await pool.execute(
    `
      UPDATE phim
      SET LuotXem = COALESCE(LuotXem, 0) + 1
      WHERE MaPhim = :movieId
    `,
    { movieId }
  );

  const [rows] = await pool.execute(
    `
      SELECT LuotXem
      FROM phim
      WHERE MaPhim = :movieId
      LIMIT 1
    `,
    { movieId }
  );

  return Number(rows[0]?.LuotXem || 0);
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
      INSERT INTO danhgia (TenDN, UserID, MaPhim, SoDiem, BinhLuan, ThoiGian)
      VALUES (:username, :userId, :movieId, :score, :comment, NOW())
      ON DUPLICATE KEY UPDATE
        UserID = VALUES(UserID),
        SoDiem = VALUES(SoDiem),
        BinhLuan = VALUES(BinhLuan),
        ThoiGian = VALUES(ThoiGian)
    `,
    {
      username: user.ten_dang_nhap,
      userId: user.id,
      movieId,
      score,
      comment
    }
  );

  await pool.execute(
    `
      UPDATE phim
      SET
        DanhGia = (
          SELECT ROUND(AVG(SoDiem), 1)
          FROM danhgia
          WHERE MaPhim = :movieId
        ),
        SoLuotDanhGia = (
          SELECT COUNT(*)
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
      SELECT bl.MaBinhLuan, bl.TenDN, bl.UserID, bl.MaPhim, bl.NoiDung, bl.ThoiGian,
             bl.parent_id, tk.hinh_dai_dien
      FROM binhluan bl
      LEFT JOIN tai_khoan tk ON tk.id = bl.UserID
      WHERE bl.MaPhim = :movieId
        AND bl.TrangThai = 'visible'
      ORDER BY
        COALESCE(bl.parent_id, bl.MaBinhLuan) DESC,
        CASE WHEN bl.parent_id IS NULL THEN 0 ELSE 1 END,
        bl.ThoiGian ASC
      LIMIT :limit OFFSET :offset
    `,
    { movieId, limit: safeLimit, offset }
  );

  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM binhluan
      WHERE MaPhim = :movieId
        AND TrangThai = 'visible'
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

  if (parentId) {
    const [parentRows] = await pool.execute(
      `
        SELECT MaBinhLuan
        FROM binhluan
        WHERE MaBinhLuan = :parentId
          AND MaPhim = :movieId
          AND parent_id IS NULL
          AND TrangThai = 'visible'
        LIMIT 1
      `,
      { parentId, movieId }
    );

    if (!parentRows.length) {
      throw new HttpError(404, 'Không tìm thấy bình luận để trả lời.');
    }
  }

  const [result] = await pool.execute(
    `
      INSERT INTO binhluan (TenDN, UserID, MaPhim, NoiDung, ThoiGian, parent_id, TrangThai)
      VALUES (:username, :userId, :movieId, :content, NOW(), :parentId, 'visible')
    `,
    {
      username: user.ten_dang_nhap,
      userId: user.id,
      movieId,
      content,
      parentId
    }
  );

  const [rows] = await pool.execute(
    `
      SELECT bl.MaBinhLuan, bl.TenDN, bl.UserID, bl.MaPhim, bl.NoiDung, bl.ThoiGian,
             bl.parent_id, tk.hinh_dai_dien
      FROM binhluan bl
      LEFT JOIN tai_khoan tk ON tk.id = bl.UserID
      WHERE bl.MaBinhLuan = :id
      LIMIT 1
    `,
    { id: result.insertId }
  );

  return rows[0];
}

async function deleteComment({ user, movieId, commentId }) {
  const [rows] = await pool.execute(
    `
      SELECT MaBinhLuan, UserID, TenDN, parent_id
      FROM binhluan
      WHERE MaBinhLuan = :commentId
        AND MaPhim = :movieId
        AND TrangThai = 'visible'
      LIMIT 1
    `,
    { commentId, movieId }
  );
  const comment = rows[0];

  if (!comment) {
    throw new HttpError(404, 'Không tìm thấy bình luận.');
  }

  const isAdmin = ['admin', 'super_admin'].includes(user.vai_tro);
  const isOwner = Number(comment.UserID) === Number(user.id) || comment.TenDN === user.ten_dang_nhap;
  if (!isAdmin && !isOwner) {
    throw new HttpError(403, 'Bạn không có quyền xóa bình luận này.');
  }

  await pool.execute(
    `
      UPDATE binhluan
      SET TrangThai = 'deleted'
      WHERE MaBinhLuan = :commentId OR parent_id = :commentId
    `,
    { commentId }
  );
}

module.exports = {
  addFavorite,
  createComment,
  deleteComment,
  createMovie,
  deleteMovie,
  getAdminMovieById,
  getMovieById,
  listComments,
  listEpisodes,
  listFavorites,
  listHistory,
  listMovies,
  rateMovie,
  recordView,
  removeFavorite,
  saveHistory,
  updateMovie
};
