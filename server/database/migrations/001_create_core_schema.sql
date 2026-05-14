SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `tai_khoan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ten_dang_nhap` varchar(50) NOT NULL,
  `mat_khau` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `facebook_id` varchar(255) DEFAULT NULL,
  `ho_ten` varchar(100) DEFAULT NULL,
  `hinh_dai_dien` varchar(255) DEFAULT NULL,
  `vai_tro` enum('user','admin','moderator') DEFAULT 'user',
  `trang_thai` enum('active','inactive','banned') DEFAULT 'active',
  `ngay_tao` timestamp NULL DEFAULT current_timestamp(),
  `ngay_cap_nhat` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `ten_dang_nhap` (`ten_dang_nhap`) USING BTREE,
  UNIQUE KEY `email` (`email`) USING BTREE,
  UNIQUE KEY `google_id` (`google_id`) USING BTREE,
  UNIQUE KEY `tai_khoan_facebook_id_unique` (`facebook_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quocgia` (
  `MaQuocGia` int(11) NOT NULL AUTO_INCREMENT,
  `TenQuocGia` varchar(100) NOT NULL,
  PRIMARY KEY (`MaQuocGia`),
  UNIQUE KEY `TenQuocGia` (`TenQuocGia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `theloai` (
  `MaTheLoai` int(11) NOT NULL AUTO_INCREMENT,
  `TenTheLoai` varchar(50) NOT NULL,
  PRIMARY KEY (`MaTheLoai`),
  UNIQUE KEY `TenTheLoai` (`TenTheLoai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dienvien` (
  `MaDienVien` int(11) NOT NULL AUTO_INCREMENT,
  `TenDienVien` varchar(100) NOT NULL,
  `NgaySinh` date DEFAULT NULL,
  `MaQuocGia` int(11) DEFAULT NULL,
  `TieuSu` text DEFAULT NULL,
  `HinhAnh` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`MaDienVien`),
  KEY `MaQuocGia` (`MaQuocGia`),
  CONSTRAINT `dienvien_ibfk_1` FOREIGN KEY (`MaQuocGia`) REFERENCES `quocgia` (`MaQuocGia`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `daodien` (
  `MaDaoDien` int(11) NOT NULL AUTO_INCREMENT,
  `TenDaoDien` varchar(100) NOT NULL,
  `NgaySinh` date DEFAULT NULL,
  `MaQuocGia` int(11) DEFAULT NULL,
  `TieuSu` text DEFAULT NULL,
  `HinhAnh` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`MaDaoDien`),
  KEY `MaQuocGia` (`MaQuocGia`),
  CONSTRAINT `daodien_ibfk_1` FOREIGN KEY (`MaQuocGia`) REFERENCES `quocgia` (`MaQuocGia`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `phim` (
  `MaPhim` int(11) NOT NULL AUTO_INCREMENT,
  `TenPhim` varchar(100) NOT NULL,
  `TieuDe` varchar(255) DEFAULT NULL,
  `MoTa` text DEFAULT NULL,
  `NoiDung` text DEFAULT NULL,
  `ThoiLuong` int(11) DEFAULT NULL,
  `NamPhatHanh` int(11) DEFAULT NULL,
  `DanhGia` float DEFAULT 0,
  `LuotXem` int(11) DEFAULT 0,
  `TinhTrang` enum('Đang chiếu','Sắp chiếu','Đã kết thúc') DEFAULT 'Đang chiếu',
  `PhanLoai` enum('Lẻ','Bộ') DEFAULT 'Lẻ',
  `HinhAnh` varchar(255) DEFAULT NULL,
  `HinhAnhBanner` varchar(255) DEFAULT NULL,
  `Link` varchar(255) DEFAULT NULL,
  `NgayTao` timestamp NULL DEFAULT current_timestamp(),
  `NgayCapNhat` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `MaQuocGia` int(11) DEFAULT NULL,
  `poster_s3_key` varchar(500) DEFAULT NULL,
  `banner_s3_key` varchar(500) DEFAULT NULL,
  `aws_status` enum('draft','pending_upload','uploaded','processing','ready','failed') NOT NULL DEFAULT 'draft',
  `aws_error_message` text DEFAULT NULL,
  `cloudfront_base_url` varchar(500) DEFAULT NULL,
  `hls_master_url` varchar(700) DEFAULT NULL,
  `hls_master_key` varchar(500) DEFAULT NULL,
  `s3_output_prefix` varchar(500) DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `published_at` datetime DEFAULT NULL,
  PRIMARY KEY (`MaPhim`),
  KEY `MaQuocGia` (`MaQuocGia`),
  KEY `idx_phim_aws_status` (`aws_status`),
  KEY `idx_phim_is_published` (`is_published`),
  CONSTRAINT `phim_ibfk_1` FOREIGN KEY (`MaQuocGia`) REFERENCES `quocgia` (`MaQuocGia`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tapphim` (
  `MaTap` int(11) NOT NULL AUTO_INCREMENT,
  `MaPhim` int(11) DEFAULT NULL,
  `TenTap` varchar(50) DEFAULT NULL,
  `Link` varchar(255) DEFAULT NULL,
  `original_file` varchar(255) DEFAULT NULL,
  `hls_url` varchar(255) DEFAULT NULL,
  `cloudflare_uid` varchar(255) DEFAULT NULL,
  `video_uid` varchar(255) DEFAULT NULL,
  `r2_folder` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `duration` int(11) DEFAULT NULL,
  `s3_input_bucket` varchar(255) DEFAULT NULL,
  `s3_input_key` varchar(500) DEFAULT NULL,
  `s3_output_bucket` varchar(255) DEFAULT NULL,
  `s3_output_prefix` varchar(500) DEFAULT NULL,
  `hls_master_key` varchar(500) DEFAULT NULL,
  `cloudfront_url` varchar(700) DEFAULT NULL,
  `mediaconvert_job_id` varchar(255) DEFAULT NULL,
  `mediaconvert_role_arn` varchar(500) DEFAULT NULL,
  `aws_region` varchar(50) DEFAULT 'ap-southeast-1',
  `upload_status` enum('pending','uploading','uploaded','processing','ready','failed','deleted') NOT NULL DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `file_size_bytes` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`MaTap`),
  KEY `MaPhim` (`MaPhim`),
  KEY `idx_tapphim_upload_status` (`upload_status`),
  KEY `idx_tapphim_job_id` (`mediaconvert_job_id`),
  CONSTRAINT `tapphim_ibfk_1` FOREIGN KEY (`MaPhim`) REFERENCES `phim` (`MaPhim`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `phim_theloai` (
  `MaPhim` int(11) NOT NULL,
  `MaTheLoai` int(11) NOT NULL,
  PRIMARY KEY (`MaPhim`,`MaTheLoai`),
  KEY `MaTheLoai` (`MaTheLoai`),
  CONSTRAINT `phim_theloai_ibfk_1` FOREIGN KEY (`MaPhim`) REFERENCES `phim` (`MaPhim`) ON DELETE CASCADE,
  CONSTRAINT `phim_theloai_ibfk_2` FOREIGN KEY (`MaTheLoai`) REFERENCES `theloai` (`MaTheLoai`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `phim_dienvien` (
  `MaPhim` int(11) NOT NULL,
  `MaDienVien` int(11) NOT NULL,
  PRIMARY KEY (`MaPhim`,`MaDienVien`),
  KEY `MaDienVien` (`MaDienVien`),
  CONSTRAINT `phim_dienvien_ibfk_1` FOREIGN KEY (`MaPhim`) REFERENCES `phim` (`MaPhim`) ON DELETE CASCADE,
  CONSTRAINT `phim_dienvien_ibfk_2` FOREIGN KEY (`MaDienVien`) REFERENCES `dienvien` (`MaDienVien`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `phim_daodien` (
  `MaPhim` int(11) NOT NULL,
  `MaDaoDien` int(11) NOT NULL,
  PRIMARY KEY (`MaPhim`,`MaDaoDien`),
  KEY `MaDaoDien` (`MaDaoDien`),
  CONSTRAINT `phim_daodien_ibfk_1` FOREIGN KEY (`MaPhim`) REFERENCES `phim` (`MaPhim`) ON DELETE CASCADE,
  CONSTRAINT `phim_daodien_ibfk_2` FOREIGN KEY (`MaDaoDien`) REFERENCES `daodien` (`MaDaoDien`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `phim_yeuthich` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `MaPhim` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `NgayThem` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `MaPhim` (`MaPhim`,`UserID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `phim_yeuthich_ibfk_1` FOREIGN KEY (`MaPhim`) REFERENCES `phim` (`MaPhim`) ON DELETE CASCADE,
  CONSTRAINT `phim_yeuthich_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `tai_khoan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lichsu` (
  `UserID` bigint(20) unsigned DEFAULT NULL,
  `TenDN` varchar(50) NOT NULL,
  `MaPhim` int(11) NOT NULL,
  `MaTap` bigint(20) unsigned DEFAULT NULL,
  `ThoiGianXem` double NOT NULL DEFAULT 0,
  `ThoiGian` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`TenDN`,`MaPhim`) USING BTREE,
  KEY `MaPhim` (`MaPhim`) USING BTREE,
  CONSTRAINT `lichsu_ibfk_1` FOREIGN KEY (`TenDN`) REFERENCES `tai_khoan` (`ten_dang_nhap`) ON DELETE CASCADE,
  CONSTRAINT `lichsu_ibfk_2` FOREIGN KEY (`MaPhim`) REFERENCES `phim` (`MaPhim`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `danhgia` (
  `TenDN` varchar(50) NOT NULL,
  `MaPhim` int(11) NOT NULL,
  `SoDiem` int(11) DEFAULT NULL,
  `BinhLuan` text DEFAULT NULL,
  `ThoiGian` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`TenDN`,`MaPhim`),
  KEY `MaPhim` (`MaPhim`),
  CONSTRAINT `danhgia_ibfk_1` FOREIGN KEY (`TenDN`) REFERENCES `tai_khoan` (`ten_dang_nhap`) ON DELETE CASCADE,
  CONSTRAINT `danhgia_ibfk_2` FOREIGN KEY (`MaPhim`) REFERENCES `phim` (`MaPhim`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `binhluan` (
  `MaBinhLuan` int(11) NOT NULL AUTO_INCREMENT,
  `TenDN` varchar(50) DEFAULT NULL,
  `MaPhim` int(11) DEFAULT NULL,
  `NoiDung` text DEFAULT NULL,
  `ThoiGian` datetime DEFAULT current_timestamp(),
  `parent_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`MaBinhLuan`),
  KEY `TenDN` (`TenDN`),
  KEY `MaPhim` (`MaPhim`),
  KEY `binhluan_parent_id_foreign` (`parent_id`),
  CONSTRAINT `binhluan_ibfk_1` FOREIGN KEY (`TenDN`) REFERENCES `tai_khoan` (`ten_dang_nhap`) ON DELETE CASCADE,
  CONSTRAINT `binhluan_ibfk_2` FOREIGN KEY (`MaPhim`) REFERENCES `phim` (`MaPhim`) ON DELETE CASCADE,
  CONSTRAINT `binhluan_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `binhluan` (`MaBinhLuan`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
