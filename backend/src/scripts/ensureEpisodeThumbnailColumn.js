const { pool } = require('../config/database');

async function ensureEpisodeThumbnailColumn() {
  const [rows] = await pool.execute(`
    SELECT COUNT(*) AS total
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tapphim'
      AND COLUMN_NAME = 'thumbnail_url'
  `);

  if (Number(rows[0]?.total || 0) === 0) {
    await pool.execute('ALTER TABLE tapphim ADD COLUMN thumbnail_url VARCHAR(700) NULL AFTER cloudfront_url');
    console.log('Added tapphim.thumbnail_url');
  } else {
    console.log('tapphim.thumbnail_url already exists');
  }
}

ensureEpisodeThumbnailColumn()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
