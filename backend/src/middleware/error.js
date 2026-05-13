import { logger } from "../config/logger.js";

export function notFound(req, res) {
  res.status(404).json({ message: "Không tìm thấy API." });
}

export function errorHandler(err, req, res, next) {
  logger.error({ err, path: req.path }, "request failed");
  res.status(err.status || 500).json({
    message: err.message || "Lỗi server.",
    details: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
}
