/**
 * 🌸 CerviCare Backend — App Entry Point
 * 
 * This is the main server file for the CerviCare Backend API.
 * It initializes middleware, routes, and services for the platform.
 * 
 * Architecture: Clean Express.js with Modular Routing
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import Config & Middlewares
const pool = require('./config/database');
const SecurityMiddleware = require('./middleware/security');
const ProductionMiddleware = require('./middleware/production');
const authMiddleware = require('./middleware/auth');

// Import Routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const personalizationRoutes = require('./routes/personalization');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhook');
const automationRoutes = require('./routes/automation');
const analyticsRoutes = require('./routes/analytics');
const avatarRoutes = require('./routes/avatar');
const botDataRoutes = require('./routes/botData');

// Initialize Services
const googleSheetsService = require('./services/googleSheetsService');
const sheetsSyncService = require('./services/sheetsSyncService');
const seederService = require('./services/seederService');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * ─── MIDDLEWARE SETUP ───
 */

// Production & Security Enhancements
app.use(ProductionMiddleware.validateEnvironment);
app.use(ProductionMiddleware.correlationId);
app.use(ProductionMiddleware.requestLogger);
app.use(ProductionMiddleware.performanceMonitor);
app.use(helmet(SecurityMiddleware.securityHeaders()));
app.use(cors(SecurityMiddleware.corsOptions()));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Files & Uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Monitoring
app.use(SecurityMiddleware.monitorSuspiciousActivity);

/**
 * ─── ROUTE DEFINITIONS ───
 */

// Health Checks
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CerviCare API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/detailed', ProductionMiddleware.detailedHealthCheck);

// API Routes
app.use('/api/auth', SecurityMiddleware.authRateLimiter(), authRoutes);
app.use('/api/profile', authMiddleware, profileRoutes);
app.use('/api/admin', SecurityMiddleware.adminRateLimiter(), adminRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/automation', authMiddleware, automationRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/bot-data', botDataRoutes);

// Broad mounting for personalization (Keep last)
app.use('/api', personalizationRoutes);

/**
 * ─── ERROR HANDLING ───
 */

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global Error Handler
app.use(ProductionMiddleware.globalErrorHandler);

/**
 * ─── SERVER INITIALIZATION ───
 */

const startServer = async () => {
  try {
    console.log('🔄 Initializing CerviCare Services...');

    // 1. Database Connectivity & Seeding
    await seederService.seed();
    console.log('✅ Database connected and verified');

    // 2. Third-party Integrations (Google Sheets)
    if (process.env.GOOGLE_SHEETS_ID) {
      await googleSheetsService.initialize();
      await sheetsSyncService.initialize();
      sheetsSyncService.startBackgroundProcessing();
      console.log('✅ Google Sheets integration active');
    } else {
      console.log('ℹ️ Google Sheets integration skipped (no ID provided)');
    }

    // 3. Listen
    app.listen(PORT, () => {
      console.log(`🚀 CerviCare Backend is live on port ${PORT}`);
      console.log(`🌍 Mode: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Critical failure during server startup:', error);
    process.exit(1);
  }
};

// Graceful Shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  // Add cleanup logic here if needed (e.g. pool.end())
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();

module.exports = app;
