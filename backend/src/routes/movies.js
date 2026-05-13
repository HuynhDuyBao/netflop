import { Router } from "express";
import { query } from "../config/db.js";

export const moviesRouter = Router();

moviesRouter.get("/", async (req, res) => {
  const rows = await query(
    `SELECT p.MaPhim, p.TenPhim, p.TieuDe, p.MoTa, p.ThoiLuong, p.NamPhatHanh,
            p.DanhGia, p.LuotXem, p.PhanLoai, p.HinhAnh, p.HinhAnhBanner,
            p.hls_master_url, p.is_published, q.TenQuocGia
     FROM phim p
     LEFT JOIN quocgia q ON q.MaQuocGia = p.MaQuocGia
     WHERE COALESCE(p.is_published, 1) = 1
     ORDER BY p.NgayCapNhat DESC, p.MaPhim DESC`
  );

  res.json(rows);
});

moviesRouter.get("/:id", async (req, res) => {
  const [movie] = await query(
    `SELECT p.*, q.TenQuocGia
     FROM phim p
     LEFT JOIN quocgia q ON q.MaQuocGia = p.MaQuocGia
     WHERE p.MaPhim = :id`,
    { id: req.params.id }
  );

  if (!movie) return res.status(404).json({ message: "Không tìm thấy phim." });

  const episodes = await query(
    `SELECT MaTap, MaPhim, TenTap, Link, hls_url, cloudfront_url, upload_status,
            mediaconvert_job_id, duration
     FROM tapphim
     WHERE MaPhim = :id
     ORDER BY MaTap ASC`,
    { id: req.params.id }
  );

  const genres = await query(
    `SELECT tl.MaTheLoai, tl.TenTheLoai
     FROM theloai tl
     INNER JOIN phim_theloai ptl ON ptl.MaTheLoai = tl.MaTheLoai
     WHERE ptl.MaPhim = :id`,
    { id: req.params.id }
  );

  res.json({ ...movie, episodes, genres });
});
