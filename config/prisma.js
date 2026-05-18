const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pkg = require('pg');

const { Pool } = pkg;

// create pg pool using your env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL_Post,
});

// create adapter
const adapter = new PrismaPg(pool);

// create prisma client with adapter
const prisma = new PrismaClient({
  adapter,
});

module.exports = prisma;