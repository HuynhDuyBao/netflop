# API Document

Backend base URL:

```text
http://localhost:5000/api
```

Main groups:

- `/auth`
- `/movies`
- `/catalog`
- `/admin`
- `/tmdb`
- `/episodes`
- `/uploads`

TMDB:

```http
GET /api/tmdb/search?query=batman&type=movie
POST /api/tmdb/import
```

Upload episode:

```http
POST /api/uploads/videos
Content-Type: multipart/form-data

movieId=1
episodeName=Episode 1
video=<file>
```
