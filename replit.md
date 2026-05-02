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
- Relations: videos, likes, comments, followers, following

### Video
- `id`, `user_id` (FK), `caption`
- `video_url` (Cloudinary URL), `thumbnail_url`, `cloudinary_public_id`
- `duration`, `view_count`, `created_at`
- `privacy` (public/private/followers), `pinned` (bool), `sound_of` (original audio name)
- Relations: likes, comments, bookmarks

### Comment
- `id`, `user_id` (FK), `video_id` (FK)
- `content`, `reply_to` (FK self-referential for replies), `created_at`
- CommentLike: user-comment like pivot with unique constraint

### Story
- `id`, `user_id` (FK), `media_url`, `media_type` (image/video)
- `duration` (seconds), `expires_at`, `view_count`, `created_at`

### Bookmark
- `id`, `user_id` (FK), `video_id` (FK), `created_at`
- Unique constraint on (user_id, video_id)

### Message
- `id`, `sender_id` (FK), `receiver_id` (FK)
- `content`, `read` (bool), `created_at`

### Block
- `id`, `blocker_id` (FK), `blocked_id` (FK), `created_at`

## API Endpoints

### Auth
- `GET /api/auth/me`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Videos
- `GET /api/videos` — paginated public feed
- `GET /api/videos/:id` — single video
- `POST /api/videos` — upload (multipart: video, caption, privacy, sound_of)
- `DELETE /api/videos/:id`
- `GET /api/users/:user_id/videos`

### Engagement
- `POST /api/videos/:id/like` — toggle like
- `GET /api/videos/:id/comments`
- `POST /api/videos/:id/comments` — supports reply_to
- `DELETE /api/videos/:id/comments/:comment_id`
- `POST /api/comments/:id/like` — toggle comment like

### Social (Follow / Block / Pin / Analytics)
- `POST /api/social/follow/:username` — toggle follow
- `GET /api/users/:username` — user profile with follow status
- `POST /api/social/block/:user_id` — block user
- `POST /api/social/pin/:video_id` — toggle pin on own video
- `GET /api/social/analytics` — creator analytics

### Stories
- `POST /api/stories` — create story
- `GET /api/stories/feed` — following users' stories
- `GET /api/stories/:story_id` — single story (increments view)
- `DELETE /api/stories/:story_id`

### Bookmarks
- `POST /api/bookmarks/:video_id` — toggle bookmark
- `GET /api/bookmarks` — list bookmarked videos

### Messages (DMs)
- `GET /api/messages/conversations` — list conversations
- `GET /api/messages/:user_id` — conversation messages
- `POST /api/messages/:user_id` — send message
- `GET /api/messages/unread-count` — unread DM count

### Notifications
- `GET /api/notifications` — all notifications
- `GET /api/notifications/unread-count` — unread count
- `POST /api/notifications/mark-read` — mark all read

## Frontend Pages

| Route | Purpose |
|---|---|
| `/` | TikTok-style vertical feed + Stories bar |
| `/upload` | Upload video with caption, privacy selector, progress |
| `/login` | Login form |
| `/signup` | Registration form |
| `/profile/:username` | Profile with videos/pinned tabs, analytics link, DM button, bookmarks |
| `/video/:id` | Video with bookmark, comment likes, replies, share |
| `/messages` | DM conversations list |
| `/conversation/:userId` | Individual conversation |
| `/bookmarks` | Saved/bookmarked videos |
| `/analytics` | Creator analytics dashboard |
| `/stories/create` | Story creation |
| `/stories/:userId` | Story viewer |

## Bottom Navigation
Home → Search → + (Upload) → DMs (with unread badge) → Profile (with notification badge)

## Environment Variables Required

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | Flask session signing key |
| `DATABASE_URL` | PostgreSQL connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

## Running

Both services run automatically via Replit workflows:
- **Flask API**: `artifacts/api-server: Flask API` workflow
- **React Frontend**: `artifacts/india-live: web` workflow
