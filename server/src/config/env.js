const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const required = ['DB_HOST', 'DB_DATABASE', 'DB_USERNAME', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || '',
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10)
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 300)
  },
  aws: {
    region: process.env.AWS_REGION || '',
    inputBucket: process.env.AWS_INPUT_BUCKET || '',
    outputBucket: process.env.AWS_OUTPUT_BUCKET || '',
    cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN || '',
    mediaConvertEndpoint: process.env.AWS_MEDIACONVERT_ENDPOINT || '',
    mediaConvertRoleArn: process.env.AWS_MEDIACONVERT_ROLE_ARN || ''
  }
};
