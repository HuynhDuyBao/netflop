const { pool } = require('../config/database');

module.exports = {
  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM phim WHERE id = ?', [id]);
    return rows[0] || null;
  }
};
