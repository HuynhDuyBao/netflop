const { pool } = require('../config/database');
const HttpError = require('../utils/httpError');

async function getActorById(id) {
  const [actorRows] = await pool.execute(
    `
      SELECT MaDienVien, tmdb_id, TenDienVien, slug, NgaySinh, NgayMat,
             GioiTinh, TieuSu, HinhAnh
      FROM dienvien
      WHERE MaDienVien = :id
      LIMIT 1
    `,
    { id }
  );
  const actor = actorRows[0];

  if (!actor) {
    throw new HttpError(404, 'Không tìm thấy diễn viên.');
  }

  const [movies] = await pool.execute(
    `
      SELECT p.MaPhim, p.TenPhim, p.TieuDe, p.MoTa, p.NoiDung, p.NamPhatHanh,
             p.ThoiLuong, p.DanhGia, p.LuotXem, p.TinhTrang, p.PhanLoai,
             p.HinhAnh, p.HinhAnhBanner, p.TrailerURL AS Link,
             p.TrailerYoutubeKey, p.Link AS VideoUrl, p.hls_master_url,
             p.cloudfront_base_url, pdv.TenNhanVat
      FROM phim_dienvien pdv
      INNER JOIN phim p ON p.MaPhim = pdv.MaPhim
      WHERE pdv.MaDienVien = :id
        AND p.is_published = 1
        AND p.deleted_at IS NULL
      ORDER BY COALESCE(p.published_at, p.NgayTao) DESC, p.MaPhim DESC
    `,
    { id }
  );

  return {
    actor,
    movies
  };
}

module.exports = {
  getActorById
};
