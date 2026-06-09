const { pool } = require('../config/database');

async function attachPlaybackAssets(episodes) {
  if (!episodes.length) return episodes;

  const episodeIds = episodes.map((episode) => Number(episode.MaTap)).filter(Boolean);
  const placeholders = episodeIds.map(() => '?').join(', ');
  const [subtitles] = await pool.query(
    `SELECT * FROM phu_de WHERE MaTap IN (${placeholders}) ORDER BY MacDinh DESC, MaPhuDe ASC`,
    episodeIds
  );
  return episodes.map((episode) => ({
    ...episode,
    subtitles: subtitles.filter((subtitle) => Number(subtitle.MaTap) === Number(episode.MaTap))
  }));
}

module.exports = {
  list: async ({ movieId = null } = {}) => {
    const params = {};
    const where = [];

    if (movieId) {
      where.push('t.MaPhim = :movieId');
      params.movieId = movieId;
    }

    const [rows] = await pool.execute(
      `
        SELECT t.*, p.TenPhim
        FROM tapphim t
        LEFT JOIN phim p ON p.MaPhim = t.MaPhim
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY t.MaPhim DESC, t.MaTap ASC
      `,
      params
    );

    return attachPlaybackAssets(rows);
  },
  listByMovieId: async (movieId) => {
    const [rows] = await pool.query('SELECT * FROM tapphim WHERE MaPhim = ?', [movieId]);
    return attachPlaybackAssets(rows);
  },
  create: async ({ movieId, title, sourceUrl, hlsUrl, cloudFrontUrl, uploadStatus = 'ready', duration }) => {
    const [result] = await pool.execute(
      `
        INSERT INTO tapphim (MaPhim, TenTap, Link, hls_url, cloudfront_url, upload_status, duration, created_at, updated_at)
        VALUES (:movieId, :title, :sourceUrl, :hlsUrl, :cloudFrontUrl, :uploadStatus, :duration, NOW(), NOW())
      `,
      {
        movieId,
        title,
        sourceUrl: sourceUrl || null,
        hlsUrl: hlsUrl || null,
        cloudFrontUrl: cloudFrontUrl || null,
        uploadStatus,
        duration: duration || null
      }
    );

    const [rows] = await pool.execute('SELECT * FROM tapphim WHERE MaTap = :id LIMIT 1', { id: result.insertId });
    return rows[0];
  },
  update: async (id, { movieId, title, sourceUrl, hlsUrl, cloudFrontUrl, uploadStatus, duration }) => {
    await pool.execute(
      `
        UPDATE tapphim
        SET MaPhim = :movieId,
            TenTap = :title,
            Link = :sourceUrl,
            hls_url = :hlsUrl,
            cloudfront_url = :cloudFrontUrl,
            upload_status = :uploadStatus,
            duration = :duration,
            updated_at = NOW()
        WHERE MaTap = :id
      `,
      {
        id,
        movieId,
        title,
        sourceUrl: sourceUrl || null,
        hlsUrl: hlsUrl || null,
        cloudFrontUrl: cloudFrontUrl || null,
        uploadStatus,
        duration: duration || null
      }
    );

    const [rows] = await pool.execute('SELECT * FROM tapphim WHERE MaTap = :id LIMIT 1', { id });
    return rows[0] || null;
  },
  remove: async (id) => {
    const [result] = await pool.execute('DELETE FROM tapphim WHERE MaTap = :id', { id });
    return result.affectedRows > 0;
  },
  createSubtitle: async (episodeId, { languageCode, languageName, format, url, isDefault }) => {
    if (isDefault) {
      await pool.execute('UPDATE phu_de SET MacDinh = 0 WHERE MaTap = :episodeId', { episodeId });
    }

    const [result] = await pool.execute(
      `
        INSERT INTO phu_de (MaTap, MaNgonNgu, TenNgonNgu, DinhDang, LinkPhuDe, MacDinh)
        VALUES (:episodeId, :languageCode, :languageName, :format, :url, :isDefault)
      `,
      {
        episodeId,
        languageCode,
        languageName,
        format,
        url,
        isDefault: isDefault ? 1 : 0
      }
    );
    const [rows] = await pool.execute('SELECT * FROM phu_de WHERE MaPhuDe = :id', { id: result.insertId });
    return rows[0];
  },
  removeSubtitle: async (episodeId, subtitleId) => {
    const [result] = await pool.execute(
      'DELETE FROM phu_de WHERE MaPhuDe = :subtitleId AND MaTap = :episodeId',
      { episodeId, subtitleId }
    );
    return result.affectedRows > 0;
  },
  createUploadEpisode: async ({ movieId, name, sourceUrl, hlsUrl, cloudFrontUrl, uploadStatus, duration }) => {
    const [result] = await pool.execute(
      `
        INSERT INTO tapphim (MaPhim, TenTap, Link, hls_url, cloudfront_url, upload_status, duration, created_at, updated_at)
        VALUES (:movieId, :name, :sourceUrl, :hlsUrl, :cloudFrontUrl, :uploadStatus, :duration, NOW(), NOW())
      `,
      {
        movieId,
        name,
        sourceUrl,
        hlsUrl,
        cloudFrontUrl,
        uploadStatus,
        duration: duration || null
      }
    );

    const [rows] = await pool.execute('SELECT * FROM tapphim WHERE MaTap = :id LIMIT 1', { id: result.insertId });
    return rows[0];
  },
  attachPlaybackAssets
};
