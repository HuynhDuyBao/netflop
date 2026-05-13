# Netflop Backend

Backend API for the `webapixemphim` MySQL database running on XAMPP.

## Tech stack

- Node.js 18+
- Express
- MySQL via `mysql2`
- JWT authentication
- Role-based access control from `tai_khoan.vai_tro`

## Project structure

```text
src/
  config/        Database and environment config
  controllers/   Request handlers
  middlewares/   Auth, role, validation and error middlewares
  routes/        API route definitions
  services/      Business logic and SQL queries
  utils/         JWT, password and error helpers
```

## Setup

1. Import your SQL file into MySQL/XAMPP. Database name must be `webapixemphim`.
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and update your local MySQL password:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

4. Start the API:

```bash
npm run dev
```

API URL:

```text
http://localhost:5000
```

## Main APIs

### Health

```http
GET /api/health
```

### Register user

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user01",
  "email": "user01@example.com",
  "password": "123456",
  "fullName": "User 01"
}
```

### Login

Use username or email in `identifier`.

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "123456"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "id": 1,
      "ten_dang_nhap": "admin",
      "vai_tro": "admin"
    }
  }
}
```

### Current user

```http
GET /api/auth/me
Authorization: Bearer JWT_TOKEN
```

### Admin users

Requires `tai_khoan.vai_tro = 'admin'`.

```http
GET /api/admin/users
Authorization: Bearer JWT_TOKEN
```

```http
PATCH /api/admin/users/:id/role
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "role": "admin"
}
```

```http
PATCH /api/admin/users/:id/status
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "status": "banned"
}
```

### Movies

```http
GET /api/movies?search=&genreId=&countryId=&year=&type=&status=&sort=latest&page=1&limit=20
```

Supported `sort`: `latest`, `popular`, `rating`, `year`.

```http
GET /api/movies/:id
```

```http
GET /api/movies/:id/episodes
```

```http
GET /api/movies/:id/comments
```

Requires login:

```http
POST /api/movies/:id/favorite
Authorization: Bearer JWT_TOKEN
```

```http
DELETE /api/movies/:id/favorite
Authorization: Bearer JWT_TOKEN
```

```http
POST /api/movies/:id/history
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "episodeId": 1,
  "watchedSeconds": 120
}
```

```http
POST /api/movies/:id/rating
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "score": 8,
  "comment": "Good movie"
}
```

```http
POST /api/movies/:id/comments
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "content": "Nice episode",
  "parentId": null
}
```

### Catalog

```http
GET /api/catalog/genres
GET /api/catalog/countries
```

### Current user's movie data

Requires login:

```http
GET /api/me/favorites
Authorization: Bearer JWT_TOKEN
```

```http
GET /api/me/history
Authorization: Bearer JWT_TOKEN
```

### Admin movie and catalog management

Requires `tai_khoan.vai_tro = 'admin'`.

```http
GET /api/admin/movies
POST /api/admin/movies
GET /api/admin/movies/:id
PATCH /api/admin/movies/:id
DELETE /api/admin/movies/:id
```

Create movie body:

```json
{
  "name": "Movie name",
  "title": "Movie title",
  "description": "Short description",
  "content": "Long content",
  "duration": 120,
  "year": 2026,
  "status": "Đang chiếu",
  "type": "Lẻ",
  "poster": "https://example.com/poster.jpg",
  "banner": "https://example.com/banner.jpg",
  "link": "https://example.com/watch",
  "countryId": 1,
  "hlsMasterUrl": "https://example.com/master.m3u8",
  "isPublished": true,
  "genreIds": [1, 2]
}
```

```http
POST /api/admin/genres
PATCH /api/admin/genres/:id
DELETE /api/admin/genres/:id

POST /api/admin/countries
PATCH /api/admin/countries/:id
DELETE /api/admin/countries/:id
```

## Create first admin

If you already have an account in `tai_khoan`, promote it in phpMyAdmin:

```sql
UPDATE tai_khoan
SET vai_tro = 'admin', trang_thai = 'active'
WHERE ten_dang_nhap = 'your_username';
```

## Password note

New accounts created by this backend are saved with bcrypt hashes.
For old accounts, login also supports plain-text passwords so you can migrate safely.
