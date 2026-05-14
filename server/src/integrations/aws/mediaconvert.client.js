const { MediaConvertClient } = require('@aws-sdk/client-mediaconvert');
const env = require('../../config/env');
const { requireAwsConfig } = require('./config');

let client;

function getMediaConvertClient() {
  requireAwsConfig(['region', 'mediaConvertEndpoint']);

  if (!client) {
    client = new MediaConvertClient({
      region: env.aws.region,
      endpoint: env.aws.mediaConvertEndpoint
    });
  }

  return client;
}

module.exports = {
  getMediaConvertClient
};
