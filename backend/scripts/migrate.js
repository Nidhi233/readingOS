const fs = require('fs');
const path = require('path');
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

const runMigrations = async () => {
  try {
    console.log('🔄 Starting database migrations...\n');

    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      console.log(`Running: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await pool.query(sql);
      console.log(`✅ ${file} completed\n`);
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();