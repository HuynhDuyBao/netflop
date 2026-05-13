# Hướng Dẫn AWS End-to-End Cho Netflop

## 1. Chuẩn bị

- AWS account, bật Billing alert.
- Region đề xuất: `ap-southeast-1`.
- Cài AWS CLI và đăng nhập bằng `aws configure`.
- Import `webapixemphim_aws_xampp.sql` vào MySQL XAMPP trước khi chạy backend.

## 2. Tạo S3 buckets

Tạo:

- `netflop-input-<team>`: chứa MP4 gốc.
- `netflop-output-<team>`: chứa HLS output.

Cả hai bucket giữ private. Input bucket cần CORS để React upload bằng presigned URL:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": ["http://localhost:5173"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## 3. IAM

Tạo role `NetflopMediaConvertRole`.

Trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "mediaconvert.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Permission policy thay `<team>` bằng bucket thật:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::netflop-input-<team>",
        "arn:aws:s3:::netflop-input-<team>/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::netflop-output-<team>",
        "arn:aws:s3:::netflop-output-<team>/*"
      ]
    }
  ]
}
```

User/role chạy Node.js cần quyền tối thiểu:

- `s3:PutObject` vào input bucket.
- `mediaconvert:CreateJob`, `mediaconvert:GetJob`.
- `iam:PassRole` cho `NetflopMediaConvertRole`.

## 4. MediaConvert

Lấy endpoint:

```bash
aws mediaconvert describe-endpoints --region ap-southeast-1
```

Backend tạo job manual ABR:

- `720p`, 1280x720, khoảng 2500 kbps.
- `480p`, 854x480, khoảng 1200 kbps.
- `360p`, 640x360, khoảng 700 kbps.
- Segment length: 6 giây.
- Output group: Apple HLS.

Sau khi job complete, output nằm trong:

```text
s3://netflop-output-<team>/movies/<MaPhim>/episodes/<MaTap>/
```

## 5. CloudFront

Tạo distribution:

- Origin: `netflop-output-<team>.s3.<region>.amazonaws.com`.
- Origin Access Control: enabled, signing behavior `always`.
- Viewer protocol policy: Redirect HTTP to HTTPS.
- Cache policy: Caching optimized.

Copy bucket policy do CloudFront console gợi ý vào output bucket.

URL xem phim:

```text
https://dxxxxx.cloudfront.net/movies/1/episodes/1/index.m3u8
```

Điền domain vào `backend/.env`:

```env
AWS_CLOUDFRONT_DOMAIN=https://dxxxxx.cloudfront.net
```

## 6. Chạy demo

Backend:

```bash
cd backend
npm install
copy .env.example .env
npm run create-admin -- admin Admin@123 admin@netflop.local
npm run dev
```

Frontend:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Luồng demo:

1. Đăng nhập admin.
2. Tạo phim.
3. Thêm tập phim.
4. Nhập `MaTap`, upload MP4.
5. Bấm Convert HLS.
6. Bấm Check job đến khi `COMPLETE`.
7. Publish phim.
8. User xem phim, `hls.js` tự chuyển chất lượng.

## 7. Logging, metric, alert

Trong project đã có:

- `stream_view_logs` để lưu lượt xem.
- `aws_upload_sessions` để lưu upload session.
- `aws_mediaconvert_jobs` để lưu trạng thái convert.
- Pino logger ở backend để đưa log ra console hoặc CloudWatch khi deploy.

Nên tạo CloudWatch alarms:

- MediaConvert job error > 0.
- API 5xx tăng.
- CloudFront 4xx/5xx tăng.
- AWS Budget vượt ngưỡng.
- S3 bucket size vượt dự kiến.

## 8. Cleanup

Khi demo xong:

1. Xóa object trong input bucket.
2. Xóa object trong output bucket.
3. Disable rồi delete CloudFront distribution.
4. Xóa CloudWatch alarms/log groups không cần giữ.
5. Xóa IAM role/policy riêng của project.
6. Xóa S3 buckets.
7. Kiểm tra Billing.
