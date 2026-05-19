# SkillIntel — Skill Market Intelligence Engine

SkillIntel is a full‑stack web application that provides **skill market intelligence** (demand, salary benchmarks, growth/trend signals, recommendations) for the tech ecosystem. It includes:

- **Backend**: Node.js + Express, MongoDB Atlas (Mongoose), JWT auth, SSR sessions (EJS), Socket.io
- **Frontend**: React + Vite SPA consuming the same API
- **Trend engine**: scheduled + on-demand pipeline that aggregates multiple signals (jobs + GitHub + Stack Overflow + optional Google Trends via `trend-service`)

---

## Features

- **Skills API**: explore skills, compare, recommended skills, trending feed
- **Auth**: register/login/logout, JWT-protected profile endpoints
- **Profile**: update profile fields + **resume upload/download** (PDF/DOC/DOCX, ≤5MB)
- **SSR dashboard**: EJS dashboard protected by server sessions
- **Real-time**: Socket.io live events (`requestTrending` → `trendingUpdate`)
- **Trends pipeline**:
  - scheduled via cron (default every 6 hours)
  - can be triggered on-demand via an admin endpoint
  - writes trend history snapshots and updates latest computed fields on `Skill`

---

## Tech stack

- **Backend Databases**: PostgreSQL (Relational) via **Prisma ORM**, MongoDB Atlas (NoSQL) via Mongoose. Dual-write capabilities supported.
- **Backend Framework**: Node.js, Express.js
- **Auth**: JWT (`jsonwebtoken`), password hashing (`bcryptjs`)
- **Sessions**: `express-session` + `connect-mongo`
- **File Uploads**: `multer` for form-data, integration planned with Cloudinary
- **SSR**: EJS
- **Real-time**: Socket.io
- **Jobs / pipeline**: `node-cron`, axios
- **Testing**: Unit testing configuration (Jest/Mocha/Chai setup ongoing)
- **Deployment Targets**: Configured for Vercel, Render, AWS, etc.
- **Frontend**: React + Vite

---

## Project structure (high level)

```
SkillIntel/
├── server.js
├── routes/                  # auth, skills, dashboard
├── controllers/             # request handlers
├── models/                  # Skill, User, SkillTrend
├── middleware/              # auth/session/error/logging
├── services/                # trends pipeline + integrations
├── jobs/                    # scheduler
├── views/                   # EJS templates
├── client/                  # React + Vite
└── trend-service/           # optional FastAPI service for Google Trends
```

---

## Setup

### Prerequisites

- Node.js **18+**
- MongoDB Atlas (or a MongoDB URI)

### 1) Install dependencies

```bash
npm install
cd client && npm install && cd ..
```

### 2) Configure environment variables

Create a `.env` in the repo root (do **not** commit it). Minimum required:

```bash
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
NODE_ENV=development
```

Optional (enables more integrations in the trends pipeline):

```bash
# GitHub Search API (for github trends signal)
GITHUB_TOKEN=your_github_token

# Adzuna jobs source (jobs signal)
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_API_KEY=your_adzuna_api_key

# RapidAPI JSearch jobs source (jobs signal)
JSEARCH_API_KEY=your_rapidapi_key

# Google Trends via FastAPI service in ./trend-service
TREND_SERVICE_URL=http://localhost:8000

# Override cron expression (default: every 6 hours)
TRENDS_CRON=0 */6 * * *
```

### 3) Seed the database (optional but recommended)

```bash
npm run seed
```

### 4) Run backend + frontend

Backend (terminal 1):

```bash
npm run dev
```

Frontend (terminal 2):

```bash
cd client && npm run dev
```

Open:

- React app: `http://localhost:5173`
- API: `http://localhost:3000/api/skills`
- SSR dashboard: `http://localhost:3000/dashboard`

---

## API endpoints

### Skills API (public unless noted)

- `GET /api/skills` — list all skills
- `GET /api/skills/:name` — get one skill (case-insensitive match)
- `GET /api/trending?limit=N` — trending skills (sorted by `trendScore` with fallback)
- `GET /api/compare?skills=A,B` — compare multiple skills
- `GET /api/recommended/:skill` — recommended companion skills
- `POST /api/skills` — **JWT required** (create skill)

### Auth / Profile API

- `POST /api/auth/register`
- `POST /api/auth/login` — returns JWT
- `POST /api/auth/logout`
- `GET /api/auth/profile` — **JWT required**
- `PUT /api/auth/profile` — **JWT required**
- `POST /api/auth/profile` — **JWT required** (upsert-style; 201 on first save)
- `POST /api/auth/profile/resume` — **JWT required**, multipart field name: `resume`
- `GET /api/auth/profile/resume` — **JWT required**

### Admin

- `POST /api/admin/trends/refresh` — **JWT required + admin role**, triggers trends pipeline (returns 202)

### SSR routes

- `GET /login`
- `GET /dashboard` — session-protected (redirects to `/login` when not logged in)

---

## WebSocket (Socket.io)

The backend attaches Socket.io to the same HTTP server.

- **Server → Client**: `welcome`
- **Client → Server**: `requestTrending`
- **Server → Client**: `trendingUpdate`

---

## Trends pipeline (how it works)

The trends engine is orchestrated by `services/trendsPipeline.js` and scheduled by `jobs/scheduler.js`.

Signals:

- **Jobs**: Adzuna + optional RapidAPI JSearch (`services/jobFetcher.js`)
- **GitHub**: GitHub Search API (`services/githubTrends.js`) — requires `GITHUB_TOKEN`
- **Stack Overflow**: Stack Exchange API (`services/stackoverflowTrends.js`)
- **Google Trends (optional)**: via `trend-service` (`services/googleTrends.js`) — requires `TREND_SERVICE_URL`

Persistence:

- Inserts history snapshots into `SkillTrend`
- Upserts latest computed fields onto `Skill` (so `/api/trending` is a single-collection read)

---

## Notes / limitations

- `POST /api/skills` is JWT-protected but may not enforce admin role (admin enforcement is implemented on `/api/admin/trends/refresh`).
- Google Trends requires running `trend-service/` and setting `TREND_SERVICE_URL`; otherwise it is automatically skipped.
- RapidAPI JSearch may return HTTP 403 if the key is not subscribed to the API plan.

---

## License

MIT — see `LICENSE`.

## Author

Kartikya Sokhal — Semester 4 Project
