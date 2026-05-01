# India Live — Video Sharing Platform

A full-stack TikTok + YouTube hybrid video platform for Indian creators.

## Architecture

### Frontend — React + Vite (`artifacts/india-live`)
- **Framework**: React 18, Vite, TypeScript
- **Routing**: wouter
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **State**: React Context (auth), TanStack React Query (server state)
- **Animations**: Framer Motion
- **Theme**: Dark-first, Saffron (#FF9933) + India Green (#138808) accents

### Backend — Python Flask (`artifacts/flask-api`)
- **Framework**: Flask 3.1
- **ORM**: SQLAlchemy via Flask-SQLAlchemy
- **Database**: PostgreSQL (Replit managed, `DATABASE_URL` env var)
- **Video storage**: Cloudinary (requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
- **Auth**: Flask sessions with cookie-based auth
- **CORS**: flask-cors with credentials support

### Artifact Routing
- `/` — React frontend (india-live)
- `/api` — Flask API (flask-api via api-server artifact)

## Database Models

### User
- `id`, `username` (unique), `email` (unique), `password_hash`
- `avatar_url`, `bio`, `created_at`
- Relations: videos, likes, comments

### Video
- `id`, `user_id` (FK), `caption`
- `video_url` (Cloudinary URL), `thumbnail_url`, `cloudinary_public_id`
- `duration`, `view_count`, `created_at`
- Relations: likes, comments

### Like
- `id`, `user_id` (FK), `video_id` (FK)
- Unique constraint on (user_id, video_id) — prevents duplicate likes
- `created_at`

### Comment
- `id`, `user_id` (FK), `video_id` (FK)
- `content` (max 500 chars), `created_at`

## API Endpoints

### Auth
- `GET /api/auth/me` — get current session user
- `POST /api/auth/signup` — register new user
- `POST /api/auth/login` — login with email/username + password
- `POST /api/auth/logout` — logout

### Videos
- `GET /api/videos` — paginated feed (query: page, per_page)
- `GET /api/videos/:id` — single video (increments view count)
- `POST /api/videos` — upload video (multipart: video file + caption)
- `DELETE /api/videos/:id` — delete own video
- `GET /api/users/:user_id/videos` — user's videos

### Engagement
- `POST /api/videos/:id/like` — toggle like
- `GET /api/videos/:id/comments` — paginated comments
- `POST /api/videos/:id/comments` — add comment
- `DELETE /api/videos/:id/comments/:id` — delete own comment

### Users
- `GET /api/users/:id` — get user by ID
- `GET /api/users/:username` — get user by username

## Frontend Pages

| Route | Purpose |
|---|---|
| `/` | TikTok-style vertical feed, auto-playing videos |
| `/upload` | Upload video with caption, shows progress |
| `/login` | Login form |
| `/signup` | Registration form |
| `/profile/:username` | User profile with video grid |
| `/video/:id` | Single video with comments panel |

## Environment Variables Required

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | Flask session signing key (already set) |
| `DATABASE_URL` | PostgreSQL connection string (already set) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

## Running

Both services run automatically via Replit workflows:
- **Flask API**: `artifacts/api-server: Flask API` workflow
- **React Frontend**: `artifacts/india-live: web` workflow
