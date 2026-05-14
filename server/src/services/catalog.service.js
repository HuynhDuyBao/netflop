const { pool } = require('../config/database');
const HttpError = require('../utils/httpError');

async function listGenres() {
  const [rows] = await pool.execute(
    `
      SELECT MaTheLoai, TenTheLoai
      FROM theloai
      ORDER BY TenTheLoai ASC
    `
  );

  return rows;
}

async function createGenre(name) {
  const [result] = await pool.execute(
    `
      INSERT INTO theloai (TenTheLoai)
      VALUES (:name)
    `,
    { name }
  );

  const [rows] = await pool.execute(
    `
      SELECT MaTheLoai, TenTheLoai
      FROM theloai
      WHERE MaTheLoai = :id
      LIMIT 1
    `,
    { id: result.insertId }
  );

  return rows[0];
}

async function updateGenre(id, name) {
  const [result] = await pool.execute(
    `
      UPDATE theloai
      SET TenTheLoai = :name
      WHERE MaTheLoai = :id
    `,
    { id, name }
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Khong tim thay the loai.');
  }

  const [rows] = await pool.execute(
    `
      SELECT MaTheLoai, TenTheLoai
      FROM theloai
      WHERE MaTheLoai = :id
      LIMIT 1
    `,
    { id }
  );

  return rows[0] || null;
}

async function deleteGenre(id) {
  const [result] = await pool.execute(
    `
      DELETE FROM theloai
      WHERE MaTheLoai = :id
    `,
    { id }
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Khong tim thay the loai.');
  }
}

async function listCountries() {
  const [rows] = await pool.execute(
    `
      SELECT MaQuocGia, TenQuocGia
      FROM quocgia
      ORDER BY TenQuocGia ASC
    `
  );

  return rows;
}

async function createCountry(name) {
  const [result] = await pool.execute(
    `
      INSERT INTO quocgia (TenQuocGia)
      VALUES (:name)
    `,
    { name }
  );

  const [rows] = await pool.execute(
    `
      SELECT MaQuocGia, TenQuocGia
      FROM quocgia
      WHERE MaQuocGia = :id
      LIMIT 1
    `,
    { id: result.insertId }
  );

  return rows[0];
}

async function updateCountry(id, name) {
  const [result] = await pool.execute(
    `
      UPDATE quocgia
      SET TenQuocGia = :name
      WHERE MaQuocGia = :id
    `,
    { id, name }
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Khong tim thay quoc gia.');
  }

  const [rows] = await pool.execute(
    `
      SELECT MaQuocGia, TenQuocGia
      FROM quocgia
      WHERE MaQuocGia = :id
      LIMIT 1
    `,
    { id }
  );

  return rows[0] || null;
}

async function deleteCountry(id) {
  const [result] = await pool.execute(
    `
      DELETE FROM quocgia
      WHERE MaQuocGia = :id
    `,
    { id }
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Khong tim thay quoc gia.');
  }
}

module.exports = {
  createCountry,
  createGenre,
  deleteCountry,
  deleteGenre,
  listCountries,
  listGenres,
  updateCountry,
  updateGenre
};
