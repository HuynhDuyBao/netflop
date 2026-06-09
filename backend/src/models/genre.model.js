const { pool } = require('../config/database');

module.exports = {
  list: async () => {
    const [rows] = await pool.query('SELECT * FROM the_loai ORDER BY ten_the_loai ASC');
    return rows;
  }
};
