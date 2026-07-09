# Cấu hình Amazon Cognito cho Netflop

## 1. User Pool và App client

Tạo Cognito User Pool trong cùng region với ứng dụng. Chọn email làm thuộc tính bắt
buộc và bật self-registration. Ở App client, bật:

- `ALLOW_USER_PASSWORD_AUTH`
- `ALLOW_REFRESH_TOKEN_AUTH`
- Không bắt buộc client secret; nếu có, đặt secret trong backend `.env`.

Thiết lập MFA trong User Pool:

- `Optional` hoặc `Required`
- Bật SMS MFA và/hoặc authenticator app (TOTP)
- Cấu hình SNS role nếu dùng SMS

## 2. Hosted UI và social login

Tạo Cognito domain, sau đó thêm Google/Facebook làm Identity Provider. Trong App
client Hosted UI:

- Callback URL: `http://localhost:5173/auth/callback` (production dùng HTTPS)
- Sign-out URL: `http://localhost:5173/` (production dùng HTTPS)
- OAuth grant: Authorization code grant
- Scopes: `openid`, `email`
- Identity providers: Cognito User Pool, Google, Facebook

Callback URL phải khớp tuyệt đối với `AWS_COGNITO_REDIRECT_URI`.

## 3. Biến môi trường

Sao chép `.env.example` thành `.env` ở thư mục gốc và điền:

```env
AWS_REGION=ap-southeast-1
AWS_COGNITO_USER_POOL_ID=ap-southeast-1_xxxxxxxxx
AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_COGNITO_CLIENT_SECRET=
AWS_COGNITO_DOMAIN=https://ten-mien.auth.ap-southeast-1.amazoncognito.com
AWS_COGNITO_REDIRECT_URI=http://localhost:5173/auth/callback
AWS_COGNITO_LOGOUT_URI=http://localhost:5173/
```

Backend dùng AWS SDK để đăng ký/đăng nhập và xác minh ID token từ Cognito. Sau khi
xác thực thành công, tài khoản được đồng bộ vào bảng `tai_khoan`; API tiếp tục dùng
JWT nội bộ để tương thích với bình luận, đánh giá và phân quyền hiện có.

Frontend dùng Cognito Hosted UI cho cả đăng nhập và đăng ký. Lần đầu người dùng
chọn Google, Cognito tự tạo tài khoản; các lần sau cùng luồng đó sẽ đăng nhập.
