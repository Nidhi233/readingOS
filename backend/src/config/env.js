require('dotenv').config();

const config = {
  port: process.env.PORT || 5050,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

// Validate required environment variables
// DATABASE_URL can be used instead of individual DB variables
const hasDatabaseUrl = !!process.env.DATABASE_URL;
const hasIndividualDbVars = process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD;

const requiredEnvVars = ['JWT_SECRET', 'GROQ_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

// Check database configuration
if (!hasDatabaseUrl && !hasIndividualDbVars) {
  missingEnvVars.push('DATABASE_URL (or DB_NAME, DB_USER, DB_PASSWORD)');
}

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('💡 Tip: Use DATABASE_URL or provide DB_NAME, DB_USER, and DB_PASSWORD');
  process.exit(1);
}

module.exports = config;