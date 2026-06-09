const { pool } = require('../config/database');

async function list(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const offset = (page - 1) * limit;
    const movieId = req.query.movieId ? Number(req.query.movieId) : null;
    const search = req.query.search || '';
    const params = {
      limit,
      offset,
      movieId,
      search,
      likeSearch: `%${search}%`
    };
    const where = [
      "bl.TrangThai = 'visible'",
      '(:movieId IS NULL OR bl.MaPhim = :movieId)',
      "(:search = '' OR bl.NoiDung LIKE :likeSearch OR bl.TenDN LIKE :likeSearch OR p.TenPhim LIKE :likeSearch)"
    ].join(' AND ');

    const [rows] = await pool.execute(
      `
        SELECT bl.MaBinhLuan, bl.TenDN, bl.MaPhim, bl.NoiDung, bl.ThoiGian, bl.parent_id, p.TenPhim
        FROM binhluan bl
        LEFT JOIN phim p ON p.MaPhim = bl.MaPhim
        WHERE ${where}
        ORDER BY bl.ThoiGian DESC, bl.MaBinhLuan DESC
        LIMIT :limit OFFSET :offset
      `,
      params
    );
    const [countRows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM binhluan bl
        LEFT JOIN phim p ON p.MaPhim = bl.MaPhim
        WHERE ${where}
      `,
      params
    );

    res.json({
      success: true,
      data: rows,
      meta: {
        page,
        limit,
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list
};
