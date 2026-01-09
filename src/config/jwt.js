const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT_SECRET must be set via environment variable
// In production, this will fail if not set (as per ProductionMiddleware validation)
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Warn if using fallback in production
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'fallback-secret-key') {
  console.warn('⚠️  WARNING: Using fallback JWT_SECRET in production. Set JWT_SECRET environment variable!');
}

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET
};
