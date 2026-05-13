# Database

Import schema từ file:

```text
C:\Users\Admin\Downloads\webapixemphim_aws_xampp.sql
```

Database mặc định backend dùng:

```text
webapixemphim
```

File SQL đã có các bảng AWS mở rộng:

- `video_bitrates`
- `aws_upload_sessions`
- `aws_mediaconvert_jobs`
- `stream_view_logs`
- `aws_project_config`

Backend Node.js trong repo này đọc trực tiếp các bảng đó.
