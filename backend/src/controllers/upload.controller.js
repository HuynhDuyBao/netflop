const episodeModel = require('../models/episode.model');
const awsS3Service = require('../services/awsS3.service');
const mediaConvertService = require('../services/mediaConvert.service');
const cloudFrontService = require('../services/cloudFront.service');
const awsConfig = require('../config/aws');
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

function getMasterUrls(masterKey) {
  return {
    hlsUrl: awsS3Service.getPublicObjectUrl(awsConfig.s3OutputBucket, masterKey),
    cloudFrontUrl: cloudFrontService.getUrl(masterKey)
  };
}

function normalizeMediaConvertStatus(status) {
  return String(status || '').toUpperCase();
}

function getEventJobId(eventBody) {
  return eventBody?.detail?.jobId || eventBody?.detail?.job_id || eventBody?.jobId || eventBody?.job_id || '';
}

function getEventStatus(eventBody) {
  return eventBody?.detail?.status || eventBody?.status || '';
}

function getEventMetadata(eventBody) {
  return eventBody?.detail?.userMetadata || eventBody?.detail?.user_metadata || eventBody?.userMetadata || {};
}

function getEventError(eventBody) {
  return eventBody?.detail?.errorMessage
    || eventBody?.detail?.error_message
    || eventBody?.detail?.message
    || eventBody?.errorMessage
    || 'MediaConvert job failed.';
}

function assertWebhookSecret(req) {
  if (!awsConfig.mediaConvertWebhookSecret) {
    return;
  }

  const receivedSecret = req.get('x-netflop-event-secret');
  if (receivedSecret !== awsConfig.mediaConvertWebhookSecret) {
    throw new HttpError(401, 'MediaConvert webhook secret khong hop le.');
  }
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

    const playbackUrls = getMasterUrls(job.masterKey);
    const episode = await episodeModel.updateUploadProcessing(pendingEpisode.MaTap, {
      jobId: job.jobId,
      hlsUrl: playbackUrls.hlsUrl,
      cloudFrontUrl: playbackUrls.cloudFrontUrl,
      outputKey: job.masterKey
    });

    res.status(201).json({
      success: true,
      message: 'Da upload video va tao job xu ly HLS.',
      data: {
        episode,
        s3: uploaded,
        mediaConvert: job,
        hlsUrl: playbackUrls.hlsUrl,
        cloudFrontUrl: playbackUrls.cloudFrontUrl
      }
    });
  } catch (error) {
    next(error);
  }
}

async function handleMediaConvertEvent(req, res, next) {
  try {
    assertWebhookSecret(req);

    const jobId = getEventJobId(req.body);
    const status = normalizeMediaConvertStatus(getEventStatus(req.body));
    const metadata = getEventMetadata(req.body);
    const episodeId = Number(metadata.episodeId || req.body?.episodeId);

    if (!jobId && !episodeId) {
      throw new HttpError(400, 'Thieu MediaConvert job id hoac episode id.');
    }

    const episode = episodeId
      ? await episodeModel.findById(episodeId)
      : await episodeModel.findByMediaConvertJobId(jobId);

    if (!episode) {
      throw new HttpError(404, 'Khong tim thay tap phim cho MediaConvert job.');
    }

    const masterKey = metadata.masterKey || episode.hls_output_key;
    const playbackUrls = getMasterUrls(masterKey);
    let updatedEpisode = episode;

    if (status === 'COMPLETE') {
      updatedEpisode = await episodeModel.markUploadReady(episode.MaTap, {
        hlsUrl: playbackUrls.hlsUrl,
        cloudFrontUrl: playbackUrls.cloudFrontUrl,
        outputKey: masterKey
      });
    } else if (['ERROR', 'CANCELED'].includes(status)) {
      updatedEpisode = await episodeModel.markUploadFailed(episode.MaTap, {
        errorMessage: getEventError(req.body)
      });
    }

    res.json({
      success: true,
      message: 'Da nhan su kien MediaConvert.',
      data: {
        jobId,
        status,
        episode: updatedEpisode
      }
    });
  } catch (error) {
    next(error);
  }
}

async function syncVideoStatus(req, res, next) {
  try {
    const episode = await episodeModel.findById(Number(req.params.episodeId));

    if (!episode) {
      throw new HttpError(404, 'Khong tim thay tap phim.');
    }

    if (!episode.media_convert_job_id) {
      throw new HttpError(400, 'Tap phim nay chua co MediaConvert job id.');
    }

    const job = await mediaConvertService.getJob(episode.media_convert_job_id);
    const status = normalizeMediaConvertStatus(job?.Status);
    const masterKey = job?.UserMetadata?.masterKey || episode.hls_output_key;
    const playbackUrls = getMasterUrls(masterKey);
    let updatedEpisode = episode;

    if (status === 'COMPLETE') {
      updatedEpisode = await episodeModel.markUploadReady(episode.MaTap, {
        hlsUrl: playbackUrls.hlsUrl,
        cloudFrontUrl: playbackUrls.cloudFrontUrl,
        outputKey: masterKey
      });
    } else if (['ERROR', 'CANCELED'].includes(status)) {
      updatedEpisode = await episodeModel.markUploadFailed(episode.MaTap, {
        errorMessage: job?.ErrorMessage || 'MediaConvert job failed.'
      });
    }

    res.json({
      success: true,
      message: 'Da dong bo trang thai MediaConvert.',
      data: {
        mediaConvert: {
          jobId: job?.Id,
          status
        },
        episode: updatedEpisode
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleMediaConvertEvent,
  syncVideoStatus,
  uploadMedia,
  uploadVideo
};
