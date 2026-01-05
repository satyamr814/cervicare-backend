require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const personalizationRoutes = require('./routes/personalization');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhook');
const automationRoutes = require('./routes/automation');
const analyticsRoutes = require('./routes/analytics');
const avatarRoutes = require('./routes/avatar');

// Import middleware
const authMiddleware = require('./middlewares/auth');
const RoleMiddleware = require('./middlewares/roles');
const SecurityMiddleware = require('./middlewares/security');
const ProductionMiddleware = require('./middlewares/production');

// Initialize services
const googleSheetsService = require('./services/googleSheetsService');
const sheetsSyncService = require('./services/sheetsSyncService');
const automationService = require('./services/automationService');
const analyticsService = require('./services/analyticsService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply production middleware
app.use(ProductionMiddleware.validateEnvironment);
app.use(ProductionMiddleware.correlationId);
app.use(ProductionMiddleware.requestLogger);
app.use(ProductionMiddleware.performanceMonitor);
app.use(ProductionMiddleware.apiVersioning);

// Security middleware
app.use(SecurityMiddleware.securityHeaders());
app.use(cors(SecurityMiddleware.corsOptions()));

// Rate limiting
app.use(SecurityMiddleware.apiRateLimiter());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Suspicious activity monitoring
app.use(SecurityMiddleware.monitorSuspiciousActivity);

// Health check endpoint
app.get('/api/health', ProductionMiddleware.healthCheck);
app.get('/api/health/detailed', ProductionMiddleware.detailedHealthCheck);

// API Routes
app.use('/api/auth', SecurityMiddleware.authRateLimiter(), authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', personalizationRoutes);
app.use('/api/admin', SecurityMiddleware.adminRateLimiter(), adminRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/avatar', avatarRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use(ProductionMiddleware.globalErrorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 CerviCare Backend Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`👤 Profile endpoints: http://localhost:${PORT}/api/profile`);
  console.log(`🎯 Personalization endpoints: http://localhost:${PORT}/api`);
  console.log(`🛡️ Admin endpoints: http://localhost:${PORT}/api/admin`);
  console.log(`🔗 Webhook endpoints: http://localhost:${PORT}/api/webhook`);
  console.log(`📊 Analytics endpoints: http://localhost:${PORT}/api/analytics`);
  console.log(`👤 Avatar endpoints: http://localhost:${PORT}/api/avatar`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize Phase 3 services
  await googleSheetsService.initialize();
  await sheetsSyncService.initialize();
  
  // Start background processing
  sheetsSyncService.startBackgroundProcessing();
  
  console.log('✅ Phase 3 services initialized successfully');
  console.log('🚀 Phase 4 production hardening enabled');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
