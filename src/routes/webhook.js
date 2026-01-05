const express = require('express');
const WebhookController = require('../controllers/webhookController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// Public webhook endpoint (for n8n to call us)
router.post('/n8n', WebhookController.triggerN8nWebhook);

// Protected webhook management endpoints
router.use(authMiddleware);

// Test webhook (protected)
router.post('/test', WebhookController.testWebhook);

// Get logs (protected)
router.get('/logs', WebhookController.getWebhookLogs);
router.get('/google-sheets-logs', WebhookController.getGoogleSheetsLogs);

// Manual sync trigger (protected)
router.post('/google-sheets-sync', WebhookController.triggerGoogleSheetsSync);

// System status (protected)
router.get('/status', WebhookController.getSystemStatus);

module.exports = router;
