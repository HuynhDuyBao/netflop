-- Chuyen bang countries sang cau truc tieng Viet cho Netflop
-- Database: web_xem_phim
--
-- Dung khi database hien tai dang co bang:
-- countries(id, name, code, created_at)
--
-- Sau khi chay, backend se dung duoc:
-- quocgia(MaQuocGia, TenQuocGia, MaCode, NgayTao)

USE web_xem_phim;

RENAME TABLE countries TO quocgia;

ALTER TABLE quocgia
  CHANGE id MaQuocGia INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  CHANGE name TenQuocGia VARCHAR(100) NOT NULL,
  CHANGE code MaCode VARCHAR(10) NULL COMMENT 'VD: VN, US, KR, JP',
  CHANGE created_at NgayTao TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE quocgia
  DROP INDEX uq_countries_name,
  DROP INDEX uq_countries_code,
  ADD UNIQUE KEY uq_quocgia_ten (TenQuocGia),
  ADD UNIQUE KEY uq_quocgia_code (MaCode);
