const webhookService = require('../services/webhookService');
const googleSheetsService = require('../services/googleSheetsService');

class WebhookController {
  static async triggerN8nWebhook(req, res) {
    try {
      const { user_id, action_type, additional_data = {} } = req.body;

      if (!user_id || !action_type) {
        return res.status(400).json({
          success: false,
          message: 'user_id and action_type are required'
        });
      }

      const success = await webhookService.triggerN8nWebhook(user_id, action_type, additional_data);

      if (success) {
        res.json({
          success: true,
          message: 'Webhook triggered successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to trigger webhook'
        });
      }
    } catch (error) {
      console.error('Trigger webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while triggering webhook'
      });
    }
  }

  static async testWebhook(req, res) {
    try {
      const result = await webhookService.testWebhook();
      
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
        message: 'Internal server error while testing webhook'
      });
    }
  }

  static async getWebhookLogs(req, res) {
    try {
      const { user_id, limit = 50 } = req.query;

      const logs = await webhookService.getWebhookLogs(user_id, parseInt(limit));

      res.json({
        success: true,
        data: logs,
        total: logs.length
      });
    } catch (error) {
      console.error('Get webhook logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching webhook logs'
      });
    }
  }

  static async getGoogleSheetsLogs(req, res) {
    try {
      const { user_id, limit = 50 } = req.query;

      const logs = await googleSheetsService.getSyncLogs(user_id, parseInt(limit));

      res.json({
        success: true,
        data: logs,
        total: logs.length
      });
    } catch (error) {
      console.error('Get Google Sheets logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching Google Sheets logs'
      });
    }
  }

  static async triggerGoogleSheetsSync(req, res) {
    try {
      const { sync_type, user_id, data } = req.body;

      if (!sync_type || !user_id) {
        return res.status(400).json({
          success: false,
          message: 'sync_type and user_id are required'
        });
      }

      let success = false;

      switch (sync_type) {
        case 'user_signup':
          success = await googleSheetsService.syncUserSignup(user_id, data.email);
          break;
        case 'profile_update':
          success = await googleSheetsService.syncProfileUpdate(user_id, data);
          break;
        case 'diet_plan':
          success = await googleSheetsService.syncDietPlan(user_id, data.email, data.profile, data.recommendations);
          break;
        case 'protection_plan':
          success = await googleSheetsService.syncProtectionPlan(user_id, data.email, data.profile, data.protectionPlan);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid sync_type. Must be one of: user_signup, profile_update, diet_plan, protection_plan'
          });
      }

      if (success) {
        res.json({
          success: true,
          message: 'Google Sheets sync triggered successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to trigger Google Sheets sync'
        });
      }
    } catch (error) {
      console.error('Trigger Google Sheets sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while triggering Google Sheets sync'
      });
    }
  }

  static async getSystemStatus(req, res) {
    try {
      const webhookTest = await webhookService.testWebhook();
      const sheetsInitialized = googleSheetsService.isInitialized;

      res.json({
        success: true,
        data: {
          webhook: {
            configured: !!process.env.N8N_WEBHOOK_URL,
            test_result: webhookTest
          },
          google_sheets: {
            configured: !!process.env.GOOGLE_SHEETS_CREDENTIALS && !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            initialized: sheetsInitialized
          },
          environment: {
            node_env: process.env.NODE_ENV,
            has_admin_key: !!process.env.ADMIN_KEY,
            has_admin_emails: !!process.env.ADMIN_EMAILS
          }
        }
      });
    } catch (error) {
      console.error('Get system status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching system status'
      });
    }
  }
}

module.exports = WebhookController;
