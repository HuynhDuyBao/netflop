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
      '(:movieId IS NULL OR dg.MaPhim = :movieId)',
      "(:search = '' OR dg.BinhLuan LIKE :likeSearch OR dg.TenDN LIKE :likeSearch OR p.TenPhim LIKE :likeSearch)"
    ].join(' AND ');

    const [rows] = await pool.execute(
      `
        SELECT dg.TenDN, dg.MaPhim, dg.SoDiem, dg.BinhLuan, dg.ThoiGian, p.TenPhim
        FROM danhgia dg
        LEFT JOIN phim p ON p.MaPhim = dg.MaPhim
        WHERE ${where}
        ORDER BY dg.ThoiGian DESC
        LIMIT :limit OFFSET :offset
      `,
      params
    );
    const [countRows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM danhgia dg
        LEFT JOIN phim p ON p.MaPhim = dg.MaPhim
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
