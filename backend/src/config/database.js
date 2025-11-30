const { Pool } = require('pg');
require('dotenv').config();

// Helper function to get database config from DATABASE_URL or individual variables
const getDatabaseConfig = () => {
  // If DATABASE_URL is provided, use it (common in production/cloud platforms)
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      // For SSL connections (common in production)
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
  }

  // Fallback to individual variables (for local development)
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
};

const pool = new Pool(getDatabaseConfig());

pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

module.exports = pool;