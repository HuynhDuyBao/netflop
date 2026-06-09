const { pool } = require('../config/database');
const HttpError = require('../utils/httpError');
const { hashPassword, verifyPassword } = require('../utils/password');

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
      WHERE (ten_dang_nhap = :identifier OR email = :identifier)
        AND deleted_at IS NULL
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
        AND deleted_at IS NULL
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
      WHERE (ten_dang_nhap = :username OR email = :email)
        AND deleted_at IS NULL
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
      WHERE deleted_at IS NULL
        AND (:search = '' OR ten_dang_nhap LIKE :likeSearch OR email LIKE :likeSearch OR ho_ten LIKE :likeSearch)
      ORDER BY id DESC
      LIMIT :limit OFFSET :offset
    `,
    { search, likeSearch, limit, offset }
  );

  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM tai_khoan
      WHERE deleted_at IS NULL
        AND (:search = '' OR ten_dang_nhap LIKE :likeSearch OR email LIKE :likeSearch OR ho_ten LIKE :likeSearch)
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
  await pool.execute(
    `
      UPDATE tai_khoan
      SET vai_tro = :role
      WHERE id = :id
    `,
    { id, role }
  );

  return findById(id);
}

async function updateLastLogin(id) {
  await pool.execute(
    `
      UPDATE tai_khoan
      SET last_login_at = NOW()
      WHERE id = :id
        AND deleted_at IS NULL
    `,
    { id }
  );
}

async function updateAccountStatus(id, status) {
  await pool.execute(
    `
      UPDATE tai_khoan
      SET trang_thai = :status
      WHERE id = :id
    `,
    { id, status }
  );

  return findById(id);
}

async function updateProfile(id, { fullName, email, avatarUrl }) {
  await pool.execute(
    `
      UPDATE tai_khoan
      SET
        ho_ten = :fullName,
        email = :email,
        hinh_dai_dien = :avatarUrl,
        ngay_cap_nhat = NOW()
      WHERE id = :id
        AND deleted_at IS NULL
    `,
    {
      id,
      fullName: fullName || null,
      email,
      avatarUrl: avatarUrl || null
    }
  );

  return findById(id);
}

async function changePassword(id, currentPassword, nextPassword) {
  const [rows] = await pool.execute(
    `
      SELECT mat_khau
      FROM tai_khoan
      WHERE id = :id AND deleted_at IS NULL
      LIMIT 1
    `,
    { id }
  );
  const passwordMatches = await verifyPassword(currentPassword, rows[0]?.mat_khau);

  if (!passwordMatches) {
    throw new HttpError(400, 'Mat khau hien tai khong dung.');
  }

  const passwordHash = await hashPassword(nextPassword);
  await pool.execute(
    `
      UPDATE tai_khoan
      SET mat_khau = :passwordHash, ngay_cap_nhat = NOW()
      WHERE id = :id AND deleted_at IS NULL
    `,
    { id, passwordHash }
  );
}

async function listUserComments(user, { limit = 50 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const [rows] = await pool.execute(
    `
      SELECT bl.MaBinhLuan, bl.MaPhim, bl.NoiDung, bl.ThoiGian, bl.parent_id, p.TenPhim
      FROM binhluan bl
      LEFT JOIN phim p ON p.MaPhim = bl.MaPhim
      WHERE bl.TrangThai = 'visible'
        AND (bl.UserID = :userId OR bl.TenDN = :username)
      ORDER BY bl.ThoiGian DESC, bl.MaBinhLuan DESC
      LIMIT :limit
    `,
    { userId: user.id, username: user.ten_dang_nhap, limit: safeLimit }
  );
  return rows;
}

async function listUserRatings(user, { limit = 50 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const [rows] = await pool.execute(
    `
      SELECT dg.MaPhim, dg.SoDiem, dg.BinhLuan, dg.ThoiGian, p.TenPhim
      FROM danhgia dg
      LEFT JOIN phim p ON p.MaPhim = dg.MaPhim
      WHERE dg.UserID = :userId OR dg.TenDN = :username
      ORDER BY dg.ThoiGian DESC
      LIMIT :limit
    `,
    { userId: user.id, username: user.ten_dang_nhap, limit: safeLimit }
  );
  return rows;
}

module.exports = {
  changePassword,
  createAccount,
  findById,
  findByUsernameOrEmail,
  listAccounts,
  listUserComments,
  listUserRatings,
  mapAccount,
  updateLastLogin,
  updateAccountRole,
  updateAccountStatus,
  updateProfile,
  usernameOrEmailExists
};
