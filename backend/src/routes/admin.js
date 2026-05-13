import { Router } from "express";
import { query } from "../config/db.js";
import { logger } from "../config/logger.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  buildCloudFrontUrl,
  buildInputKey,
  buildOutputPrefix,
  createMediaConvertJob,
  createUploadUrl,
  getMediaConvertJob
} from "../services/awsService.js";
import { env } from "../config/env.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/movies", async (req, res) => {
  const rows = await query(
    `SELECT p.MaPhim, p.TenPhim, p.TieuDe, p.NamPhatHanh, p.PhanLoai, p.HinhAnh,
            p.aws_status, p.is_published, COUNT(t.MaTap) AS episode_count
     FROM phim p
     LEFT JOIN tapphim t ON t.MaPhim = p.MaPhim
     GROUP BY p.MaPhim
     ORDER BY p.NgayCapNhat DESC, p.MaPhim DESC`
  );
  res.json(rows);
});

adminRouter.post("/movies", async (req, res) => {
  const payload = req.body;
  const result = await query(
    `INSERT INTO phim (TenPhim, TieuDe, MoTa, NoiDung, ThoiLuong, NamPhatHanh,
                       TinhTrang, PhanLoai, HinhAnh, HinhAnhBanner, MaQuocGia, aws_status)
     VALUES (:TenPhim, :TieuDe, :MoTa, :NoiDung, :ThoiLuong, :NamPhatHanh,
             :TinhTrang, :PhanLoai, :HinhAnh, :HinhAnhBanner, :MaQuocGia, 'draft')`,
    {
      TenPhim: payload.TenPhim,
      TieuDe: payload.TieuDe || null,
      MoTa: payload.MoTa || null,
      NoiDung: payload.NoiDung || null,
      ThoiLuong: payload.ThoiLuong || null,
      NamPhatHanh: payload.NamPhatHanh || null,
      TinhTrang: payload.TinhTrang || "Đang chiếu",
      PhanLoai: payload.PhanLoai || "Lẻ",
      HinhAnh: payload.HinhAnh || null,
      HinhAnhBanner: payload.HinhAnhBanner || null,
      MaQuocGia: payload.MaQuocGia || null
    }
  );

  res.status(201).json({ MaPhim: result.insertId });
});

adminRouter.put("/movies/:id", async (req, res) => {
  const payload = req.body;
  await query(
    `UPDATE phim
     SET TenPhim = :TenPhim, TieuDe = :TieuDe, MoTa = :MoTa, NoiDung = :NoiDung,
         ThoiLuong = :ThoiLuong, NamPhatHanh = :NamPhatHanh, TinhTrang = :TinhTrang,
         PhanLoai = :PhanLoai, HinhAnh = :HinhAnh, HinhAnhBanner = :HinhAnhBanner,
         MaQuocGia = :MaQuocGia
     WHERE MaPhim = :id`,
    {
      id: req.params.id,
      TenPhim: payload.TenPhim,
      TieuDe: payload.TieuDe || null,
      MoTa: payload.MoTa || null,
      NoiDung: payload.NoiDung || null,
      ThoiLuong: payload.ThoiLuong || null,
      NamPhatHanh: payload.NamPhatHanh || null,
      TinhTrang: payload.TinhTrang || "Đang chiếu",
      PhanLoai: payload.PhanLoai || "Lẻ",
      HinhAnh: payload.HinhAnh || null,
      HinhAnhBanner: payload.HinhAnhBanner || null,
      MaQuocGia: payload.MaQuocGia || null
    }
  );

  res.json({ ok: true });
});

adminRouter.delete("/movies/:id", async (req, res) => {
  await query("DELETE FROM phim WHERE MaPhim = :id", { id: req.params.id });
  res.json({ ok: true });
});

adminRouter.get("/movies/:id/episodes", async (req, res) => {
  const rows = await query(
    `SELECT MaTap, MaPhim, TenTap, original_file, hls_url, cloudfront_url,
            s3_input_key, upload_status, mediaconvert_job_id, error_message, duration
     FROM tapphim
     WHERE MaPhim = :id
     ORDER BY MaTap ASC`,
    { id: req.params.id }
  );
  res.json(rows);
});

adminRouter.post("/movies/:id/episodes", async (req, res) => {
  const { TenTap } = req.body;
  const result = await query(
    "INSERT INTO tapphim (MaPhim, TenTap, upload_status) VALUES (:MaPhim, :TenTap, 'pending')",
    { MaPhim: req.params.id, TenTap: TenTap || "Tập 1" }
  );
  res.status(201).json({ MaTap: result.insertId });
});

adminRouter.post("/episodes/:id/presigned-upload", async (req, res) => {
  const { filename, contentType = "video/mp4", fileSizeBytes } = req.body;
  if (!filename || !filename.toLowerCase().endsWith(".mp4")) {
    return res.status(400).json({ message: "Chỉ hỗ trợ upload file .mp4." });
  }

  const [episode] = await query("SELECT MaTap, MaPhim FROM tapphim WHERE MaTap = :id", {
    id: req.params.id
  });
  if (!episode) return res.status(404).json({ message: "Không tìm thấy tập phim." });

  const key = buildInputKey({
    movieId: episode.MaPhim,
    episodeId: episode.MaTap,
    filename
  });
  const uploadUrl = await createUploadUrl({ key, contentType });

  await query(
    `UPDATE tapphim
     SET s3_input_bucket = :bucket, s3_input_key = :s3Key, original_file = :filename,
         upload_status = 'uploading', file_size_bytes = :fileSizeBytes
     WHERE MaTap = :MaTap`,
    {
      bucket: env.aws.inputBucket,
      s3Key: key,
      filename,
      fileSizeBytes: fileSizeBytes || null,
      MaTap: episode.MaTap
    }
  );

  await query(
    `INSERT INTO aws_upload_sessions
      (MaTap, MaPhim, admin_user_id, s3_bucket, s3_key, original_filename,
       content_type, file_size_bytes, presigned_url_expired_at)
     VALUES (:MaTap, :MaPhim, :adminId, :bucket, :s3Key, :filename,
             :contentType, :fileSizeBytes, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
    {
      MaTap: episode.MaTap,
      MaPhim: episode.MaPhim,
      adminId: req.user.id,
      bucket: env.aws.inputBucket,
      s3Key: key,
      filename,
      contentType,
      fileSizeBytes: fileSizeBytes || null
    }
  );

  logger.info({ episodeId: episode.MaTap, key }, "created s3 presigned upload");
  res.json({ uploadUrl, key, bucket: env.aws.inputBucket, expiresIn: 3600 });
});

adminRouter.post("/episodes/:id/mark-uploaded", async (req, res) => {
  await query(
    "UPDATE tapphim SET upload_status = 'uploaded' WHERE MaTap = :id",
    { id: req.params.id }
  );
  await query(
    "UPDATE aws_upload_sessions SET status = 'uploaded' WHERE MaTap = :id ORDER BY id DESC LIMIT 1",
    { id: req.params.id }
  );
  res.json({ ok: true });
});

adminRouter.post("/episodes/:id/convert", async (req, res) => {
  const [episode] = await query("SELECT * FROM tapphim WHERE MaTap = :id", { id: req.params.id });
  if (!episode) return res.status(404).json({ message: "Không tìm thấy tập phim." });
  if (!episode.s3_input_key) return res.status(400).json({ message: "Tập phim chưa có file S3 input." });

  const outputPrefix = buildOutputPrefix({ movieId: episode.MaPhim, episodeId: episode.MaTap });
  const response = await createMediaConvertJob({
    inputKey: episode.s3_input_key,
    outputPrefix,
    movieId: episode.MaPhim,
    episodeId: episode.MaTap
  });

  const job = response.Job;
  const hlsMasterKey = `${outputPrefix}index.m3u8`;
  const cloudfrontUrl = buildCloudFrontUrl(hlsMasterKey);

  await query(
    `UPDATE tapphim
     SET s3_output_bucket = :outputBucket, s3_output_prefix = :outputPrefix,
         hls_master_key = :hlsMasterKey, cloudfront_url = :cloudfrontUrl,
         hls_url = :cloudfrontUrl, mediaconvert_job_id = :jobId,
         mediaconvert_role_arn = :roleArn, aws_region = :region,
         upload_status = 'processing'
     WHERE MaTap = :MaTap`,
    {
      outputBucket: env.aws.outputBucket,
      outputPrefix,
      hlsMasterKey,
      cloudfrontUrl,
      jobId: job.Id,
      roleArn: env.aws.mediaConvertRoleArn,
      region: env.aws.region,
      MaTap: episode.MaTap
    }
  );

  await query(
    `INSERT INTO aws_mediaconvert_jobs
      (MaTap, job_id, job_arn, input_bucket, input_key, output_bucket, output_prefix, status, submitted_at)
     VALUES (:MaTap, :jobId, :jobArn, :inputBucket, :inputKey, :outputBucket, :outputPrefix, 'SUBMITTED', NOW())`,
    {
      MaTap: episode.MaTap,
      jobId: job.Id,
      jobArn: job.Arn || null,
      inputBucket: env.aws.inputBucket,
      inputKey: episode.s3_input_key,
      outputBucket: env.aws.outputBucket,
      outputPrefix
    }
  );

  logger.info({ jobId: job.Id, episodeId: episode.MaTap }, "mediaconvert job submitted");
  res.json({ jobId: job.Id, cloudfrontUrl, outputPrefix });
});

adminRouter.get("/episodes/:id/job-status", async (req, res) => {
  const [episode] = await query("SELECT * FROM tapphim WHERE MaTap = :id", { id: req.params.id });
  if (!episode) return res.status(404).json({ message: "Không tìm thấy tập phim." });
  if (!episode.mediaconvert_job_id) return res.status(400).json({ message: "Tập phim chưa có MediaConvert job." });

  const response = await getMediaConvertJob(episode.mediaconvert_job_id);
  const job = response.Job;
  const status = job.Status;
  const percent = job.JobPercentComplete || 0;
  const uploadStatus = status === "COMPLETE" ? "ready" : status === "ERROR" ? "failed" : "processing";

  await query(
    `UPDATE aws_mediaconvert_jobs
     SET status = :status, percent_complete = :percent,
         error_code = :errorCode, error_message = :errorMessage,
         finished_at = CASE WHEN :status IN ('COMPLETE','ERROR','CANCELED') THEN NOW() ELSE finished_at END
     WHERE job_id = :jobId`,
    {
      status,
      percent,
      errorCode: job.ErrorCode || null,
      errorMessage: job.ErrorMessage || null,
      jobId: episode.mediaconvert_job_id
    }
  );

  await query("UPDATE tapphim SET upload_status = :uploadStatus, error_message = :errorMessage WHERE MaTap = :MaTap", {
    uploadStatus,
    errorMessage: job.ErrorMessage || null,
    MaTap: episode.MaTap
  });

  if (status === "COMPLETE") {
    const variants = [
      ["720p", 1280, 720, 2500, `${episode.s3_output_prefix || ""}index_720p.m3u8`],
      ["480p", 854, 480, 1200, `${episode.s3_output_prefix || ""}index_480p.m3u8`],
      ["360p", 640, 360, 700, `${episode.s3_output_prefix || ""}index_360p.m3u8`]
    ];
    for (const [quality, width, height, bitrate, key] of variants) {
      await query(
        `INSERT INTO video_bitrates
          (MaTap, quality_label, width, height, bitrate_kbps, playlist_key, playlist_url)
         VALUES (:MaTap, :quality, :width, :height, :bitrate, :playlistKey, :playlistUrl)
         ON DUPLICATE KEY UPDATE playlist_key = VALUES(playlist_key), playlist_url = VALUES(playlist_url)`,
        {
          MaTap: episode.MaTap,
          quality,
          width,
          height,
          bitrate,
          playlistKey: key,
          playlistUrl: buildCloudFrontUrl(key)
        }
      );
    }
  }

  res.json({ status, percent, errorCode: job.ErrorCode, errorMessage: job.ErrorMessage });
});

adminRouter.post("/movies/:id/publish", async (req, res) => {
  const isPublished = req.body.isPublished ?? true;
  await query(
    `UPDATE phim
     SET is_published = :isPublished,
         published_at = CASE WHEN :isPublished = 1 THEN NOW() ELSE NULL END,
         aws_status = CASE WHEN :isPublished = 1 THEN 'ready' ELSE aws_status END
     WHERE MaPhim = :id`,
    { id: req.params.id, isPublished: isPublished ? 1 : 0 }
  );
  res.json({ ok: true, isPublished: Boolean(isPublished) });
});

adminRouter.get("/dashboard", async (req, res) => {
  const [totals] = await query(
    `SELECT
      (SELECT COUNT(*) FROM phim) AS movie_count,
      (SELECT COUNT(*) FROM tapphim) AS episode_count,
      (SELECT COUNT(*) FROM stream_view_logs) AS view_count,
      (SELECT COALESCE(SUM(watch_seconds), 0) FROM stream_view_logs) AS watch_seconds,
      (SELECT COUNT(*) FROM aws_mediaconvert_jobs WHERE status = 'ERROR') AS failed_jobs,
      (SELECT COUNT(*) FROM tapphim WHERE upload_status = 'processing') AS processing_episodes`
  );
  const topMovies = await query(
    `SELECT p.MaPhim, p.TenPhim, COUNT(l.id) AS views, COALESCE(SUM(l.watch_seconds), 0) AS watch_seconds
     FROM phim p
     LEFT JOIN stream_view_logs l ON l.MaPhim = p.MaPhim
     GROUP BY p.MaPhim
     ORDER BY views DESC
     LIMIT 8`
  );

  res.json({ totals, topMovies });
});
