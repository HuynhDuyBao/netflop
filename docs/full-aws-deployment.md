# Deploy Full AWS Cho Netflop

Tài liệu này thay XAMPP/local bằng AWS hoàn toàn:

```text
React -> S3 + CloudFront
Node.js API -> Elastic Beanstalk
MySQL -> Amazon RDS MySQL
Video -> S3 input + MediaConvert + S3 output + CloudFront
Log/metric -> CloudWatch
```

## 1. Tạo hạ tầng core bằng CloudFormation

Chạy ở repo root:

```bash
aws cloudformation deploy \
  --template-file infra/cloudformation/full-aws-core.yaml \
  --stack-name netflop-core \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ProjectName=netflop \
    DbName=webapixemphim \
    DbUsername=admin \
    DbPassword=YourStrongPassword123 \
    AllowedFrontendOrigin=http://localhost:5173
```

Lấy output:

```bash
aws cloudformation describe-stacks \
  --stack-name netflop-core \
  --query "Stacks[0].Outputs"
```

Bạn cần ghi lại:

- `RdsEndpoint`
- `FrontendBucketName`
- `FrontendCloudFrontDomain`
- `FrontendCloudFrontDistributionId`
- `VideoInputBucketName`
- `VideoOutputBucketName`
- `VideoCloudFrontDomain`
- `MediaConvertRoleArn`
- `BackendAwsManagedPolicyArn`
- `VpcId`
- `PublicSubnetIds`
- `BackendSecurityGroupId`

## 2. Import database SQL vào RDS

RDS trong template là private, không mở public internet. Cách an toàn cho đồ án:

1. Deploy backend Elastic Beanstalk trước, gắn cùng VPC và `BackendSecurityGroupId`.
2. SSH vào EC2 của Elastic Beanstalk.
3. Cài MySQL client nếu instance chưa có.
4. Copy file SQL lên instance hoặc upload SQL lên S3 rồi tải xuống.
5. Import:

```bash
mysql -h YOUR_RDS_ENDPOINT -u admin -p webapixemphim < webapixemphim_aws_xampp.sql
```

Nếu chỉ cần demo nhanh, có thể tạm tạo một EC2 bastion public trong cùng VPC, gắn `BackendSecurityGroupId`, import xong thì terminate EC2 đó.

## 3. Deploy backend Node.js lên Elastic Beanstalk

Cài EB CLI:

```bash
pip install awsebcli
```

Tạo app:

```bash
cd backend
eb init netflop-api --platform node.js --region ap-southeast-1
eb create netflop-api-prod --single --vpc
```

Khi EB hỏi VPC/subnet/security group:

- VPC: `VpcId` từ CloudFormation.
- Subnets: `PublicSubnetIds`.
- Security group: `BackendSecurityGroupId`.

Gắn policy AWS cho instance profile của Elastic Beanstalk:

1. Vào IAM.
2. Tìm role EC2 instance profile của EB, thường có dạng `aws-elasticbeanstalk-ec2-role`.
3. Attach managed policy từ output `BackendAwsManagedPolicyArn`.

Set environment variables:

```bash
eb setenv \
  NODE_ENV=production \
  PORT=8080 \
  CLIENT_ORIGIN=https://YOUR_FRONTEND_CLOUDFRONT_DOMAIN \
  DB_HOST=YOUR_RDS_ENDPOINT \
  DB_PORT=3306 \
  DB_USER=admin \
  DB_PASSWORD=YourStrongPassword123 \
  DB_NAME=webapixemphim \
  JWT_SECRET=YourLongRandomJwtSecret \
  JWT_EXPIRES_IN=7d \
  AWS_REGION=ap-southeast-1 \
  AWS_S3_INPUT_BUCKET=YOUR_VIDEO_INPUT_BUCKET \
  AWS_S3_OUTPUT_BUCKET=YOUR_VIDEO_OUTPUT_BUCKET \
  AWS_CLOUDFRONT_DOMAIN=https://YOUR_VIDEO_CLOUDFRONT_DOMAIN \
  AWS_MEDIACONVERT_ENDPOINT=YOUR_MEDIACONVERT_ENDPOINT \
  AWS_MEDIACONVERT_ROLE_ARN=YOUR_MEDIACONVERT_ROLE_ARN
```

Lấy MediaConvert endpoint:

```bash
aws mediaconvert describe-endpoints --region ap-southeast-1
```

Deploy:

```bash
eb deploy
eb open
```

Health check:

```text
https://YOUR_EB_DOMAIN/api/health
```

## 4. Tạo admin trên RDS

Sau khi backend kết nối được RDS, chạy từ máy local nếu RDS accessible qua tunnel/bastion, hoặc chạy trên EB instance:

```bash
npm run create-admin -- admin Admin@123 admin@netflop.local
```

Nếu chạy trên EB instance, vào thư mục app hiện tại rồi chạy lệnh trên.

## 5. Deploy frontend lên S3 + CloudFront

Ở repo root, chạy PowerShell:

```powershell
.\scripts\deploy-frontend.ps1 `
  -BucketName "YOUR_FRONTEND_BUCKET" `
  -ApiUrl "https://YOUR_EB_DOMAIN/api" `
  -DistributionId "YOUR_FRONTEND_DISTRIBUTION_ID"
```

Mở:

```text
https://YOUR_FRONTEND_CLOUDFRONT_DOMAIN
```

Sau khi có domain frontend thật, cập nhật CORS input bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": ["https://YOUR_FRONTEND_CLOUDFRONT_DOMAIN"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Sau đó cập nhật EB env:

```bash
eb setenv CLIENT_ORIGIN=https://YOUR_FRONTEND_CLOUDFRONT_DOMAIN
```

## 6. Luồng demo full AWS

1. Mở frontend CloudFront.
2. Admin login.
3. Tạo phim.
4. Thêm tập.
5. Upload MP4: browser upload trực tiếp lên S3 input bằng presigned URL do backend AWS cấp.
6. Convert HLS: backend AWS gọi MediaConvert.
7. Check job đến khi `COMPLETE`.
8. Publish phim.
9. User xem phim qua video CloudFront.
10. `hls.js` đọc `index.m3u8` và tự adaptive bitrate.

## 7. CloudWatch

Elastic Beanstalk tự đẩy health/log cơ bản lên CloudWatch. Với đồ án, cần chụp:

- EB environment health.
- Backend logs khi login/upload/convert.
- RDS metrics: CPU, connections, storage.
- CloudFront metrics: requests, 4xx, 5xx.
- S3 bucket size.
- MediaConvert job status.

Alarm nên tạo:

- EB 5xx hoặc health degraded.
- RDS CPU > 80%.
- RDS free storage thấp.
- CloudFront 5xx cao.
- AWS Budget vượt ngưỡng.

## 8. Cleanup

Xóa theo thứ tự:

1. Delete EB environment.
2. Empty S3 input/output/frontend buckets.
3. Disable rồi delete CloudFront distributions nếu CloudFormation không xóa được ngay.
4. Delete CloudFormation stack `netflop-core`.
5. Xóa snapshots RDS nếu không cần.
6. Kiểm tra Billing.
