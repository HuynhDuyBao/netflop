# Netflop

Backend API for the Netflop movie streaming app, built with Node.js, Express, MySQL and JWT.

## Project Structure

```text
NETFLOP/
  server/                  Express/MySQL backend API
    src/
      config/
      controllers/
      middlewares/
      routes/
      services/
      utils/
      app.js
    .env
    .env.example
    package.json
  package.json             Root scripts for running the API
  .gitignore
  README.md
```

## Setup

Install dependencies:

```powershell
npm install
npm --prefix server install
```

Configure MySQL in `server/.env`. The default database name is `webapixemphim`.

Run the backend in development:

```powershell
npm run dev
```

Run the backend in production mode:

```powershell
npm start
```

Default API URL:

```text
http://localhost:5004
```

## Main APIs

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/movies`
- `GET /api/movies/:id`
- `GET /api/catalog/genres`
- `GET /api/catalog/countries`
- `GET /api/catalog/actors`
- `GET /api/catalog/directors`
- `GET /api/admin/*` requires admin JWT
- `GET|POST|PATCH|DELETE /api/admin/movies`
- `GET|POST|PATCH|DELETE /api/admin/episodes`
- `GET|POST|PATCH|DELETE /api/admin/actors`
- `GET|POST|PATCH|DELETE /api/admin/directors`
- `POST|PATCH|DELETE /api/admin/genres`
- `POST|PATCH|DELETE /api/admin/countries`
- `PATCH /api/admin/users/:id/role`
- `PATCH /api/admin/users/:id/status`
- `GET /api/stream?url=...` proxies HLS playlists and segments for browser playback
