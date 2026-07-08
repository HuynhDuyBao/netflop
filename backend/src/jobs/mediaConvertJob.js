const episodeModel = require('../models/episode.model');
const mediaConvertService = require('../services/mediaConvert.service');
const awsS3Service = require('../services/awsS3.service');
const cloudFrontService = require('../services/cloudFront.service');
const awsConfig = require('../config/aws');

const DEFAULT_INTERVAL_MS = 15000;
const DEFAULT_BATCH_SIZE = 10;
const FINISHED_STATUSES = ['COMPLETE', 'ERROR', 'CANCELED'];

let timer = null;
let running = false;

function normalizeStatus(status) {
  return String(status || '').toUpperCase();
}

function getPlaybackUrls(masterKey) {
  return {
    hlsUrl: awsS3Service.getPublicObjectUrl(awsConfig.s3OutputBucket, masterKey),
    cloudFrontUrl: cloudFrontService.getUrl(masterKey)
  };
}

async function syncEpisode(episode) {
  const job = await mediaConvertService.getJob(episode.media_convert_job_id);
  const status = normalizeStatus(job?.Status);

  if (!FINISHED_STATUSES.includes(status)) {
    return { episodeId: episode.MaTap, status };
  }

  if (status === 'COMPLETE') {
    const masterKey = job?.UserMetadata?.masterKey || episode.hls_output_key;
    const playbackUrls = getPlaybackUrls(masterKey);
    await episodeModel.markUploadReady(episode.MaTap, {
      hlsUrl: playbackUrls.hlsUrl,
      cloudFrontUrl: playbackUrls.cloudFrontUrl,
      outputKey: masterKey
    });
    return { episodeId: episode.MaTap, status };
  }

  await episodeModel.markUploadFailed(episode.MaTap, {
    errorMessage: job?.ErrorMessage || `MediaConvert job ${status}.`
  });
  return { episodeId: episode.MaTap, status };
}

async function runOnce() {
  if (running) return;
  running = true;

  try {
    const episodes = await episodeModel.listProcessingUploads({ limit: DEFAULT_BATCH_SIZE });

    for (const episode of episodes) {
      try {
        const result = await syncEpisode(episode);
        if (FINISHED_STATUSES.includes(result.status)) {
          console.log(`MediaConvert ${result.status}: episode ${result.episodeId}`);
        }
      } catch (error) {
        console.error(`Cannot sync MediaConvert episode ${episode.MaTap}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Cannot scan MediaConvert jobs:', error.message);
  } finally {
    running = false;
  }
}

function mediaConvertJob({ intervalMs = DEFAULT_INTERVAL_MS } = {}) {
  if (timer) {
    return timer;
  }

  runOnce();
  timer = setInterval(runOnce, intervalMs);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  return timer;
}

module.exports = mediaConvertJob;
