import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Bạn cần đăng nhập." });
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || !["admin", "moderator"].includes(req.user.role)) {
    return res.status(403).json({ message: "Bạn không có quyền admin." });
  }

  return next();
}
