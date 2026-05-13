import bcrypt from "bcryptjs";
import { pool, query } from "../config/db.js";

const username = process.argv[2] || "admin";
const password = process.argv[3] || "Admin@123";
const email = process.argv[4] || "admin@netflop.local";

const hashed = await bcrypt.hash(password, 12);

await query(
  `INSERT INTO tai_khoan
    (ten_dang_nhap, mat_khau, email, ho_ten, vai_tro, trang_thai)
   VALUES (:username, :password, :email, 'Netflop Admin', 'admin', 'active')
   ON DUPLICATE KEY UPDATE
    mat_khau = VALUES(mat_khau),
    vai_tro = 'admin',
    trang_thai = 'active'`,
  { username, password: hashed, email }
);

console.log(`Admin ready: ${username} / ${password}`);
await pool.end();
