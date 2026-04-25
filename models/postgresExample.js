/**
 * ═══════════════════════════════════════════════════════════════
 * PostgreSQL Reference — SkillIntel (SYLLABUS REQUIREMENT)
 * ═══════════════════════════════════════════════════════════════
 *
 * This file is for REFERENCE ONLY. SkillIntel uses MongoDB (NoSQL)
 * as its primary database. This file demonstrates how a relational
 * database like PostgreSQL could be used instead, for comparison
 * purposes and viva preparation.
 *
 * ─────────────────────────────────────────────────────────────
 * HOW TO CONNECT POSTGRESQL USING THE `pg` npm PACKAGE
 * ─────────────────────────────────────────────────────────────
 *
 * Step 1: Install the package
 *   npm install pg
 *
 * Step 2: Create a connection pool
 *
 *   const { Pool } = require('pg');
 *
 *   const pool = new Pool({
 *       user: process.env.PG_USER,        // e.g. 'postgres'
 *       host: process.env.PG_HOST,        // e.g. 'localhost'
 *       database: process.env.PG_DB,      // e.g. 'skillintel'
 *       password: process.env.PG_PASS,    // e.g. 'secretpassword'
 *       port: process.env.PG_PORT || 5432
 *   });
 *
 * Step 3: Create a table (SQL DDL)
 *
 *   CREATE TABLE skills (
 *       id          SERIAL PRIMARY KEY,
 *       name        VARCHAR(100) NOT NULL UNIQUE,
 *       category    VARCHAR(50) NOT NULL,
 *       demand_index DECIMAL(3,1),
 *       salary      INTEGER,
 *       growth      DECIMAL(5,1),
 *       experience_barrier VARCHAR(20),
 *       saturation_risk    VARCHAR(30),
 *       description TEXT,
 *       created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 *   );
 *
 * Step 4: Run a parameterized query (prevents SQL injection)
 *
 *   async function getSkillByName(name) {
 *       const query = 'SELECT * FROM skills WHERE LOWER(name) = LOWER($1)';
 *       const result = await pool.query(query, [name]);
 *       return result.rows[0] || null;
 *   }
 *
 *   // $1 is a parameterized placeholder — the actual value is passed
 *   // separately, so user input can never be interpreted as SQL code.
 *   // This is the #1 defense against SQL Injection attacks.
 *
 * Step 5: Insert data
 *
 *   async function createSkill(skill) {
 *       const query = `
 *           INSERT INTO skills (name, category, demand_index, salary, growth)
 *           VALUES ($1, $2, $3, $4, $5)
 *           RETURNING *
 *       `;
 *       const values = [skill.name, skill.category, skill.demandIndex,
 *                       skill.salary, skill.growth];
 *       const result = await pool.query(query, values);
 *       return result.rows[0];
 *   }
 *
 * ─────────────────────────────────────────────────────────────
 * COMPARISON TABLE: MongoDB (NoSQL) vs PostgreSQL (SQL)
 * ─────────────────────────────────────────────────────────────
 *
 * ┌─────────────────────┬──────────────────────┬──────────────────────┐
 * │ Feature             │ MongoDB (NoSQL)      │ PostgreSQL (SQL)     │
 * ├─────────────────────┼──────────────────────┼──────────────────────┤
 * │ Data Format         │ JSON-like documents  │ Tables + Rows        │
 * │ Schema              │ Flexible (dynamic)   │ Strict (predefined)  │
 * │ Query Language      │ MongoDB Query API    │ SQL                  │
 * │ Relationships       │ Embedded / $ref      │ JOINs + Foreign Keys │
 * │ Scaling Strategy    │ Horizontal (shards)  │ Vertical (bigger hw) │
 * │ Transactions        │ Multi-doc (4.0+)     │ Full ACID            │
 * │ Best For            │ Flexible/varied data │ Structured/relational│
 * │ ORM / ODM           │ Mongoose (ODM)       │ Sequelize (ORM)      │
 * │ Used in SkillIntel  │ ✅ Yes (primary DB)  │ ❌ Reference only    │
 * └─────────────────────┴──────────────────────┴──────────────────────┘
 *
 * WHY MONGODB FOR SKILLINTEL?
 * ───────────────────────────
 * - Skill documents have nested arrays (regionalDemand, careerPaths)
 *   which map naturally to JSON documents — no JOINs needed.
 * - Schema flexibility allows adding new fields without migrations.
 * - MongoDB Atlas provides free-tier cloud hosting for student projects.
 * - Mongoose provides schema validation while keeping NoSQL flexibility.
 *
 * WHEN WOULD POSTGRESQL BE BETTER?
 * ─────────────────────────────────
 * - If skills had complex many-to-many relationships (e.g., skill → course → university)
 * - If we needed strict transactional guarantees across tables
 * - If the data had a very rigid, predictable structure
 * - If we needed complex aggregations with JOINs across multiple tables
 *
 * ═══════════════════════════════════════════════════════════════
 */

// This file is intentionally left as comments-only.
// No code is executed — it serves as a syllabus reference document.
console.log('📚 This file is a PostgreSQL reference. See comments for examples.');
