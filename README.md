# 🚀 SkillIndex – Skill to Economy Engine

SkillIndex is a backend-powered platform that analyzes market data to determine the **most valuable skills in the economy**.  
It processes skill data through a pipeline and provides an API to access ranked skills based on demand, growth, and salary trends.

This project demonstrates **backend architecture, REST APIs, middleware usage, and automated data pipelines using Node.js and Express.**

---

# 📌 Features

- Skill demand analysis pipeline
- REST API for retrieving ranked skills
- Automatic pipeline execution on server startup
- Static frontend file serving
- Custom 404 error handling
- Global server error handler
- Modular backend structure

---

# 🏗 Tech Stack

**Backend**
- Node.js
- Express.js

**Other Tools**
- JavaScript
- REST APIs
- Middleware Architecture

---

# 📂 Project Structure

```
SkillIntel
│
├── server.js                # Main server file
│
├── routes
│   └── skillRoutes.js       # API routes
│
├── jobs
│   └── skillPipeline.js     # Skill processing pipeline
│
├── public                   # Static frontend files
│   ├── index.html
│   └── 404.html
│
└── package.json
```

---

# ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/your-username/skillindex.git
```

Move into the project directory:

```bash
cd skillindex
```

Install dependencies:

```bash
npm install
```

---

# ▶️ Running the Server

Start the server:

```bash
node server.js
```

Or with nodemon (recommended for development):

```bash
npm run dev
```

Server will run on:

```
http://localhost:3000
```

---

# 📡 API Endpoints

## Get Ranked Skills

```
GET /api/skills
```

Example Response:

```json
[
  {
    "skill": "React",
    "category": "Frontend",
    "demandScore": 98,
    "growth": 15,
    "averageSalary": 130000
  }
]
```

---

# 🔄 Skill Processing Pipeline

When the server starts, a **Skill Pipeline** runs automatically.

The pipeline:

1. Collects skill data
2. Processes demand and salary metrics
3. Ranks skills by economic value
4. Prepares data for API access

Pipeline file location:

```
/jobs/skillPipeline.js
```

---

# 🧠 Backend Architecture

Request Flow:

```
Client Request
      │
      ▼
Middleware
(express.json / urlencoded)
      │
      ▼
API Routes
(/api/skills)
      │
      ▼
Skill Processing Logic
      │
      ▼
Response Sent
```

---

# ❗ Error Handling

The application includes robust error handling.

### 404 Handler

- Returns JSON for API requests
- Returns a custom HTML page for frontend routes

### Global Error Handler

Handles unexpected errors and prevents server crashes.

Example response:

```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

---

# 🌐 Static File Serving

Frontend files are served using Express static middleware.

```
app.use(express.static('public'))
```

Example access:

```
http://localhost:3000/index.html
```

---

# 🔮 Future Improvements

- AI-powered skill demand prediction
- Real-time job market scraping
- Skill recommendation engine
- Salary prediction model
- Interactive analytics dashboard

---

# 👨‍💻 Author

**Piyush Garg**  
Computer Science Engineering Student

---

# 📄 License

This project is licensed under the MIT License.
