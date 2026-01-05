const express = require('express');
const AutomationService = require('../services/automationService');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// Public webhook endpoint for n8n to receive data from backend
router.post('/n8n', async (req, res) => {
  try {
    const success = await AutomationService.triggerN8nWebhook(req.body);
    
    if (success) {
      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  } catch (error) {
    console.error('Automation webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during webhook processing'
    });
  }
});

// Protected endpoints for testing and monitoring
router.use(authMiddleware);

// Test webhook connectivity
router.post('/test', async (req, res) => {
  try {
    const result = await AutomationService.testWebhook();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test webhook successful',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Test webhook failed',
        error: result.message
      });
    }
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during webhook test'
    });
  }
});

// Get webhook statistics
router.get('/stats', async (req, res) => {
  try {
    const [webhookStats, consentStats] = await Promise.all([
      AutomationService.getWebhookStats(),
      AutomationService.getConsentStats()
    ]);

    res.json({
      success: true,
      data: {
        webhook_stats: webhookStats,
        consent_stats: consentStats,
        total_users: consentStats?.total_users || 0
      }
    });
  } catch (error) {
    console.error('Get automation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching automation stats'
    });
  }
});

module.exports = router;
