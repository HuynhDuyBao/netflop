# TMDB Note

Set TMDB variables in `backend/.env` when you implement TMDB import:

```env
TMDB_API_KEY=
TMDB_ACCESS_TOKEN=
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
```

Flow:

```text
frontend/src/admin/pages/TmdbImport.jsx
frontend/src/services/tmdbApi.js
backend/src/routes/tmdb.routes.js
backend/src/controllers/tmdb.controller.js
backend/src/services/tmdb.service.js
TMDb API
```
