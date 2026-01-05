const express = require('express');
const AnalyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/auth');
const RoleMiddleware = require('../middlewares/roles');
const SecurityMiddleware = require('../middlewares/security');

const router = express.Router();

// Apply authentication to all analytics routes
router.use(authMiddleware);

// Event tracking (all authenticated users)
router.post('/events', AnalyticsController.trackEvent);

// User engagement metrics (all authenticated users)
router.get('/engagement', AnalyticsController.getUserEngagement);

// Admin-only analytics endpoints
router.use(RoleMiddleware.requireAdmin());

// Content analytics
router.get('/content', AnalyticsController.getContentAnalytics);

// System metrics
router.get('/metrics', AnalyticsController.getSystemMetrics);
router.post('/metrics', AnalyticsController.recordMetric);

// Analytics summary
router.get('/summary', AnalyticsController.getAnalyticsSummary);

// Top performing content
router.get('/top-content', AnalyticsController.getTopContent);

// User funnel analysis
router.get('/funnel', AnalyticsController.getFunnelAnalysis);

// User analytics summary
router.get('/users', AnalyticsController.getUserAnalytics);

// Security audit logs
router.get('/security-logs', AnalyticsController.getSecurityLogs);

// Data cleanup
router.post('/cleanup', AnalyticsController.cleanupOldData);

module.exports = router;
