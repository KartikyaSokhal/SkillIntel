# SkillIndex – AI Skill Market Intelligence API

SkillIndex is a **Node.js backend API** that analyzes real job listings and uses AI to generate structured data about **technology skills, demand trends, and recommended learning paths**.

The system fetches job listings, analyzes them using the **[Google](chatgpt://generic-entity?number=0) Gemini API**, and updates a dynamic dataset of skills used by the API.

The goal is to create a **Skill Intelligence Platform** that helps developers understand:

- which skills are in demand  
- how skills are connected  
- which technologies to learn next  

---

# Vision

The long-term vision of SkillIndex is to build a **real-time skill intelligence engine** powered by job market data and AI.

Instead of static career advice, the platform analyzes **live job listings** and converts them into structured insights about:

- skill demand
- growth trends
- salary estimates
- related technologies

This enables developers, students, and professionals to make **data-driven learning decisions**.

The system aims to evolve into a platform that can:

- track global technology demand
- map relationships between skills
- generate learning paths
- analyze emerging technologies

Ultimately, SkillIndex can function as a **career intelligence layer for the developer ecosystem**.

---

# Features

- AI-powered skill analysis  
- Real job listing data pipeline  
- REST API for skill intelligence  
- Skill comparison  
- Trending skill detection  
- Skill recommendation graph  
- Automatic dataset updates  

---

# Tech Stack

Backend

- Node.js  
- Express.js  
- Gemini AI API  
- Axios  

Other Tools

- Nodemon  
- dotenv  
- REST API architecture  

---

# Project Architecture

SkillIntel
│
├── controllers
│   └── skillController.js
│
├── routes
│   └── skillRoutes.js
│
├── services
│   ├── jobFetcher.js
│   ├── geminiAnalyzer.js
│   └── skillUpdater.js
│
├── jobs
│   └── skillPipeline.js
│
├── utils
│   └── fileHandler.js
│
├── data
│   └── skills.json
│
├── public
│
├── server.js
└── README.md

---

# How the AI Pipeline Works

Job Listings API
↓
Fetch latest jobs
↓
Gemini AI analyzes job descriptions
↓
Extract skills and demand metrics
↓
Generate structured JSON dataset
↓
Update skills.json
↓
API serves the updated data

This creates a **dynamic skill intelligence dataset derived from real job postings**.

---

# Installation

Clone the repository

git clone https://github.com/yourusername/skillindex.git

Enter the project

cd SkillIntel

Install dependencies

npm install

---

# Environment Variables

Create a `.env` file in the root folder.

GEMINI_API_KEY=your_gemini_api_key

Generate a Gemini API key from:

https://aistudio.google.com/app/apikey

---

# Running the Server

Start the development server

npm run dev

The server will run at

http://localhost:3000

---

# API Endpoints

### Get All Skills

GET /api/skills

Returns all skills with demand scores and metadata.

---

### Get Single Skill

GET /api/skills/:name

Example

GET /api/skills/react

---

### Trending Skills

GET /api/skills/trending

Returns skills sorted by growth rate.

---

### Recommended Skills

GET /api/skills/recommended/:skill

Example

GET /api/skills/recommended/react

---

### Compare Skills

GET /api/skills/compare?skills=react,angular,vue

---

### Refresh Skill Dataset (AI Pipeline)

POST /api/skills/refresh

Triggers the job analysis pipeline that fetches job listings and updates the skill dataset.

Example:

curl -X POST http://localhost:3000/api/skills/refresh

---

# Example Skill Data

```json
{
  "name": "React",
  "category": "Frontend Development",
  "demandScore": 95,
  "growth": 15,
  "averageSalary": 130000,
  "recommended": [
    "JavaScript",
    "Redux",
    "Next.js",
    "HTML",
    "CSS"
  ]
}

