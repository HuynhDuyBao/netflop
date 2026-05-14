const env = require('../../config/env');

function requireAwsConfig(keys) {
  const missing = keys.filter((key) => !env.aws[key]);

  if (missing.length > 0) {
    throw new Error(`Missing AWS configuration: ${missing.join(', ')}`);
  }
}

module.exports = {
  requireAwsConfig
};
