const { Pool } = require('pg');
require('dotenv').config();

// Enhanced database configuration for Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon requires SSL, so always enable it for Neon connections
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout for Neon
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

module.exports = pool;
