CREATE DATABASE IF NOT EXISTS web_xem_phim CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE web_xem_phim;

CREATE TABLE IF NOT EXISTS quocgia (
  MaQuocGia INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  TenQuocGia VARCHAR(100) NOT NULL,
  MaCode VARCHAR(10) DEFAULT NULL COMMENT 'VD: VN, US, KR, JP',
  NgayTao TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (MaQuocGia),
  UNIQUE KEY uq_quocgia_ten (TenQuocGia),
  UNIQUE KEY uq_quocgia_code (MaCode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO quocgia (MaQuocGia, TenQuocGia, MaCode, NgayTao) VALUES
(1, 'Việt Nam', 'VN', '2026-05-14 03:01:21'),
(2, 'Hoa Kỳ', 'US', '2026-05-14 03:01:21'),
(3, 'Hàn Quốc', 'KR', '2026-05-14 03:01:21'),
(4, 'Nhật Bản', 'JP', '2026-05-14 03:01:21'),
(5, 'Trung Quốc', 'CN', '2026-05-14 03:01:21'),
(6, 'Thái Lan', 'TH', '2026-05-14 03:01:21'),
(7, 'Anh', 'GB', '2026-05-14 03:01:21')
ON DUPLICATE KEY UPDATE
  TenQuocGia = VALUES(TenQuocGia),
  MaCode = VALUES(MaCode);

ALTER TABLE quocgia AUTO_INCREMENT = 8;
