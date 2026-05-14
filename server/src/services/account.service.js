const { pool } = require('../config/database');
const HttpError = require('../utils/httpError');

const publicAccountFields = `
  id,
  ten_dang_nhap,
  email,
  ho_ten,
  hinh_dai_dien,
  vai_tro,
  trang_thai,
  ngay_tao,
  ngay_cap_nhat
`;

function mapAccount(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    ten_dang_nhap: row.ten_dang_nhap,
    email: row.email,
    ho_ten: row.ho_ten,
    hinh_dai_dien: row.hinh_dai_dien,
    vai_tro: row.vai_tro,
    trang_thai: row.trang_thai,
    ngay_tao: row.ngay_tao,
    ngay_cap_nhat: row.ngay_cap_nhat
  };
}

async function findByUsernameOrEmail(identifier) {
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM tai_khoan
      WHERE ten_dang_nhap = :identifier OR email = :identifier
      LIMIT 1
    `,
    { identifier }
  );

  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `
      SELECT ${publicAccountFields}
      FROM tai_khoan
      WHERE id = :id
      LIMIT 1
    `,
    { id }
  );

  return mapAccount(rows[0]);
}

async function usernameOrEmailExists(username, email) {
  const [rows] = await pool.execute(
    `
      SELECT id
      FROM tai_khoan
      WHERE ten_dang_nhap = :username OR email = :email
      LIMIT 1
    `,
    { username, email }
  );

  return rows.length > 0;
}

async function createAccount({ username, email, passwordHash, fullName, role = 'user' }) {
  const [result] = await pool.execute(
    `
      INSERT INTO tai_khoan (ten_dang_nhap, email, mat_khau, ho_ten, vai_tro, trang_thai)
      VALUES (:username, :email, :passwordHash, :fullName, :role, 'active')
    `,
    {
      username,
      email,
      passwordHash,
      fullName: fullName || null,
      role
    }
  );

  return findById(result.insertId);
}

async function listAccounts({ page = 1, limit = 20, search = '' }) {
  const offset = (page - 1) * limit;
  const likeSearch = `%${search}%`;

  const [rows] = await pool.execute(
    `
      SELECT ${publicAccountFields}
      FROM tai_khoan
      WHERE (:search = '' OR ten_dang_nhap LIKE :likeSearch OR email LIKE :likeSearch OR ho_ten LIKE :likeSearch)
      ORDER BY id DESC
      LIMIT :limit OFFSET :offset
    `,
    { search, likeSearch, limit, offset }
  );

  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM tai_khoan
      WHERE (:search = '' OR ten_dang_nhap LIKE :likeSearch OR email LIKE :likeSearch OR ho_ten LIKE :likeSearch)
    `,
    { search, likeSearch }
  );

  return {
    data: rows.map(mapAccount),
    meta: {
      page,
      limit,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / limit)
    }
  };
}

async function updateAccountRole(id, role) {
  const [result] = await pool.execute(
    `
      UPDATE tai_khoan
      SET vai_tro = :role
      WHERE id = :id
    `,
    { id, role }
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Khong tim thay nguoi dung.');
  }

  return findById(id);
}

async function updateAccountStatus(id, status) {
  const [result] = await pool.execute(
    `
      UPDATE tai_khoan
      SET trang_thai = :status
      WHERE id = :id
    `,
    { id, status }
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Khong tim thay nguoi dung.');
  }

  return findById(id);
}

module.exports = {
  createAccount,
  findById,
  findByUsernameOrEmail,
  listAccounts,
  mapAccount,
  updateAccountRole,
  updateAccountStatus,
  usernameOrEmailExists
};
