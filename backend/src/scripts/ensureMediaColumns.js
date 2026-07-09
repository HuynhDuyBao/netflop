const { pool } = require('../config/database');

async function ensureMediaColumns() {
  const [columns] = await pool.query(`
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tapphim'
      AND COLUMN_NAME IN ('media_convert_job_id', 'hls_output_key', 'media_convert_error')
  `);
  const existing = new Set(columns.map((column) => column.COLUMN_NAME));

  if (!existing.has('media_convert_job_id')) {
    await pool.query(
      'ALTER TABLE tapphim ADD COLUMN media_convert_job_id VARCHAR(120) NULL AFTER upload_status'
    );
  }
  if (!existing.has('hls_output_key')) {
    await pool.query(
      'ALTER TABLE tapphim ADD COLUMN hls_output_key VARCHAR(700) NULL AFTER media_convert_job_id'
    );
  }
  if (!existing.has('media_convert_error')) {
    await pool.query(
      'ALTER TABLE tapphim ADD COLUMN media_convert_error TEXT NULL AFTER hls_output_key'
    );
  }

  const [indexes] = await pool.query(`
    SELECT INDEX_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tapphim'
      AND INDEX_NAME = 'idx_tapphim_media_convert_job_id'
  `);
  if (!indexes.length) {
    await pool.query(
      'CREATE INDEX idx_tapphim_media_convert_job_id ON tapphim (media_convert_job_id)'
    );
  }
}

ensureMediaColumns()
  .then(() => console.log('MediaConvert database columns are ready.'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
