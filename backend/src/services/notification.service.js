const { pool } = require('../config/database');
const HttpError = require('../utils/httpError');

let tableReady = false;

async function ensureNotificationTable() {
  if (tableReady) return;

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      title VARCHAR(180) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(60) NOT NULL DEFAULT 'system',
      link VARCHAR(500) NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP NULL,
      INDEX idx_notifications_user_read (user_id, is_read),
      INDEX idx_notifications_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await pool.execute('ALTER TABLE notifications MODIFY user_id INT NULL');
  } catch (error) {
    if (!String(error.message || '').includes('Duplicate')) throw error;
  }

  tableReady = true;
}

async function createNotification({ userId, title, message, type = 'system', link = null }) {
  if (!userId) return null;
  await ensureNotificationTable();

  const [result] = await pool.execute(
    `
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (:userId, :title, :message, :type, :link)
    `,
    { userId, title, message, type, link }
  );

  const [rows] = await pool.execute(
    'SELECT * FROM notifications WHERE id = :id LIMIT 1',
    { id: result.insertId }
  );

  return rows[0];
}

async function listNotifications(userId, { limit = 20 } = {}) {
  await ensureNotificationTable();
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

  const [rows] = await pool.execute(
    `
      SELECT *
      FROM notifications
      WHERE user_id = :userId
      ORDER BY created_at DESC, id DESC
      LIMIT :limit
    `,
    { userId, limit: safeLimit }
  );

  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS unread
      FROM notifications
      WHERE user_id = :userId AND is_read = 0
    `,
    { userId }
  );

  return {
    data: rows,
    unread: countRows[0].unread
  };
}

async function createPublicNotification({ title, message, type = 'admin', link = null }) {
  await ensureNotificationTable();

  const [result] = await pool.execute(
    `
      INSERT INTO notifications (user_id, title, message, type, link, is_read)
      VALUES (NULL, :title, :message, :type, :link, 0)
    `,
    { title, message, type, link }
  );

  const [rows] = await pool.execute(
    'SELECT * FROM notifications WHERE id = :id LIMIT 1',
    { id: result.insertId }
  );

  return rows[0];
}

async function listPublicNotifications({ limit = 12 } = {}) {
  await ensureNotificationTable();
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);

  const [rows] = await pool.execute(
    `
      SELECT *
      FROM notifications
      WHERE user_id IS NULL
      ORDER BY created_at DESC, id DESC
      LIMIT :limit
    `,
    { limit: safeLimit }
  );

  return rows;
}

async function deletePublicNotification(id) {
  await ensureNotificationTable();

  const [result] = await pool.execute(
    'DELETE FROM notifications WHERE id = :id AND user_id IS NULL',
    { id }
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Khong tim thay thong bao.');
  }
}

async function markAsRead(userId, id) {
  await ensureNotificationTable();

  const [result] = await pool.execute(
    `
      UPDATE notifications
      SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE id = :id AND user_id = :userId
    `,
    { id, userId }
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Khong tim thay thong bao.');
  }
}

async function markAllAsRead(userId) {
  await ensureNotificationTable();

  await pool.execute(
    `
      UPDATE notifications
      SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE user_id = :userId AND is_read = 0
    `,
    { userId }
  );
}

module.exports = {
  createNotification,
  createPublicNotification,
  deletePublicNotification,
  listNotifications,
  listPublicNotifications,
  markAllAsRead,
  markAsRead
};
