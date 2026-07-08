const awsConfig = require('../config/aws');
const HttpError = require('../utils/httpError');

function assertS3Config() {
  if (!awsConfig.s3InputBucket) {
    throw new HttpError(500, 'AWS_S3_INPUT_BUCKET chua duoc cau hinh.');
  }
}

async function uploadVideo(file, { movieId, episodeName }) {
  assertS3Config();

  if (!file) {
    throw new HttpError(400, 'Chua co file video de upload.');
  }

  let S3Client;
  let PutObjectCommand;

  try {
    ({ S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'));
  } catch (error) {
    throw new HttpError(500, 'Missing AWS SDK. Run: npm --prefix backend install');
  }

  const safeName = String(file.originalname || 'video').replace(/[^a-zA-Z0-9._-]/g, '-');
  const key = `movies/${movieId}/episodes/${Date.now()}-${safeName}`;
  const client = new S3Client({ region: awsConfig.region });

  await client.send(
    new PutObjectCommand({
      Bucket: awsConfig.s3InputBucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || 'application/octet-stream',
      Metadata: {
        movieId: String(movieId),
        episodeName: String(episodeName || '')
      }
    })
  );

  return {
    bucket: awsConfig.s3InputBucket,
    key,
    s3Uri: `s3://${awsConfig.s3InputBucket}/${key}`
  };
}

function getPublicObjectUrl(bucket, key) {
  if (!bucket || !key) {
    return null;
  }

  const encodedKey = String(key)
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');

  return `https://${bucket}.s3.${awsConfig.region}.amazonaws.com/${encodedKey}`;
}

module.exports = {
  getPublicObjectUrl,
  uploadVideo
};
