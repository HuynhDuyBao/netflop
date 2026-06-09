# Netflop

React frontend and Node.js Express backend project.

```text
netflop/
  frontend/   React user and admin interface
  backend/    Node.js + Express API server
  database/   SQL schema, seed data, and backups
  docs/       API, database, and TMDB notes
  README.md
  .gitignore
```

## Run Backend

The existing API lives in `backend/`.

```bash
cd backend
npm install
npm run dev
```

Or from the project root:

```bash
npm run backend
```

The backend reads environment variables from `backend/.env`.

MySQL must contain a database named `web_xem_phim`, matching `DB_DATABASE` in
`backend/.env`.

## Run Frontend

The React app lives in `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

Or from the project root:

```bash
npm run frontend
```

Frontend API URL is configured in `frontend/.env`.

## TMDB And Upload

Add your real keys to `backend/.env`:

```env
TMDB_API_KEY=your_tmdb_api_key
TMDB_ACCESS_TOKEN=your_tmdb_read_access_token

AWS_REGION=ap-southeast-1
AWS_S3_INPUT_BUCKET=your-input-bucket
AWS_S3_OUTPUT_BUCKET=your-output-bucket
AWS_CLOUDFRONT_DOMAIN=https://your-cloudfront-domain.cloudfront.net
AWS_MEDIACONVERT_ROLE_ARN=your-mediaconvert-role-arn
```

Admin TMDB import flow:

```text
TmdbImport.jsx -> tmdbApi.js -> tmdb.routes.js -> tmdb.controller.js -> tmdb.service.js -> TMDb API
```

Episode upload flow:

```text
EpisodeCreate.jsx -> UploadVideo.jsx -> uploadApi.js -> upload.routes.js -> upload.controller.js -> awsS3.service.js -> mediaConvert.service.js -> CloudFront URL -> tapphim
```

## Root Scripts

```bash
npm run backend        # start backend in dev mode
npm run backend:start  # start backend with node
npm run frontend       # start React dev server
npm run frontend:build # build React app
```

## Important Folders

- `frontend/src/components`: shared React components
- `frontend/src/pages`: user pages
- `frontend/src/admin`: admin pages and components
- `frontend/src/services`: API clients
- `backend/src/controllers`: request handlers
- `backend/src/routes`: API routes
- `backend/src/services`: business logic
- `backend/uploads`: local upload folders for testing
- `database`: SQL files
- `docs`: project documentation
