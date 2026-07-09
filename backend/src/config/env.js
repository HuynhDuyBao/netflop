const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const aliases = {
  DB_DATABASE: process.env.DB_DATABASE || process.env.DB_NAME,
  DB_USERNAME: process.env.DB_USERNAME || process.env.DB_USER
};

const required = ['DB_HOST', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (!aliases.DB_DATABASE) {
  throw new Error('Missing required environment variable: DB_NAME');
}

if (!aliases.DB_USERNAME) {
  throw new Error('Missing required environment variable: DB_USER');
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: aliases.DB_DATABASE,
    user: aliases.DB_USERNAME,
    password: process.env.DB_PASSWORD || '',
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10)
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  tmdb: {
    apiKey: process.env.TMDB_API_KEY || '',
    accessToken: process.env.TMDB_ACCESS_TOKEN || '',
    baseUrl: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
    imageBaseUrl: process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p'
  },
  aws: {
    region: process.env.AWS_REGION || 'ap-southeast-1',
    s3InputBucket: process.env.AWS_S3_INPUT_BUCKET || '',
    s3OutputBucket: process.env.AWS_S3_OUTPUT_BUCKET || '',
    cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN || '',
    mediaConvertRoleArn: process.env.AWS_MEDIACONVERT_ROLE_ARN || '',
    mediaConvertEndpoint: process.env.AWS_MEDIACONVERT_ENDPOINT || '',
    mediaConvertWebhookSecret: process.env.AWS_MEDIACONVERT_WEBHOOK_SECRET || '',
    cognitoUserPoolId: process.env.AWS_COGNITO_USER_POOL_ID || '',
    cognitoClientId: process.env.AWS_COGNITO_CLIENT_ID || '',
    cognitoClientSecret: process.env.AWS_COGNITO_CLIENT_SECRET || '',
    cognitoDomain: process.env.AWS_COGNITO_DOMAIN || '',
    cognitoRedirectUri: process.env.AWS_COGNITO_REDIRECT_URI || 'http://localhost:5173/auth/callback',
    cognitoLogoutUri: process.env.AWS_COGNITO_LOGOUT_URI || 'http://localhost:5173/'
  }
};
