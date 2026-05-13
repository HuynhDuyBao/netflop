import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query } from "../config/db.js";
import { logger } from "../config/logger.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Thiếu tên đăng nhập hoặc mật khẩu." });
  }

  const users = await query(
    "SELECT id, ten_dang_nhap, mat_khau, email, ho_ten, vai_tro, trang_thai FROM tai_khoan WHERE ten_dang_nhap = :username OR email = :username LIMIT 1",
    { username }
  );

  const user = users[0];
  if (!user || user.trang_thai !== "active") {
    logger.warn({ username }, "login failed: user not found or inactive");
    return res.status(401).json({ message: "Thông tin đăng nhập không đúng." });
  }

  const ok = await bcrypt.compare(password, user.mat_khau);
  if (!ok) {
    logger.warn({ username }, "login failed: bad password");
    return res.status(401).json({ message: "Thông tin đăng nhập không đúng." });
  }

  const token = jwt.sign(
    { id: user.id, username: user.ten_dang_nhap, role: user.vai_tro },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.ten_dang_nhap,
      email: user.email,
      fullName: user.ho_ten,
      role: user.vai_tro
    }
  });
});
