const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const pool = require('../config/database');

class SecurityMiddleware {
  // Enhanced rate limiting with database tracking
  static createRateLimiter(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 100,
      message = 'Too many requests from this IP',
      skipSuccessfulRequests = false,
      skipFailedRequests = false
    } = options;

    return rateLimit({
      windowMs,
      max,
      message: {
        success: false,
        message: message,
        retryAfter: Math.ceil(windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests,
      skipFailedRequests,
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
      },
      onLimitReached: (req, res, options) => {
        console.warn(`🚨 Rate limit exceeded for IP: ${req.ip}, endpoint: ${req.path}`);
        
        // Log to database for security monitoring
        SecurityMiddleware.logRateLimitEvent(req.ip, req.path, true).catch(error => {
          console.error('Failed to log rate limit event:', error);
        });
      },
      handler: async (req, res) => {
        // Log rate limit violation
        await SecurityMiddleware.logRateLimitEvent(req.ip, req.path, true);
        
        res.status(429).json({
          success: false,
          message: message,
          retryAfter: Math.ceil(windowMs / 1000),
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }
    });
  }

  // Strict rate limiting for authentication endpoints
  static authRateLimiter() {
    return SecurityMiddleware.createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: 'Too many authentication attempts, please try again later',
      skipSuccessfulRequests: true // Don't count successful requests
    });
  }

  // Moderate rate limiting for general API
  static apiRateLimiter() {
    return SecurityMiddleware.createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: 'Too many API requests, please slow down'
    });
  }

  // Strict rate limiting for admin endpoints
  static adminRateLimiter() {
    return SecurityMiddleware.createRateLimiter({
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 50, // 50 requests per window
      message: 'Too many admin requests, please slow down'
    });
  }

  // Enhanced security headers
  static securityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          childSrc: ["'none'"],
          workerSrc: ["'self'"],
          manifestSrc: ["'self'"],
          upgradeInsecureRequests: []
        }
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }

  // Input validation and sanitization
  static validateInput(schema) {
    return (req, res, next) => {
      try {
        const { error, value } = schema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true
        });

        if (error) {
          const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }));

          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors
          });
        }

        // Replace request body with validated and sanitized data
        req.body = value;
        next();
      } catch (err) {
        console.error('Input validation error:', err);
        res.status(500).json({
          success: false,
          message: 'Internal server error during validation'
        });
      }
    };
  }

  // SQL injection protection
  static async logQuery(query, params, userId = null) {
    try {
      // Log potentially dangerous queries for security monitoring
      const dangerousPatterns = [
        /DROP\s+TABLE/i,
        /DELETE\s+FROM/i,
        /UPDATE\s+.*\s+SET/i,
        /INSERT\s+INTO/i,
        /UNION\s+SELECT/i,
        /--/,
        /\/\*/,
        /\*\//
      ];

      const isDangerous = dangerousPatterns.some(pattern => pattern.test(query));

      if (isDangerous) {
        await SecurityMiddleware.logSecurityEvent(userId, 'DANGEROUS_QUERY_ATTEMPT', 'database', null, false, 'Potentially dangerous SQL query detected');
        console.warn(`🚨 Dangerous query attempt: ${query.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error('Failed to log query:', error);
    }
  }

  // IP-based security monitoring
  static async monitorSuspiciousActivity(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const endpoint = req.path;
    const method = req.method;

    try {
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /\.\.\//,  // Path traversal
        /<script/i,  // XSS attempt
        /javascript:/i,  // XSS attempt
        /union.*select/i,  // SQL injection
        /drop\s+table/i,  // SQL injection
        /exec\s*\(/i,  // Code injection
        /eval\s*\(/i  // Code injection
      ];

      const queryString = JSON.stringify(req.query);
      const bodyString = JSON.stringify(req.body);
      const fullRequest = `${endpoint} ${queryString} ${bodyString}`;

      const isSuspicious = suspiciousPatterns.some(pattern => 
        pattern.test(fullRequest)
      );

      if (isSuspicious) {
        await SecurityMiddleware.logSecurityEvent(null, 'SUSPICIOUS_REQUEST', 'endpoint', endpoint, false, 'Suspicious request pattern detected');
        console.warn(`🚨 Suspicious request from IP ${ip}: ${endpoint}`);
        
        // Block suspicious requests
        return res.status(403).json({
          success: false,
          message: 'Request blocked for security reasons',
          code: 'SECURITY_VIOLATION'
        });
      }

      // Check IP reputation (simple implementation)
      const isBlocked = await SecurityMiddleware.checkIPReputation(ip);
      if (isBlocked) {
        await SecurityMiddleware.logSecurityEvent(null, 'BLOCKED_IP_ACCESS', 'ip', ip, false, 'IP address is blocked');
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          code: 'IP_BLOCKED'
        });
      }

      next();
    } catch (error) {
      console.error('Security monitoring error:', error);
      next(); // Continue on error to avoid breaking the application
    }
  }

  // Database logging for rate limit events
  static async logRateLimitEvent(ipAddress, endpoint, blocked = false) {
    try {
      const query = `
        INSERT INTO rate_limit_logs (ip_address, endpoint, request_count, window_start, blocked)
        VALUES ($1, $2, 1, CURRENT_TIMESTAMP, $3)
        ON CONFLICT (ip_address, endpoint, window_start)
        DO UPDATE SET
          request_count = rate_limit_logs.request_count + 1,
          blocked = $3
        RETURNING id
      `;

      await pool.query(query, [ipAddress, endpoint, blocked]);
    } catch (error) {
      console.error('Failed to log rate limit event:', error);
    }
  }

  // Simple IP reputation check
  static async checkIPReputation(ipAddress) {
    try {
      // Check if IP has recent violations
      const query = `
        SELECT COUNT(*) as violation_count
        FROM rate_limit_logs
        WHERE ip_address = $1 
          AND blocked = true 
          AND window_start >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
      `;

      const result = await pool.query(query, [ipAddress]);
      const violations = parseInt(result.rows[0].violation_count);

      // Block IP if more than 10 violations in the last hour
      return violations > 10;
    } catch (error) {
      console.error('Failed to check IP reputation:', error);
      return false; // Allow on error to avoid false positives
    }
  }

  // Security event logging
  static async logSecurityEvent(userId, action, resourceType = null, resourceId = null, success = true, errorMessage = null) {
    try {
      const query = `
        INSERT INTO security_audit_logs (user_id, action, resource_type, resource_id, success, error_message)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;

      const result = await pool.query(query, [userId, action, resourceType, resourceId, success, errorMessage]);
      
      // Log to console for immediate visibility
      if (!success) {
        console.warn(`🚨 Security Event: ${action} by user ${userId} - ${errorMessage}`);
      }

      return result.rows[0].id;
    } catch (error) {
      console.error('Failed to log security event:', error);
      return null;
    }
  }

  // Data sanitization for responses
  static sanitizeResponse(data, userRole = 'user') {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Fields to remove based on user role
    const sensitiveFields = {
      user: ['password_hash', 'internal_notes', 'admin_comments'],
      admin: [] // Admins can see everything
    };

    const fieldsToRemove = sensitiveFields[userRole] || [];

    if (Array.isArray(data)) {
      return data.map(item => SecurityMiddleware.sanitizeResponse(item, userRole));
    }

    const sanitized = { ...data };

    fieldsToRemove.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    });

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = SecurityMiddleware.sanitizeResponse(sanitized[key], userRole);
      }
    });

    return sanitized;
  }

  // CORS configuration
  static corsOptions() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000'];

    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`🚨 CORS violation: Origin ${origin} not allowed`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
      exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining']
    };
  }
}

module.exports = SecurityMiddleware;
