# ⚡ SkillIntel — Skill Market Intelligence Engine

> A full-stack web application that provides real-time skill market intelligence — demand indices, salary benchmarks, growth trajectories, and career path recommendations for the Indian tech industry.

## 🏗 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js | JavaScript runtime |
| **Framework** | Express.js | HTTP server & routing |
| **Database** | MongoDB Atlas | Cloud-hosted NoSQL database |
| **ODM** | Mongoose | MongoDB object modeling |
| **Auth** | JWT + bcryptjs | Stateless authentication & password hashing |
| **Sessions** | express-session + connect-mongo | Server-side session storage in MongoDB |
| **Template Engine** | EJS | Server-side rendering (SSR dashboard) |
| **Real-time** | Socket.io | WebSocket-based live data feeds |
| **Frontend** | React + Vite | Single-page application |
| **Styling** | Vanilla CSS | Custom design system |

## 📁 Folder Structure

```
SkillIntel/
├── server.js                 # Main entry point
├── seed.js                   # Database seeder script
├── package.json              # Dependencies & scripts
├── .env                      # Environment variables (gitignored)
├── .env.example              # Environment template
│
├── models/
│   ├── Skill.js              # Mongoose Skill schema
│   ├── User.js               # Mongoose User schema (bcrypt hooks)
│   └── postgresExample.js    # PostgreSQL reference (syllabus)
│
├── controllers/
│   ├── skillController.js    # Skill CRUD logic
│   ├── authController.js     # Register, Login, Logout, Profile
│   └── dashboardController.js # SSR dashboard rendering
│
├── routes/
│   ├── skillRoutes.js        # /api/skills/* routes
│   ├── authRoutes.js         # /api/auth/* routes
│   └── dashboardRoutes.js    # /dashboard, /login SSR routes
│
├── middleware/
│   ├── logger.js             # Application-level request logger
│   ├── errorHandler.js       # Global error handler (4-param)
│   ├── authMiddleware.js     # JWT verification middleware
│   └── sessionCheck.js       # Session-based route protection
│
├── views/
│   ├── dashboard.ejs         # SSR dashboard template
│   └── login.ejs             # SSR login form
│
├── data/
│   └── skills.json           # Seed data (10 skills)
│
└── client/                   # React SPA (Vite)
    └── src/
        ├── App.jsx           # Router with public & protected routes
        ├── components/
        │   ├── Navbar.jsx    # Auth-aware navigation bar
        │   ├── Footer.jsx
        │   ├── SkillCard.jsx
        │   └── Spinner.jsx
        ├── pages/
        │   ├── Home.jsx      # Landing page
        │   ├── Explorer.jsx  # Skills browser
        │   ├── SkillDetail.jsx
        │   ├── Compare.jsx
        │   ├── Login.jsx     # JWT login form
        │   ├── Register.jsx  # Registration form
        │   └── Dashboard.jsx # Protected dashboard + Socket.io
        └── utils/
            ├── api.js        # Fetch wrapper with JWT interceptor
            └── currency.js   # INR salary formatting
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/SkillIntel.git
cd SkillIntel
```

### 2. Install backend dependencies
```bash
npm install
```

### 3. Install frontend dependencies
```bash
cd client && npm install && cd ..
```

### 4. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
```

### 5. Seed the database
```bash
npm run seed
```
This creates 10 skills + 2 users (admin & test user).

### 6. Start the backend server
```bash
npm run dev       # Development (with nodemon)
# or
npm start         # Production
```

### 7. Start the React frontend (separate terminal)
```bash
cd client && npm run dev
```

### 8. Open in browser
- **React App:** http://localhost:5173
- **API:** http://localhost:3000/api/skills
- **EJS Dashboard:** http://localhost:3000/dashboard

## 📡 API Endpoints

### Skills API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/skills` | ❌ | Get all skills |
| GET | `/api/skills/:name` | ❌ | Get skill by name |
| GET | `/api/trending` | ❌ | Get skills sorted by growth |
| GET | `/api/recommended/:skill` | ❌ | Get recommended companion skills |
| GET | `/api/compare?skills=A,B` | ❌ | Compare multiple skills |
| POST | `/api/skills` | ✅ JWT | Create a new skill |

### Auth API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | ❌ | Create new account |
| POST | `/api/auth/login` | ❌ | Login (returns JWT + sets session) |
| POST | `/api/auth/logout` | ❌ | Destroy session & clear cookies |
| GET | `/api/auth/profile` | ✅ JWT | Get current user profile |

### SSR Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/login` | ❌ | EJS login form |
| GET | `/dashboard` | ✅ Session | EJS dashboard (server-rendered) |

## 🔌 WebSocket Events (Socket.io)

| Event | Direction | Description |
|-------|-----------|-------------|
| `welcome` | Server → Client | Sent on connection with socket ID |
| `requestTrending` | Client → Server | Request latest trending skills |
| `trendingUpdate` | Server → Client | Top 5 skills by growth |
| `disconnect` | Both | Cleanup on disconnection |

## 🔐 Default Users (after seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@skillintel.com | password123 | admin |
| test@skillintel.com | test1234 | user |

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 👤 Author

**Kartikya Sokhal**
Backend Engineering — Semester 4 Project
