# Cau hinh xac thuc cho Netflop

## Cognito email/password

Netflop dung Amazon Cognito API truc tiep cho dang ky, OTP va dang nhap bang email/password. Khong can Hosted UI cho luong nay.

Trong Cognito User Pool:

- Sign-in identifiers: `Username` va `Email`
- Required attributes: `Email`
- App client auth flows: bat `ALLOW_USER_PASSWORD_AUTH` va `ALLOW_REFRESH_TOKEN_AUTH`
- Neu App client co secret, dien secret vao backend `.env`

Bien moi truong can co:

```env
AWS_REGION=us-west-1
AWS_COGNITO_USER_POOL_ID=us-west-1_xxxxxxxxx
AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_COGNITO_CLIENT_SECRET=
AWS_COGNITO_DOMAIN=https://your-domain.auth.us-west-1.amazoncognito.com
AWS_COGNITO_REDIRECT_URI=http://localhost:5173/auth/callback
AWS_COGNITO_LOGOUT_URI=http://localhost:5173/
```

Vi User Pool dung email alias, backend khong dung email lam Cognito `Username` khi dang ky. Backend tu tao username noi bo, gui email trong attribute `email`, va user van dang nhap bang email.

Sau khi Cognito `SignUp` thanh cong, backend tao luon tai khoan local trong MySQL qua view/bang `tai_khoan`.

## Google OAuth rieng

Nut Google khong di qua Cognito. Frontend goi backend:

- `GET /api/auth/google-url`
- `POST /api/auth/google-callback`

Backend doi code voi Google, lay profile, sync tai khoan vao MySQL, roi cap JWT noi bo cho app.

Bien moi truong Google:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
```

Trong Google Cloud OAuth Client:

- Authorized JavaScript origins: `http://localhost:5173`
- Authorized redirect URIs: `http://localhost:5173/auth/callback`

## Hosted UI

Hosted UI cua Cognito hien khong duoc dung trong man hinh dang nhap chinh. Chi cau hinh Hosted UI neu sau nay muon bat lai nut dang nhap qua trang AWS.
