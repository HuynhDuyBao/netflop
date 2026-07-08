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

MediaConvert completion event:

```http
POST /api/uploads/mediaconvert/events
Content-Type: application/json
x-netflop-event-secret: value-of-AWS_MEDIACONVERT_WEBHOOK_SECRET
```

Example EventBridge body:

```json
{
  "detail": {
    "jobId": "1234567890-example",
    "status": "COMPLETE",
    "userMetadata": {
      "episodeId": "15",
      "masterKey": "movies/1/episodes/15/hls/index.m3u8"
    }
  }
}
```

Admin manual sync:

```http
POST /api/uploads/videos/:episodeId/sync
Authorization: Bearer <admin-token>
```
