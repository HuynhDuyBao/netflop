SET NAMES utf8mb4;

INSERT IGNORE INTO tai_khoan (ten_dang_nhap, email, mat_khau, ho_ten, vai_tro, trang_thai)
VALUES (
  'admin',
  'admin@netflop.local',
  '$2a$10$22wOanIrkOpik6W0KHKYbuNy/NHR9A3xNl8hJA1igOt7KDWv1HiTu',
  'Netflop Admin',
  'admin',
  'active'
);

INSERT IGNORE INTO quocgia (TenQuocGia)
VALUES ('United States'), ('Japan'), ('Việt Nam');

INSERT INTO theloai (TenTheLoai)
SELECT 'Animation' WHERE NOT EXISTS (SELECT 1 FROM theloai WHERE TenTheLoai = 'Animation');
INSERT INTO theloai (TenTheLoai)
SELECT 'Comedy' WHERE NOT EXISTS (SELECT 1 FROM theloai WHERE TenTheLoai = 'Comedy');
INSERT INTO theloai (TenTheLoai)
SELECT 'Anime' WHERE NOT EXISTS (SELECT 1 FROM theloai WHERE TenTheLoai = 'Anime');
INSERT INTO theloai (TenTheLoai)
SELECT 'Action' WHERE NOT EXISTS (SELECT 1 FROM theloai WHERE TenTheLoai = 'Action');
INSERT INTO theloai (TenTheLoai)
SELECT 'Drama' WHERE NOT EXISTS (SELECT 1 FROM theloai WHERE TenTheLoai = 'Drama');

INSERT INTO dienvien (TenDienVien, MaQuocGia, TieuSu)
SELECT 'Seth MacFarlane', qg.MaQuocGia, 'Creator and voice actor for Family Guy.'
FROM quocgia qg
WHERE qg.TenQuocGia = 'United States'
  AND NOT EXISTS (SELECT 1 FROM dienvien WHERE TenDienVien = 'Seth MacFarlane')
LIMIT 1;

INSERT INTO daodien (TenDaoDien, MaQuocGia, TieuSu)
SELECT 'Seth MacFarlane', qg.MaQuocGia, 'Creator of Family Guy.'
FROM quocgia qg
WHERE qg.TenQuocGia = 'United States'
  AND NOT EXISTS (SELECT 1 FROM daodien WHERE TenDaoDien = 'Seth MacFarlane')
LIMIT 1;

INSERT INTO phim (
  TenPhim, TieuDe, MoTa, NoiDung, ThoiLuong, NamPhatHanh, DanhGia, LuotXem,
  TinhTrang, PhanLoai, HinhAnh, HinhAnhBanner, Link, MaQuocGia,
  hls_master_url, aws_status, is_published, published_at
)
SELECT
  'Chuyện Nhà Griffin (1999)',
  'Don''t die laughing. We could get sued.',
  'Animated series featuring the adventures of the dysfunctional Griffin family.',
  'Creator',
  30,
  1999,
  10,
  0,
  'Đang chiếu',
  'Bộ',
  'https://media.themoviedb.org/t/p/w440_and_h660_face/y0HUz4eUNUe3TeEd8fQWYazPaC7.jpg',
  'https://media.themoviedb.org/t/p/w1066_and_h600_face/l7wShoIdIUwaDIbsHno9pO5MZXT.jpg',
  'https://d366i617w2hjen.cloudfront.net/1/episodes/1/orginal.m3u8',
  qg.MaQuocGia,
  'https://d366i617w2hjen.cloudfront.net/1/episodes/1/orginal.m3u8',
  'ready',
  1,
  NOW()
FROM quocgia qg
WHERE qg.TenQuocGia = 'United States'
  AND NOT EXISTS (SELECT 1 FROM phim WHERE TenPhim = 'Chuyện Nhà Griffin (1999)')
LIMIT 1;

INSERT IGNORE INTO phim_theloai (MaPhim, MaTheLoai)
SELECT p.MaPhim, tl.MaTheLoai
FROM phim p
JOIN theloai tl ON tl.TenTheLoai IN ('Animation', 'Comedy')
WHERE p.TenPhim = 'Chuyện Nhà Griffin (1999)';

INSERT IGNORE INTO phim_dienvien (MaPhim, MaDienVien)
SELECT p.MaPhim, dv.MaDienVien
FROM phim p
JOIN dienvien dv ON dv.TenDienVien = 'Seth MacFarlane'
WHERE p.TenPhim = 'Chuyện Nhà Griffin (1999)';

INSERT IGNORE INTO phim_daodien (MaPhim, MaDaoDien)
SELECT p.MaPhim, dd.MaDaoDien
FROM phim p
JOIN daodien dd ON dd.TenDaoDien = 'Seth MacFarlane'
WHERE p.TenPhim = 'Chuyện Nhà Griffin (1999)';

INSERT INTO tapphim (MaPhim, TenTap, Link, hls_url, cloudfront_url, status, upload_status)
SELECT
  p.MaPhim,
  '01',
  'https://d366i617w2hjen.cloudfront.net/1/episodes/1/orginal.m3u8',
  'https://d366i617w2hjen.cloudfront.net/1/episodes/1/orginal.m3u8',
  'https://d366i617w2hjen.cloudfront.net/1/episodes/1/orginal.m3u8',
  'ready',
  'ready'
FROM phim p
WHERE p.TenPhim = 'Chuyện Nhà Griffin (1999)'
  AND NOT EXISTS (
    SELECT 1
    FROM tapphim tp
    WHERE tp.MaPhim = p.MaPhim
      AND tp.upload_status <> 'deleted'
  )
LIMIT 1;
