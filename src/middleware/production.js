const analyticsService = require('../services/analyticsService');
const SecurityMiddleware = require('./security');

class ProductionMiddleware {
  // Global error handler
  static globalErrorHandler(err, req, res, next) {
    // Log error details
    console.error('Production Error:', {
      timestamp: new Date().toISOString(),
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId
    });

    // Track error event
    analyticsService.trackEvent(req.user?.userId, 'system_error', {
      error: err.message,
      url: req.url,
      method: req.method
    }, {
      sessionId: req.sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }).catch(error => {
      console.error('Failed to track error event:', error);
    });

    // Log security event if it's a security-related error
    if (err.message.includes('authentication') || err.message.includes('authorization')) {
      SecurityMiddleware.logSecurityEvent(
        req.user?.userId,
        'SECURITY_VIOLATION',
        'endpoint',
        req.url,
        false,
        err.message
      ).catch(error => {
        console.error('Failed to log security event:', error);
      });
    }

    // Don't expose internal details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
      success: false,
      message: isDevelopment ? err.message : 'Internal server error',
      ...(isDevelopment && { 
        stack: err.stack,
        details: err.details 
      }),
      code: err.code || 'INTERNAL_ERROR'
    });
  }

  // Enhanced health check endpoint
  static healthCheck(req, res) {
    const health = {
      success: true,
      message: 'CerviCare Backend API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: 'unknown',
        google_sheets: 'unknown',
        n8n_webhooks: 'unknown'
      }
    };

    // Check database health
    ProductionMiddleware.checkDatabaseHealth()
      .then(isHealthy => {
        health.services.database = isHealthy ? 'healthy' : 'unhealthy';
      })
      .catch(error => {
        health.services.database = 'error';
        console.error('Database health check failed:', error);
      });

    // Check Google Sheets service
    const sheetsSyncService = require('../services/sheetsSyncService');
    health.services.google_sheets = sheetsSyncService.isInitialized ? 'connected' : 'disconnected';

    // Check n8n webhook service
    const automationService = require('../services/automationService');
    health.services.n8n_webhooks = automationService.n8nWebhookUrl ? 'configured' : 'not_configured';

    // Record system metric
    analyticsService.recordSystemMetric('health_check', 1, 'boolean', {
      environment: process.env.NODE_ENV || 'development'
    }).catch(error => {
      console.error('Failed to record health metric:', error);
    });

    res.status(200).json(health);
  }

  // Detailed health check for monitoring
  static detailedHealthCheck(req, res) {
    const health = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      services: {},
      metrics: {}
    };

    // Database health check
    ProductionMiddleware.checkDatabaseHealth()
      .then(isHealthy => {
        health.services.database = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString()
        };
      })
      .catch(error => {
        health.services.database = {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      });

    // Google Sheets health check
    const sheetsSyncService = require('../services/sheetsSyncService');
    health.services.google_sheets = {
      status: sheetsSyncService.isInitialized ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    };

    // Get recent system metrics
    analyticsService.getSystemMetrics(null, 1)
      .then(metrics => {
        health.metrics = metrics.slice(0, 10); // Last 10 metrics
      })
      .catch(error => {
        console.error('Failed to get system metrics:', error);
      });

    res.status(200).json(health);
  }

  // Database health check
  static async checkDatabaseHealth() {
    try {
      const pool = require('../config/database');
      const result = await pool.query('SELECT 1 as health_check');
      return result.rows.length > 0 && result.rows[0].health_check === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Request logging middleware
  static requestLogger(req, res, next) {
    const startTime = Date.now();
    const userId = req.user?.userId;

    // Log request start
    console.log(`📥 ${req.method} ${req.url} - IP: ${req.ip} - User: ${userId || 'anonymous'}`);

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - startTime;
      const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
      
      console.log(`📤 ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms - ${logLevel}`);

      // Track request metrics
      analyticsService.recordSystemMetric('request_duration', duration, 'milliseconds', {
        method: req.method,
        endpoint: req.url,
        status_code: res.statusCode,
        user_authenticated: !!userId
      }).catch(error => {
        console.error('Failed to record request metric:', error);
      });

      // Track slow requests
      if (duration > 2000) {
        analyticsService.trackEvent(userId, 'slow_request', {
          duration: duration,
          endpoint: req.url,
          method: req.method
        }, {
          sessionId: req.sessionId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }).catch(error => {
          console.error('Failed to track slow request:', error);
        });
      }

      originalEnd.call(this, chunk, encoding);
    };

    next();
  }

  // Structured logging helper
  static structuredLog(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      environment: process.env.NODE_ENV || 'development',
      ...metadata
    };

    console.log(JSON.stringify(logEntry));
  }

  // Performance monitoring middleware
  static performanceMonitor(req, res, next) {
    const startTime = process.hrtime.bigint();
    const userId = req.user?.userId;

    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      // Track performance metrics
      analyticsService.recordSystemMetric('response_time', duration, 'milliseconds', {
        method: req.method,
        endpoint: req.url,
        status_code: res.statusCode
      }).catch(error => {
        console.error('Failed to record performance metric:', error);
      });

      // Alert on slow responses
      if (duration > 5000) {
        ProductionMiddleware.structuredLog('WARN', 'Slow response detected', {
          duration: duration,
          endpoint: req.url,
          method: req.method,
          user_id: userId
        });
      }
    });

    next();
  }

  // Graceful shutdown handler
  static gracefulShutdown(signal) {
    return async (req, res, next) => {
      ProductionMiddleware.structuredLog('INFO', `Received ${signal}, starting graceful shutdown`);
      
      // Set a timeout for graceful shutdown
      const shutdownTimeout = setTimeout(() => {
        ProductionMiddleware.structuredLog('ERROR', 'Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 30000); // 30 seconds

      try {
        // Close database connections
        const pool = require('../config/database');
        await pool.end();
        
        ProductionMiddleware.structuredLog('INFO', 'Database connections closed');
        
        // Clear timeout and exit
        clearTimeout(shutdownTimeout);
        process.exit(0);
      } catch (error) {
        ProductionMiddleware.structuredLog('ERROR', 'Error during graceful shutdown', {
          error: error.message
        });
        clearTimeout(shutdownTimeout);
        process.exit(1);
      }
    };
  }

  // Environment validation middleware
  static validateEnvironment(req, res, next) {
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      ProductionMiddleware.structuredLog('ERROR', 'Missing required environment variables', {
        missing_vars: missingVars
      });

      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        code: 'MISSING_ENV_VARS'
      });
    }

    // Validate JWT secret strength
    if (process.env.JWT_SECRET.length < 32) {
      ProductionMiddleware.structuredLog('ERROR', 'JWT secret is too short', {
        secret_length: process.env.JWT_SECRET.length
      });

      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        code: 'WEAK_JWT_SECRET'
      });
    }

    next();
  }

  // API versioning middleware
  static apiVersioning(req, res, next) {
    const apiVersion = req.headers['api-version'] || 'v1';
    req.apiVersion = apiVersion;

    // Add API version to response headers
    res.setHeader('API-Version', apiVersion);
    res.setHeader('Supported-Versions', 'v1');

    next();
  }

  // Request correlation ID middleware
  static correlationId(req, res, next) {
    const correlationId = req.headers['x-correlation-id'] || 
                        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    next();
  }
}

module.exports = ProductionMiddleware;
