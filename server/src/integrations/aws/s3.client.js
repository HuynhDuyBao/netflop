const { S3Client } = require('@aws-sdk/client-s3');
const env = require('../../config/env');
const { requireAwsConfig } = require('./config');

let client;

function getS3Client() {
  requireAwsConfig(['region']);

  if (!client) {
    client = new S3Client({
      region: env.aws.region
    });
  }

  return client;
}

module.exports = {
  getS3Client
};
