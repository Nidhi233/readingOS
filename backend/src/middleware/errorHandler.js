const errorHandler = (err, req, res, next) => {
  console.error('🔴 Error Handler Caught:', err); // Add this
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
  }); // Add this

  // Mongoose/Sequelize validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    return res.status(409).json({ error: 'Resource already exists' });
  }

  // PostgreSQL connection errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ error: 'Database connection failed' });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Show stack in dev
  });
};

module.exports = errorHandler;