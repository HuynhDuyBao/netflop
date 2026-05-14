const { getMediaConvertClient } = require('./mediaconvert.client');
const { getS3Client } = require('./s3.client');
const { createHlsTranscodeJob, getTranscodeJob } = require('./transcode.service');
const { createPresignedUploadUrl } = require('./upload.service');

module.exports = {
  createHlsTranscodeJob,
  createPresignedUploadUrl,
  getTranscodeJob,
  getMediaConvertClient,
  getS3Client
};
