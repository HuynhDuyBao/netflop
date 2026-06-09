const episodeModel = require('../models/episode.model');
const awsS3Service = require('../services/awsS3.service');
const mediaConvertService = require('../services/mediaConvert.service');
const cloudFrontService = require('../services/cloudFront.service');
const fs = require('fs/promises');
const path = require('path');
const HttpError = require('../utils/httpError');

const uploadRoot = path.resolve(__dirname, '../../uploads');
const allowedMedia = {
  avatar: {
    dir: 'avatars',
    mime: /^image\//,
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
    maxSize: 8 * 1024 * 1024
  },
  poster: {
    dir: 'posters',
    mime: /^image\//,
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
    maxSize: 12 * 1024 * 1024
  },
  banner: {
    dir: 'banners',
    mime: /^image\//,
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
    maxSize: 16 * 1024 * 1024
  },
  trailer: {
    dir: 'trailers',
    mime: /^video\//,
    extensions: ['.mp4', '.webm', '.mov', '.m4v'],
    maxSize: 250 * 1024 * 1024
  },
  video: {
    dir: 'videos',
    mime: /^video\//,
    extensions: ['.mp4', '.webm', '.mov', '.m4v'],
    maxSize: 500 * 1024 * 1024
  },
  hls: {
    dir: 'hls',
    mime: /^(application\/vnd\.apple\.mpegurl|application\/x-mpegurl|audio\/mpegurl|application\/octet-stream)$/,
    extensions: ['.m3u8'],
    maxSize: 10 * 1024 * 1024
  },
  subtitle: {
    dir: 'subtitles',
    mime: /^(text\/vtt|text\/plain|application\/octet-stream)$/,
    extensions: ['.vtt'],
    maxSize: 5 * 1024 * 1024
  }
};

function publicBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

function safeFileName(originalName) {
  const parsed = path.parse(originalName || 'file');
  const baseName = parsed.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'file';
  return `${Date.now()}-${baseName}${parsed.ext.toLowerCase()}`;
}

async function uploadMedia(req, res, next) {
  try {
    const body = req.body || {};
    const category = String(body.category || req.query.category || 'poster').toLowerCase();
    const rules = allowedMedia[category];

    if (!rules) {
      throw new HttpError(400, 'Loai tep upload khong hop le.');
    }

    if (!req.file) {
      throw new HttpError(400, 'Chua co tep de upload.');
    }

    const extension = path.extname(req.file.originalname || '').toLowerCase();

    if (!rules.extensions.includes(extension)) {
      throw new HttpError(400, 'Dinh dang tep khong duoc ho tro.');
    }

    if (!rules.mime.test(req.file.mimetype || '')) {
      throw new HttpError(400, 'Kieu tep khong dung voi muc upload.');
    }

    if (req.file.size > rules.maxSize) {
      throw new HttpError(400, 'Tep vuot qua dung luong cho phep.');
    }

    const targetDir = path.join(uploadRoot, rules.dir);
    await fs.mkdir(targetDir, { recursive: true });

    const filename = safeFileName(req.file.originalname);
    const absolutePath = path.join(targetDir, filename);
    await fs.writeFile(absolutePath, req.file.buffer);

    const relativeUrl = `/uploads/${rules.dir}/${filename}`;

    res.status(201).json({
      success: true,
      message: 'Upload tep thanh cong.',
      data: {
        category,
        filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: relativeUrl,
        url: `${publicBaseUrl(req)}${relativeUrl}`
      }
    });
  } catch (error) {
    next(error);
  }
}

async function uploadVideo(req, res, next) {
  try {
    const movieId = Number(req.body.movieId);
    const episodeName = req.body.episodeName || req.body.name || 'Episode';

    const uploaded = await awsS3Service.uploadVideo(req.file, {
      movieId,
      episodeName
    });

    const pendingEpisode = await episodeModel.createUploadEpisode({
      movieId,
      name: episodeName,
      sourceUrl: uploaded.s3Uri,
      hlsUrl: null,
      cloudFrontUrl: null,
      uploadStatus: 'uploaded',
      duration: req.body.duration
    });

    const job = await mediaConvertService.createHlsJob({
      inputS3Uri: uploaded.s3Uri,
      movieId,
      episodeId: pendingEpisode.MaTap
    });

    const cloudFrontUrl = cloudFrontService.getUrl(job.masterKey);

    res.status(201).json({
      success: true,
      message: 'Da upload video va tao job xu ly HLS.',
      data: {
        episode: pendingEpisode,
        s3: uploaded,
        mediaConvert: job,
        cloudFrontUrl
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadMedia,
  uploadVideo
};
