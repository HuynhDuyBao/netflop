const awsConfig = require('../config/aws');

function getUrl(key) {
  const domain = (awsConfig.cloudFrontDomain || '').replace(/\/$/, '');
  return domain ? `${domain}/${key}` : null;
}

module.exports = {
  getUrl
};
