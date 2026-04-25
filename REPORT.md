# Project Internal Report

## 1. System Overview
SkillIntel is a full‑stack web platform that delivers real‑time skill market intelligence for the Indian tech sector. It combines a **Node.js/Express** backend (with **MongoDB Atlas** for persistence) and a **React + Vite** SPA frontend. The backend also serves **EJS**‑rendered server‑side pages for the dashboard and handles **Socket.io** WebSocket streams to push live trending‑skill updates to connected clients.

**End‑to‑end flow**:
```
User ↔ Browser (React SPA) ↔ HTTP API (Express) ↔ MongoDB (Skill & User docs)
            ↕
          Socket.io ↔ Real‑time events (trending updates)
            ↕
          EJS Dashboard (SSR) – Session protected
```

---

## 2. Architecture
| Layer | Technology | Role |
|-------|------------|------|
| **Server** | Express.js + HTTP server (http.createServer) | Routing, middleware, API, SSR, static assets |
| **WebSocket** | Socket.io (attached to same HTTP server) | Push live data (trending skills) |
| **Data** | MongoDB Atlas + Mongoose ODM | Document storage for `Skill` and `User` models |
| **Auth** | JWT (API) + express‑session + connect‑mongo (SSR) | Stateless token auth for SPA, session‑based auth for EJS pages |
| **Client** | React (Vite) + React Router | SPA UI, API wrapper (`utils/api.js`), theming (`ThemeProvider`) |
| **SSR** | EJS templates (`views/`) | Dashboard rendered on server, protected by session middleware |

**Pattern**: The project follows a **layered MVC‑like** architecture:
- **Models** (`models/`) – Mongoose schemas.
- **Controllers** (`controllers/`) – Business logic, async DB calls.
- **Routes** (`routes/`) – Express routers that map HTTP verbs to controller functions.
- **Middleware** – Cross‑cutting concerns (logging, error handling, auth, session checks).
- **Views** – EJS templates for server‑rendered pages.
- **Client** – Separate React SPA consuming the same API.

The separation enables independent evolution of the API and the SPA while reusing the same data layer.

---

## 3. Data Flow
1. **Request** – Browser sends an HTTP request (REST API) or opens a WebSocket connection.
2. **CORS & Body Parsing** – Middleware parses JSON / URL‑encoded bodies and validates origin.
3. **Session / JWT** – Depending on route type:
   - SSR routes use `express-session` (session cookie → MongoDB store).
   - API routes use JWT (Authorization header) validated by `authMiddleware`.
4. **Routing** – Express matches the path (order matters – static routes before dynamic `/:name`).
5. **Controller** – Executes async Mongoose queries (`Skill.find()`, `Skill.findOne()`, etc.).
6. **Response** – JSON payload returned to SPA or rendered EJS view for SSR.
7. **WebSocket** – On `requestTrending` event, server queries `Skill` collection and emits `trendingUpdate` to all clients.

---

## 4. File‑Level Breakdown
### Backend
- **server.js** – Entry point. Sets up environment, creates HTTP server, configures Socket.io, registers middleware (CORS, parsers, session, logger, morgan), mounts routers, 404 handler, global error handler, and starts listening after MongoDB connection.
- **models/Skill.js** – Mongoose schema for skill documents (name, category, demandIndex, salary, growth, experienceBarrier, saturationRisk, description, tags, recommended, careerPaths, regionalDemand, timestamps). Includes a sub‑schema for regional demand and an index on `name` (unique).
- **models/User.js** – Mongoose schema for users (name, email, password, role, createdAt). Pre‑save hook hashes passwords with bcrypt; instance method `comparePassword` verifies credentials.
- **controllers/skillController.js** – CRUD and query functions: `getAllSkills`, `getSkillByName`, `getTrendingSkills`, `getRecommendedSkills`, `compareSkills`, `createSkill`. All use async/await and forward errors to `next`.
- **controllers/authController.js** – Handles registration, login (JWT generation, session creation), logout, and profile retrieval.
- **controllers/dashboardController.js** – Renders EJS dashboard and login pages.
- **routes/skillRoutes.js** – Router for `/api/skills/*`. Registers router‑level logger, static routes (`/skills`, `/trending`, `/compare`, `/recommended/:skill`), dynamic route (`/skills/:name`), and protected POST route (`/skills` with `authMiddleware`).
- **routes/authRoutes.js** – Auth endpoints (`/register`, `/login`, `/logout`, `/profile`).
- **routes/dashboardRoutes.js** – SSR routes (`/login`, `/dashboard`) protected by `sessionCheck`.
- **middleware/logger.js** – Simple request logger for skill routes.
- **middleware/authMiddleware.js** – Verifies JWT, attaches `req.user`.
- **middleware/sessionCheck.js** – Ensures a valid session for SSR routes.
- **middleware/errorHandler.js** – Centralized error formatter (status, message, stack in dev).
- **seed.js** – Populates `skills.json` and creates two default users (admin & test).
- **views/** – EJS templates (`dashboard.ejs`, `login.ejs`).

### Frontend (React SPA)
- **client/src/main.jsx** – Boots React app, mounts `<App />`.
- **client/src/App.jsx** – Sets up `BrowserRouter`, theme provider, layout, public routes (Home, Explorer, SkillDetail, Compare), auth routes (Login, Register), and protected Dashboard via `PrivateRoute` (checks JWT via `utils/api.js`).
- **client/src/components/** – UI building blocks (Navbar, Footer, SkillCard, Spinner, ThemeProvider, Layout).
- **client/src/pages/** – Page components corresponding to routes.
- **client/src/utils/api.js** – Wrapper around `fetch` that adds JWT Authorization header and provides `isAuthenticated` helper.
- **client/src/utils/currency.js** – Helper to format INR salaries.
- **client/src/index.css** – Global CSS (custom design system, responsive utilities).

---

## 5. Component Interaction
```
[React SPA] --fetch--> /api/skills  (skillController → Skill model → MongoDB)
[React SPA] <--socket.io--  requestTrending / trendingUpdate (Skill model query)
[SSR Dashboard] <--session--> express-session (MongoStore) <--cookie-- Browser
[Auth] <--JWT--> authMiddleware --> User model (bcrypt compare)
```
- **API ↔ Controllers ↔ Models** – One‑to‑one mapping; each controller function calls a Mongoose model method.
- **Routes ↔ Middleware** – Middleware runs in registration order; router‑level logger runs before controller logic.
- **Socket.io ↔ Skill Model** – Real‑time events query the `Skill` collection directly.
- **React ↔ API** – `utils/api.js` abstracts token handling; components call `fetch` helpers.
- **EJS ↔ Session** – `sessionCheck` validates session before rendering dashboard.

---

## 6. API / Logic Layer
| Endpoint | Method | Auth | Controller | Description |
|----------|--------|------|------------|-------------|
| `/api/skills` | GET | ❌ | `getAllSkills` | Return all skill docs.
| `/api/skills/:name` | GET | ❌ | `getSkillByName` | Case‑insensitive lookup by name.
| `/api/trending` | GET | ❌ | `getTrendingSkills` | Skills sorted by `growth` desc.
| `/api/recommended/:skill` | GET | ❌ | `getRecommendedSkills` | Returns companion skills defined in `recommended` array.
| `/api/compare` | GET | ❌ | `compareSkills` | Compare multiple skills via `?skills=` query.
| `/api/skills` | POST | ✅ (JWT) | `createSkill` | Add a new skill (admin only in future).
| `/api/auth/register` | POST | ❌ | `register` (authController) | Create user, hash password.
| `/api/auth/login` | POST | ❌ | `login` | Verify password, issue JWT, set session.
| `/api/auth/logout` | POST | ❌ | `logout` | Destroy session, clear cookie.
| `/api/auth/profile` | GET | ✅ (JWT) | `profile` | Return current user info.

All controller functions are **async**, use **try/catch**, and forward errors to the global error handler.

---

## 7. State Management
- **Backend** – Stateless for API (JWT). Session state stored in MongoDB via `connect-mongo` (cookie contains session ID). Mongoose models hold persistent state.
- **Frontend** – No global store; each component fetches data on mount. Authentication state is derived from the presence of a JWT in `localStorage` (checked by `isAuthenticated`).
- **Socket.io** – Maintains a persistent connection object per client; server pushes updates without additional state.

---

## 8. Key Decisions
1. **Dual Auth (JWT + Session)** – Allows SPA to use stateless tokens while preserving traditional server‑rendered pages that rely on sessions.
2. **Express Middleware Order** – Explicit comments and ordering ensure CORS, parsers, session, logger, and error handling execute correctly.
3. **Socket.io on Same HTTP Server** – Enables WebSocket upgrades without a separate port, simplifying deployment.
4. **Static‑before‑Dynamic Routes** – Prevents `/trending` from being captured as a skill name.
5. **Mongoose Index on `name`** – Guarantees fast lookups and uniqueness for skill identifiers.
6. **Pre‑save Hook for Password Hashing** – Centralizes security; passwords never stored plain.
7. **Separate React SPA** – Vite provides fast HMR; the SPA consumes the same API, keeping the backend single‑source of truth.

---

## 9. Current Progress
- **Backend** – Fully functional CRUD API, authentication, session‑protected SSR, real‑time socket events, comprehensive error handling.
- **Frontend** – React SPA with routing, theming, API wrapper, protected dashboard page.
- **Data** – Seed script populates 10 skill documents and two users.
- **Documentation** – README updated; detailed internal report (this file) generated.

---

## 10. Known Issues / Limitations
- **Authorization Granularity** – `createSkill` is only JWT‑protected; role‑based checks (admin vs user) are not enforced yet.
- **Input Validation** – Controllers rely on Mongoose validation; no explicit request‑body validation (e.g., Joi) – could lead to ambiguous error messages.
- **Scalability** – Session store is MongoDB; for high traffic a dedicated Redis store may be preferable.
- **Testing** – No unit or integration test suite present.
- **Frontend State** – No global state management (Redux/Context) – repeated fetches on navigation.
- **Error Messages** – API returns generic messages; could be standardized with error codes.

---

*Prepared by Antigravity – GPT‑OSS 120B (Medium)*
