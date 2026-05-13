const { pool } = require('../config/database');

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
  await pool.execute(
    `
      UPDATE theloai
      SET TenTheLoai = :name
      WHERE MaTheLoai = :id
    `,
    { id, name }
  );

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
  await pool.execute(
    `
      DELETE FROM theloai
      WHERE MaTheLoai = :id
    `,
    { id }
  );
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
  await pool.execute(
    `
      UPDATE quocgia
      SET TenQuocGia = :name
      WHERE MaQuocGia = :id
    `,
    { id, name }
  );

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
  await pool.execute(
    `
      DELETE FROM quocgia
      WHERE MaQuocGia = :id
    `,
    { id }
  );
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
