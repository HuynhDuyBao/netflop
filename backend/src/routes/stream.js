import { Router } from "express";
import { query } from "../config/db.js";

export const streamRouter = Router();

streamRouter.post("/log", async (req, res) => {
  const { userId, username, movieId, episodeId, qualityLabel, watchSeconds = 0 } = req.body;
  if (!movieId) return res.status(400).json({ message: "Thiếu MaPhim." });

  await query(
    `INSERT INTO stream_view_logs
      (UserID, TenDN, MaPhim, MaTap, quality_label, watch_seconds, client_ip, user_agent)
     VALUES (:userId, :username, :movieId, :episodeId, :qualityLabel, :watchSeconds, :ip, :userAgent)`,
    {
      userId: userId || null,
      username: username || null,
      movieId,
      episodeId: episodeId || null,
      qualityLabel: qualityLabel || null,
      watchSeconds: Number(watchSeconds) || 0,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || null
    }
  );

  await query("UPDATE phim SET LuotXem = LuotXem + 1 WHERE MaPhim = :movieId", { movieId });
  res.status(201).json({ ok: true });
});
