const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../src/config/env');

async function main() {
  const relativeDir = process.argv[2];

  if (!relativeDir) {
    throw new Error('Usage: node scripts/run-sql.js <directory>');
  }

  const directory = path.resolve(__dirname, '..', relativeDir);
  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log(`No SQL files found in ${directory}`);
    return;
  }

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    database: env.db.database,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
    charset: 'utf8mb4'
  });

  try {
    for (const file of files) {
      const fullPath = path.join(directory, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      await connection.query(sql);
      console.log(`Applied ${path.relative(process.cwd(), fullPath)}`);
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
