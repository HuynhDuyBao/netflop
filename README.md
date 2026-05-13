# Netflop Movie Streaming

Website xem phim dùng React, Node.js và AWS full stack: S3 + CloudFront, Elastic Beanstalk, RDS MySQL, MediaConvert và CloudWatch.

## Kiến trúc production full AWS

```text
React -> S3 + CloudFront
Node.js API -> Elastic Beanstalk
Database -> Amazon RDS MySQL
Video -> S3 input + MediaConvert + S3 output + CloudFront
Monitoring -> CloudWatch
```

## Chạy local

1. Import database:

   ```text
   C:\Users\Admin\Downloads\webapixemphim_aws_xampp.sql
   ```

2. Cài dependencies:

   ```bash
   npm run install:all
   ```

3. Tạo `backend/.env` từ `backend/.env.example` và điền thông tin MySQL/AWS.

4. Tạo tài khoản admin demo:

   ```bash
   npm run create-admin --prefix backend -- admin Admin@123 admin@netflop.local
   ```

5. Chạy app:

   ```bash
   npm run dev
   ```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:4000`

## Deploy full AWS

1. Tạo core infrastructure:

   ```bash
   aws cloudformation deploy --template-file infra/cloudformation/full-aws-core.yaml --stack-name netflop-core --capabilities CAPABILITY_NAMED_IAM --parameter-overrides ProjectName=netflop DbPassword=YourStrongPassword123
   ```

2. Deploy backend lên Elastic Beanstalk theo [docs/full-aws-deployment.md](docs/full-aws-deployment.md).

3. Deploy frontend:

   ```powershell
   .\scripts\deploy-frontend.ps1 -BucketName "YOUR_FRONTEND_BUCKET" -ApiUrl "https://YOUR_EB_DOMAIN/api" -DistributionId "YOUR_FRONTEND_DISTRIBUTION_ID"
   ```

## Tài liệu đồ án

- [Hướng dẫn AWS end-to-end](docs/aws-deployment-guide.md)
- [Deploy full AWS](docs/full-aws-deployment.md)
- [Sơ đồ kiến trúc Mermaid](docs/architecture.md)
