const { pool } = require('../config/database');
const HttpError = require('../utils/httpError');

const configs = {
  actors: {
    table: 'dienvien',
    id: 'MaDienVien',
    name: 'TenDienVien',
    movieTable: 'phim_dienvien',
    movieId: 'MaDienVien'
  },
  directors: {
    table: 'daodien',
    id: 'MaDaoDien',
    name: 'TenDaoDien',
    movieTable: 'phim_daodien',
    movieId: 'MaDaoDien'
  }
};

function getConfig(kind) {
  const config = configs[kind];
  if (!config) {
    throw new HttpError(400, 'Loai nhan su khong hop le.');
  }
  return config;
}

async function listPeople(kind, { search = '', countryId = null, page = 1, limit = 100 } = {}) {
  const config = getConfig(kind);
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const where = ['1 = 1'];
  const params = { limit: safeLimit, offset };

  if (search) {
    where.push(`${config.name} LIKE :search`);
    params.search = `%${search}%`;
  }

  if (countryId) {
    where.push(`${config.table}.MaQuocGia = :countryId`);
    params.countryId = Number(countryId);
  }

  const [rows] = await pool.execute(
    `
      SELECT ${config.id}, ${config.name}, NgaySinh, ${config.table}.MaQuocGia, TieuSu, HinhAnh, qg.TenQuocGia
      FROM ${config.table}
      LEFT JOIN quocgia qg ON qg.MaQuocGia = ${config.table}.MaQuocGia
      WHERE ${where.join(' AND ')}
      ORDER BY ${config.name} ASC
      LIMIT :limit OFFSET :offset
    `,
    params
  );

  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM ${config.table}
      WHERE ${where.join(' AND ')}
    `,
    params
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

async function getPersonById(kind, id) {
  const config = getConfig(kind);
  const [rows] = await pool.execute(
    `
      SELECT ${config.id}, ${config.name}, NgaySinh, ${config.table}.MaQuocGia, TieuSu, HinhAnh, qg.TenQuocGia
      FROM ${config.table}
      LEFT JOIN quocgia qg ON qg.MaQuocGia = ${config.table}.MaQuocGia
      WHERE ${config.id} = :id
      LIMIT 1
    `,
    { id }
  );

  if (!rows[0]) {
    throw new HttpError(404, 'Khong tim thay nhan su.');
  }

  return rows[0];
}

async function createPerson(kind, payload) {
  const config = getConfig(kind);
  const [result] = await pool.execute(
    `
      INSERT INTO ${config.table} (${config.name}, NgaySinh, MaQuocGia, TieuSu, HinhAnh)
      VALUES (:name, :birthDate, :countryId, :bio, :image)
    `,
    {
      name: payload.name,
      birthDate: payload.birthDate || null,
      countryId: payload.countryId || null,
      bio: payload.bio || null,
      image: payload.image || null
    }
  );

  return getPersonById(kind, result.insertId);
}

async function updatePerson(kind, id, payload) {
  const config = getConfig(kind);
  await getPersonById(kind, id);

  const columnMap = {
    name: config.name,
    birthDate: 'NgaySinh',
    countryId: 'MaQuocGia',
    bio: 'TieuSu',
    image: 'HinhAnh'
  };
  const sets = [];
  const params = { id };

  for (const [key, column] of Object.entries(columnMap)) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      sets.push(`${column} = :${key}`);
      params[key] = payload[key] || null;
    }
  }

  if (sets.length) {
    await pool.execute(
      `
        UPDATE ${config.table}
        SET ${sets.join(', ')}
        WHERE ${config.id} = :id
      `,
      params
    );
  }

  return getPersonById(kind, id);
}

async function deletePerson(kind, id) {
  const config = getConfig(kind);
  const [result] = await pool.execute(
    `
      DELETE FROM ${config.table}
      WHERE ${config.id} = :id
    `,
    { id }
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Khong tim thay nhan su.');
  }
}

module.exports = {
  createPerson,
  deletePerson,
  getPersonById,
  listPeople,
  updatePerson
};
