USE web_xem_phim;

CREATE OR REPLACE VIEW tai_khoan AS
SELECT
  id,
  username AS ten_dang_nhap,
  email,
  password_hash AS mat_khau,
  full_name AS ho_ten,
  avatar_url AS hinh_dai_dien,
  role AS vai_tro,
  status AS trang_thai,
  created_at AS ngay_tao,
  updated_at AS ngay_cap_nhat
FROM users;

CREATE OR REPLACE VIEW theloai AS
SELECT
  id AS MaTheLoai,
  name AS TenTheLoai,
  slug,
  description AS MoTa,
  is_active AS DangHoatDong,
  created_at AS NgayTao,
  updated_at AS NgayCapNhat
FROM genres;

CREATE OR REPLACE VIEW quocgia AS
SELECT
  id AS MaQuocGia,
  name AS TenQuocGia,
  code AS MaCode,
  created_at AS NgayTao
FROM countries;

CREATE OR REPLACE VIEW phim AS
SELECT
  id AS MaPhim,
  title AS TenPhim,
  original_title AS TieuDe,
  overview AS MoTa,
  content AS NoiDung,
  runtime_minutes AS ThoiLuong,
  release_year AS NamPhatHanh,
  rating_average AS DanhGia,
  view_count AS LuotXem,
  status AS TinhTrang,
  type AS PhanLoai,
  poster_url AS HinhAnh,
  backdrop_url AS HinhAnhBanner,
  trailer_url AS Link,
  created_at AS NgayTao,
  updated_at AS NgayCapNhat,
  country_id AS MaQuocGia,
  cloudfront_base_url,
  hls_master_url,
  aws_status,
  CASE WHEN publish_status = 'published' THEN 1 ELSE 0 END AS is_published,
  published_at
FROM movies
WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW phim_theloai AS
SELECT
  movie_id AS MaPhim,
  genre_id AS MaTheLoai
FROM movie_genres;

CREATE OR REPLACE VIEW tapphim AS
SELECT
  id AS MaTap,
  movie_id AS MaPhim,
  title AS TenTap,
  source_url AS Link,
  hls_master_url AS hls_url,
  cloudfront_url,
  upload_status,
  duration_seconds AS duration,
  created_at,
  updated_at
FROM episodes;

CREATE OR REPLACE VIEW binhluan AS
SELECT
  c.id AS MaBinhLuan,
  u.username AS TenDN,
  c.movie_id AS MaPhim,
  c.content AS NoiDung,
  c.created_at AS ThoiGian,
  c.parent_id
FROM comments c
LEFT JOIN users u ON u.id = c.user_id
WHERE c.status <> 'deleted';

CREATE OR REPLACE VIEW danhgia AS
SELECT
  u.username AS TenDN,
  r.movie_id AS MaPhim,
  r.score AS SoDiem,
  r.review AS BinhLuan,
  r.updated_at AS ThoiGian
FROM ratings r
LEFT JOIN users u ON u.id = r.user_id;

CREATE OR REPLACE VIEW phim_yeuthich AS
SELECT
  user_id AS UserID,
  movie_id AS MaPhim,
  created_at AS NgayThem
FROM favorites;

CREATE OR REPLACE VIEW lichsu AS
SELECT
  wh.id,
  wh.user_id AS UserID,
  u.username AS TenDN,
  wh.movie_id AS MaPhim,
  wh.episode_id AS MaTap,
  wh.watch_seconds AS ThoiGianXem,
  wh.last_watched_at AS ThoiGian
FROM watch_history wh
LEFT JOIN users u ON u.id = wh.user_id;
