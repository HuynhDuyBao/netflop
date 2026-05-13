import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "webapixemphim"
  },
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  aws: {
    region: process.env.AWS_REGION || "ap-southeast-1",
    inputBucket: process.env.AWS_S3_INPUT_BUCKET || "",
    outputBucket: process.env.AWS_S3_OUTPUT_BUCKET || "",
    cloudFrontDomain: (process.env.AWS_CLOUDFRONT_DOMAIN || "").replace(/\/$/, ""),
    mediaConvertEndpoint: process.env.AWS_MEDIACONVERT_ENDPOINT || "",
    mediaConvertRoleArn: process.env.AWS_MEDIACONVERT_ROLE_ARN || ""
  }
};
