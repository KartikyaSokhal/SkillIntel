# 🎓 SkillIntel — Comprehensive Backend Viva Guide

> [!NOTE]
> This guide is strictly tailored to **your** actual project code in the SkillIntel directory. Use this to prepare for deep-dive questions from your examiner.

---

## 🔹 PART 1: PROJECT UNDERSTANDING

**1. Project Explanation (5–6 Lines)**
"SkillIntel is a real-time market intelligence engine that tracks, analyzes, and visualizes demand for various technical skills. The backend is built on Node.js and Express, utilizing MongoDB for flexible data storage and Mongoose for object data modeling. It features a dual-authentication architecture—using JWT for stateless API access from the React frontend, and session-based authentication for Server-Side Rendered (SSR) EJS views. Additionally, it integrates Socket.io to push real-time trending skill updates directly to clients without requiring a page refresh, and runs background cron jobs to aggregate trend data."

**2. Architecture Flow**
`Client (React SPA / EJS Views)` ➔ `Express Server (Routes & Middleware)` ➔ `Controllers (Business Logic)` ➔ `MongoDB (Data Layer)`

**3. Tech Stack & Why**
- **Node.js & Express**: Provides a non-blocking, event-driven architecture perfect for handling multiple concurrent API requests and real-time Socket.io connections.
- **MongoDB & Mongoose**: A NoSQL database that offers schema flexibility, which is ideal for storing varied "Profile" data and nested arrays of "Regional Demand" without rigid tables.
- **JWT & Express-Session**: JWT is used for secure, stateless API communication with the React frontend. `express-session` (with `connect-mongo`) is used to maintain state for legacy server-rendered EJS pages.
- **Socket.io**: Upgrades HTTP to WebSockets to enable full-duplex communication, allowing the server to push live trending skill updates to the UI instantly.
- **Bcryptjs**: Used for one-way password hashing to ensure user credentials are secure against database leaks.

---

## 🔹 PART 2: IMPORTANT FILES (VIVA FOCUS)

| File | Purpose | Why Examiner Will Ask |
|---|---|---|
| `server.js` | The master entry point. Wires up middleware, Socket.io, DB connection, and routes. | To check if you understand **Middleware Order** and how WebSockets bind to the HTTP server. |
| `models/User.js` | Defines the User schema, handles password hashing via hooks, and compares passwords. | To test your knowledge of **Mongoose Hooks** (pre-save) and why passwords shouldn't be stored in plain text. |
| `middleware/authMiddleware.js` | Extracts and verifies the JWT token from the `Authorization` header. | To test your understanding of **Stateless Authentication** and how APIs secure routes. |
| `controllers/authController.js` | Handles Registration, Login (generates JWT & Session), and Profile management. | To see if you understand the flow of data: validation ➔ DB check ➔ token generation. |
| `middleware/errorHandler.js` | Catches all errors and formats them into a standard JSON response. | To check if you know how Express handles errors (the 4-parameter signature: `err, req, res, next`). |

---

## 🔹 PART 3: CRITICAL CODE ANALYSIS

### 1. Middleware Order (`server.js`)
```javascript
app.use(express.json()); // 1. Parses incoming JSON bodies
app.use(session({ ... })); // 2. Initializes session state
app.use('/api', skillRoutes); // 3. Route handlers process request
app.use(errorHandler); // 4. Catches any errors from above
```
> [!IMPORTANT]
> **Viva Question:** "Why is `errorHandler` at the bottom of `server.js`?"
> **Answer:** Express executes middleware sequentially. The error handler must be last so it can catch exceptions passed down via `next(err)` from any preceding route or middleware.

### 2. Password Hashing Hook (`models/User.js`)
```javascript
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
```
> [!IMPORTANT]
> **Viva Question:** "How do you ensure passwords are secure before saving to MongoDB?"
> **Answer:** I use a Mongoose `pre('save')` hook. Before the document writes to the database, `bcrypt` generates a random "salt" and hashes the password. I also use `this.isModified` to ensure the password is only hashed when it's new or changed.

### 3. Stateless Authentication (`middleware/authMiddleware.js`)
```javascript
const token = authHeader.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded; // Attach user info to request
next();
```
> [!IMPORTANT]
> **Viva Question:** "Explain how your API routes are protected."
> **Answer:** The client sends a JWT in the `Authorization: Bearer <token>` header. My `authMiddleware` extracts it, verifies the cryptographic signature using a secret key, and attaches the decoded user data to `req.user` before calling `next()`.

---

## 🔹 PART 4: SYLLABUS MAPPING 

### 1. Middleware
- **Lifecycle / Flow:** Request comes in ➔ Global Middleware (CORS, JSON Parser) ➔ Router Middleware (Auth) ➔ Controller ➔ Response.
- **Application vs Router Level:** `app.use(cors())` is application-level (runs on every request). `router.post('/skills', authMiddleware, ...)` is router-level (runs only for that specific endpoint).
- **Error Handling Middleware:** Identified by its 4 arguments `(err, req, res, next)`. Defined in your `middleware/errorHandler.js`.
- **Blocking vs Non-Blocking:** Express uses an asynchronous event-loop. In your `skillController.js`, you use `await Skill.find()`. If you used a synchronous blocking method, the single Node.js thread would freeze, preventing any other user from accessing the API.

### 2. Rendering & Frontend Integration
- **SSR vs CSR:** Your React frontend uses CSR (Client-Side Rendering) where the browser downloads JS and builds the UI, communicating with your `/api/*` endpoints. Your backend also supports SSR (Server-Side Rendering) using EJS (`app.set('view engine', 'ejs')`), rendering HTML directly on the server for the `/dashboard` route.

### 3. Databases (MongoDB)
- **Why MongoDB?** SkillIntel profiles have varied fields (legacy fields vs V2 fields like `skillsDetailed` array). MongoDB's document-based structure allows this schema evolution without needing complex SQL migrations.
- **Collections/Documents:** SQL has Tables and Rows; MongoDB has Collections (e.g., `users`, `skills`) and Documents (the JSON-like objects inside).
- **Mongoose (ODM):** Mongoose is an Object Data Modeling library. It provides schema validation (e.g., `required: true`, `enum`), hooks (like your password hasher), and strongly-typed queries on top of raw MongoDB.

### 4. Sessions & Cookies
- **Cookies:** Small text files stored in the browser. You set `skillintel_user` via `res.cookie()`. They can be checked in DevTools ➔ Application ➔ Cookies.
- **Express-Session:** Used in your `server.js`. It creates a unique session ID.
- **Persistent Storage:** By default, sessions live in server RAM (lost on restart). You used `connect-mongo` to store them in MongoDB Atlas, allowing sessions to persist across server restarts.

### 5. Authentication
- **AuthN vs AuthZ:** Authentication is verifying *who* the user is (Login). Authorization is verifying *what* they can do (e.g., `req.user.role === 'admin'` check in `refreshTrends`).
- **JWT:** JSON Web Token. It has 3 parts: Header, Payload (user ID, email), and Signature. It is stateless—your server doesn't need to look up a database to verify the user; it just verifies the signature math.

### 6. Advanced Backend (WebSockets)
- **Full Duplex:** HTTP is half-duplex (client asks, server answers). WebSockets are full-duplex (server can push data unprompted).
- **Socket.io:** Used in `server.js` (`io.on('connection')`). It upgrades the HTTP server to WebSockets. In SkillIntel, clients emit `requestTrending`, and the server queries the DB and emits `trendingUpdate` to push live data.

### 7. PostgreSQL (Conceptual comparison)
- If the examiner asks: "Why didn't you use PostgreSQL?"
- **Answer:** PostgreSQL is a relational database strictly enforcing tables, rows, and foreign keys. It is better for highly transactional data like banking (ACID compliance). I chose MongoDB because the structure of user profiles and dynamic skill tags is inherently hierarchical and subject to change, making a NoSQL JSON document store a more natural fit.

---

## 🔹 PART 5: DATA FLOW (Step-by-Step)

**Login Flow:**
1. **Client:** User submits email/password to React UI.
2. **Route:** Request hits `POST /api/auth/login`.
3. **Middleware:** `express.json()` parses the body.
4. **Controller:** `authController.login` runs. It queries MongoDB for the email.
5. **DB / Logic:** Uses `bcrypt.compare()` to check the password hash.
6. **Token/Session:** Generates a JWT (for API), sets `req.session.user` (for EJS), sets a generic cookie.
7. **Response:** Sends `200 OK` with the JWT and User object to the client.

---

## 🔹 PART 6: VIVA QUESTIONS

**Basic**
1. What does `require('dotenv').config()` do in your `server.js`?
2. What is the difference between `app.use(express.json())` and `express.urlencoded()`?
3. How did you connect to your database? (Ans: `mongoose.connect(process.env.MONGO_URI)`)

**Conceptual**
4. Why do you use BOTH JWT and express-session in the same project?
5. Explain your Mongoose `User` schema. How do you handle password storage?
6. If a user loses their JWT, what happens?
7. How does Socket.io differ from a standard REST API endpoint?

**Tricky / Follow-up**
8. I see you used `next(err)` in your catch blocks. What exactly does `next()` do when passed an error?
9. In `authController.js`, why don't you send the password back in the response object?
10. In `models/Skill.js`, you have `unique: true` on the `name` field. How does this affect MongoDB under the hood? *(Ans: It creates a database Index, turning O(n) full-collection scans into O(log n) lookups).*
11. What happens if your Node.js server crashes? Will logged-in users via EJS be logged out? *(Ans: No, because I used `connect-mongo` to store sessions persistently in the DB, not in RAM).*

---

## 🔹 PART 7: WEAK POINTS & IMPROVEMENTS

If asked "What are the weaknesses in your current code?", answer honestly:

1. **Security - Rate Limiting:** "Currently, my `/api/auth/login` route lacks rate limiting. An attacker could brute-force passwords. I would improve this by adding `express-rate-limit`."
2. **Security - JWT Storage:** "If the React frontend stores the JWT in `localStorage`, it is vulnerable to XSS attacks. A better practice would be storing the JWT in an `httpOnly` cookie."
3. **Validation:** "I do basic regex validation for emails, but I could integrate a robust validation library like `Joi` or `Zod` to strictly type-check all incoming API requests before they hit the controllers."

---

## 🔹 PART 8: RAPID REVISION

- **Middleware:** Functions that have access to the req/res objects. They form a pipeline.
- **JWT:** A stateless, cryptographically signed token.
- **Bcrypt:** A one-way hashing algorithm with a "salt" to prevent rainbow table attacks.
- **Socket.io:** A library enabling real-time, bidirectional, event-based communication.
- **Mongoose:** An ODM (Object Data Modeling) library providing schemas for MongoDB.
- **Next():** A function that passes control to the next middleware. If it receives an argument `next(err)`, it skips all normal middleware and jumps straight to the Error Handler.

---

## 🔹 PART 9: FINAL VIVA STRATEGY

1. **"Explain your project"**: Start with the high-level goal (Market Intelligence for skills), then quickly mention the stack (MERN-ish with Node/Express).
2. **"Show me your code"**: *ALWAYS* open `server.js` first. It proves you understand the big picture. Next, show `models/User.js` to demonstrate you care about security (bcrypt).
3. **Handling Cross Questions**: If asked a question you don't know (e.g., "How does Node.js garbage collection work?"), pivot gracefully: *"I haven't explored V8 garbage collection deeply yet, but I do understand how Node's asynchronous event loop prevents blocking I/O, which is why I used async/await in my controllers..."*
4. **Mistakes to Avoid**: Do NOT say "MongoDB is faster than SQL." Say "MongoDB's flexible document schema was a better fit for my dynamic profile data." Use precise, technical vocabulary.
