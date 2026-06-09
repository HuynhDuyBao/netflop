const { pool } = require('../config/database');

async function main() {
  const [result] = await pool.execute(
    `
      UPDATE phim p
      LEFT JOIN (
        SELECT MaPhim, COUNT(*) AS total
        FROM lichsu
        GROUP BY MaPhim
      ) ls ON ls.MaPhim = p.MaPhim
      SET p.LuotXem = GREATEST(COALESCE(p.LuotXem, 0), COALESCE(ls.total, 0))
    `
  );

  const [topMovies] = await pool.execute(
    `
      SELECT MaPhim, TenPhim, LuotXem
      FROM phim
      ORDER BY COALESCE(LuotXem, 0) DESC, MaPhim DESC
      LIMIT 5
    `
  );

  console.log(JSON.stringify({
    affectedRows: result.affectedRows,
    topMovies
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
