const express = require('express');
const botDataService = require('../services/botDataService');
const authMiddleware = require('../middlewares/auth');
const RoleMiddleware = require('../middlewares/roles');

const router = express.Router();

// Bot webhook endpoint - no authentication required for bot to send data
router.post('/webhook', (req, res) => botDataService.handleBotWebhook(req, res));

// Get bot analytics - admin only
router.get('/analytics', RoleMiddleware.requireAdmin(), async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const analytics = await botDataService.getBotAnalytics(timeframe);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Bot analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bot analytics',
      error: error.message
    });
  }
});

// Get bot data from sheets - admin only
router.get('/sheets-data', RoleMiddleware.requireAdmin(), async (req, res) => {
  try {
    const { sheet = 'Bot Data', limit = 100 } = req.query;
    const data = await botDataService.getBotDataFromSheets(sheet, parseInt(limit));
    
    res.json(data);
  } catch (error) {
    console.error('Bot sheets data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bot data from sheets',
      error: error.message
    });
  }
});

// Export bot data - admin only
router.get('/export', RoleMiddleware.requireAdmin(), async (req, res) => {
  try {
    const { timeframe = '7d', format = 'json' } = req.query;
    const exportData = await botDataService.exportBotData(timeframe, format);
    
    if (exportData.success) {
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
        res.send(exportData.data);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
        res.json(exportData.data);
      }
    } else {
      res.status(500).json(exportData);
    }
  } catch (error) {
    console.error('Bot export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export bot data',
      error: error.message
    });
  }
});

// Manual bot interaction tracking - for testing
router.post('/track-interaction', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const {
      botMessage,
      botResponse,
      intent,
      actionTaken,
      whatsappSent,
      sessionId,
      messageType = 'text'
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const result = await botDataService.trackBotInteraction(
      userId,
      req.user.email,
      null, // phone
      botMessage,
      botResponse,
      intent,
      actionTaken,
      whatsappSent,
      sessionId,
      messageType
    );

    if (result) {
      res.json({
        success: true,
        message: 'Bot interaction tracked successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to track bot interaction'
      });
    }

  } catch (error) {
    console.error('Track bot interaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track bot interaction',
      error: error.message
    });
  }
});

// Get bot metrics - admin only
router.get('/metrics', RoleMiddleware.requireAdmin(), async (req, res) => {
  try {
    const pool = require('../config/database');
    
    // Get system metrics for bot
    const metricsQuery = `
      SELECT 
        metric_name,
        value,
        unit,
        metadata,
        created_at
      FROM system_metrics
      WHERE metric_name LIKE 'bot_%'
        AND created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(metricsQuery);
    
    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Bot metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bot metrics',
      error: error.message
    });
  }
});

module.exports = router;
