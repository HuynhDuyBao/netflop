const { pool } = require('../config/database');
const HttpError = require('../utils/httpError');
const notificationService = require('./notification.service');

let tableReady = false;

async function ensureContactTable() {
  if (tableReady) return;

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(180) NOT NULL,
      topic VARCHAR(60) NOT NULL,
      message TEXT NOT NULL,
      status ENUM('new', 'reviewing', 'done') NOT NULL DEFAULT 'new',
      ip_address VARCHAR(80) NULL,
      user_agent VARCHAR(500) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_contact_status (status),
      INDEX idx_contact_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [columns] = await pool.execute(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contact_messages'
      AND COLUMN_NAME = 'user_id'
  `);

  if (columns.length === 0) {
    await pool.execute('ALTER TABLE contact_messages ADD COLUMN user_id INT NULL AFTER id');
  }

  tableReady = true;
}

function normalizeTopic(topic) {
  const topicMap = {
    feedback: 'Góp ý website',
    movie: 'Báo lỗi phim / tập phim',
    account: 'Hỗ trợ tài khoản',
    partner: 'Hợp tác nội dung'
  };

  return topicMap[topic] || topic;
}

async function createMessage(payload) {
  await ensureContactTable();

  const [result] = await pool.execute(
    `
      INSERT INTO contact_messages (user_id, name, email, topic, message, ip_address, user_agent)
      VALUES (:userId, :name, :email, :topic, :message, :ipAddress, :userAgent)
    `,
    {
      userId: payload.userId || null,
      name: payload.name,
      email: payload.email,
      topic: normalizeTopic(payload.topic),
      message: payload.message,
      ipAddress: payload.ipAddress || null,
      userAgent: payload.userAgent || null
    }
  );

  const [rows] = await pool.execute(
    'SELECT * FROM contact_messages WHERE id = :id LIMIT 1',
    { id: result.insertId }
  );

  return rows[0];
}

async function listMessages({ page = 1, limit = 50, search = '', status = '' } = {}) {
  await ensureContactTable();

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const where = ['1 = 1'];
  const params = { limit: safeLimit, offset };
  const countParams = {};

  if (search) {
    where.push('(name LIKE :search OR email LIKE :search OR topic LIKE :search OR message LIKE :search)');
    params.search = `%${search}%`;
    countParams.search = params.search;
  }

  if (status) {
    where.push('status = :status');
    params.status = status;
    countParams.status = status;
  }

  const whereSql = where.join(' AND ');
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM contact_messages
      WHERE ${whereSql}
      ORDER BY created_at DESC, id DESC
      LIMIT :limit OFFSET :offset
    `,
    params
  );

  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM contact_messages
      WHERE ${whereSql}
    `,
    countParams
  );

  return {
    data: rows,
    meta: {
      page: safePage,
      limit: safeLimit,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / safeLimit)
    }
  };
}

async function updateMessageStatus(id, status) {
  await ensureContactTable();

  const [currentRows] = await pool.execute(
    'SELECT * FROM contact_messages WHERE id = :id LIMIT 1',
    { id }
  );

  const currentMessage = currentRows[0];
  if (!currentMessage) {
    throw new HttpError(404, 'Khong tim thay lien he.');
  }

  const [result] = await pool.execute(
    `
      UPDATE contact_messages
      SET status = :status
      WHERE id = :id
    `,
    { id, status }
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Khong tim thay lien he.');
  }

  const [rows] = await pool.execute(
    'SELECT * FROM contact_messages WHERE id = :id LIMIT 1',
    { id }
  );

  if (status === 'done' && currentMessage.status !== 'done' && currentMessage.user_id) {
    await notificationService.createNotification({
      userId: currentMessage.user_id,
      title: 'Liên hệ của bạn đã được xử lý',
      message: `Admin đã xử lý phản hồi "${currentMessage.topic}". Cảm ơn bạn đã giúp Netflop tốt hơn.`,
      type: 'contact',
      link: '/contact'
    });
  }

  return rows[0];
}

module.exports = {
  createMessage,
  listMessages,
  updateMessageStatus
};
