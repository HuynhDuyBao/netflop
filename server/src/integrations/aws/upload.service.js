const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const env = require('../../config/env');
const { requireAwsConfig } = require('./config');
const { getS3Client } = require('./s3.client');

async function createPresignedUploadUrl({ key, contentType, expiresIn = 900 }) {
  requireAwsConfig(['inputBucket']);

  const command = new PutObjectCommand({
    Bucket: env.aws.inputBucket,
    Key: key,
    ContentType: contentType
  });

  return getSignedUrl(getS3Client(), command, { expiresIn });
}

module.exports = {
  createPresignedUploadUrl
};
