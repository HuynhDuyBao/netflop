USE web_xem_phim;

ALTER TABLE tapphim
  ADD COLUMN media_convert_job_id VARCHAR(120) NULL AFTER upload_status,
  ADD COLUMN hls_output_key VARCHAR(700) NULL AFTER media_convert_job_id,
  ADD COLUMN media_convert_error TEXT NULL AFTER hls_output_key;

CREATE INDEX idx_tapphim_media_convert_job_id
  ON tapphim (media_convert_job_id);
