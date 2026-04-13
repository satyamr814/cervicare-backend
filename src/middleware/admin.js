const { verifyToken } = require('../config/jwt');

const adminMiddleware = async (req, res, next) => {
  try {
    // Check for admin key in environment (simple approach)
    const adminKey = req.header('X-Admin-Key');
    const expectedAdminKey = process.env.ADMIN_KEY;
    
    if (expectedAdminKey && adminKey === expectedAdminKey) {
      req.admin = { role: 'admin', source: 'key' };
      return next();
    }

    // Check for JWT token with admin role
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin access denied. No admin key or token provided.' 
      });
    }

    const decoded = verifyToken(token);
    
    // In production, you would verify admin role from database
    // For now, we'll use a simple check against admin emails
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@cervicare.com'];
    
    if (!adminEmails.includes(decoded.email)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access denied. Insufficient privileges.' 
      });
    }

    req.admin = { 
      email: decoded.email, 
      userId: decoded.userId,
      role: 'admin',
      source: 'jwt'
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin token.' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during admin authentication.' 
    });
  }
};

module.exports = adminMiddleware;
