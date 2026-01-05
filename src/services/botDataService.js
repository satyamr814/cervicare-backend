const googleSheetsService = require('./googleSheetsService');
const analyticsService = require('./analyticsService');

class BotDataService {
  constructor() {
    this.botWebhookUrl = process.env.BOT_WEBHOOK_URL || null;
  }

  // Track user bot interactions
  async trackBotInteraction(userId, email, phone, botMessage, botResponse, intent, actionTaken, whatsappSent, sessionId, messageType = 'text') {
    try {
      // Track in analytics
      await analyticsService.trackEvent(userId, 'bot_interaction', {
        intent: intent,
        action_taken: actionTaken,
        whatsapp_sent: whatsappSent,
        message_type: messageType,
        session_id: sessionId
      }, {
        sessionId: sessionId,
        ipAddress: null, // Bot interactions don't have IP
        userAgent: 'CerviBOT'
      });

      // Sync to Google Sheets
      await this.syncBotData(userId, email, phone, botMessage, botResponse, intent, actionTaken, whatsappSent, sessionId, messageType);

      console.log(`🤖 Bot interaction tracked for user ${userId}: ${intent}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to track bot interaction:', error);
      return false;
    }
  }

  // Sync bot data to Google Sheets
  async syncBotData(userId, email, phone, botMessage, botResponse, intent, actionTaken, whatsappSent, sessionId, messageType) {
    if (!googleSheetsService.isInitialized) return false;

    try {
      const sheet = await googleSheetsService.ensureSheet('Bot Data');
      if (!sheet) return false;

      await sheet.addRow({
        'Timestamp': new Date().toISOString(),
        'User ID': userId,
        'Email': email || 'N/A',
        'Phone': phone || 'N/A',
        'Bot Message': botMessage || 'N/A',
        'Bot Response': botResponse || 'N/A',
        'Intent': intent || 'N/A',
        'Action Taken': actionTaken || 'N/A',
        'WhatsApp Sent': whatsappSent || false,
        'Session ID': sessionId || 'N/A',
        'Message Type': messageType || 'text'
      });

      console.log(`📊 Bot data synced to Google Sheets for user ${userId}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to sync bot data:', error);
      return false;
    }
  }

  // Track user signup from bot
  async trackBotSignup(userId, email, phone, source = 'bot') {
    try {
      // Track analytics event
      await analyticsService.trackEvent(userId, 'user_signed_up', {
        signup_source: source,
        phone_provided: !!phone
      }, {
        sessionId: null,
        ipAddress: null,
        userAgent: 'CerviBOT'
      });

      // Sync to Google Sheets
      await this.syncUserLogin(userId, email, phone, source);

      console.log(`👤 Bot signup tracked for user ${userId}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to track bot signup:', error);
      return false;
    }
  }

  // Sync user login/signup data
  async syncUserLogin(userId, email, phone, source) {
    if (!googleSheetsService.isInitialized) return false;

    try {
      const sheet = await googleSheetsService.ensureSheet('User Logins');
      if (!sheet) return false;

      // Get user profile data
      const pool = require('../config/database');
      const profileQuery = `
        SELECT up.*, u.created_at as signup_date, u.role, u.plan_type
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1
      `;
      
      const profileResult = await pool.query(profileQuery, [userId]);
      const profile = profileResult.rows[0] || {};

      await sheet.addRow({
        'Timestamp': new Date().toISOString(),
        'User ID': userId,
        'Email': email || 'N/A',
        'Signup Date': profile.signup_date || new Date().toISOString(),
        'IP Address': 'Bot Interaction',
        'User Agent': 'CerviBOT',
        'Profile Completed': profile.age ? 'Yes' : 'No',
        'Avatar Type': profile.avatar_type || 'default',
        'City': profile.city || 'N/A',
        'Age': profile.age || 'N/A',
        'Gender': profile.gender || 'N/A',
        'Diet Type': profile.diet_type || 'N/A',
        'Budget Level': profile.budget_level || 'N/A',
        'Lifestyle': profile.lifestyle || 'N/A'
      });

      console.log(`📊 User login synced to Google Sheets for user ${userId}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to sync user login:', error);
      return false;
    }
  }

  // Track bot performance metrics
  async trackBotMetrics(metricName, value, unit = 'count', metadata = {}) {
    try {
      await analyticsService.recordSystemMetric(`bot_${metricName}`, value, unit, {
        source: 'cervibot',
        ...metadata
      });

      // Sync to Google Sheets if it's a significant metric
      if (['daily_interactions', 'successful_responses', 'failed_responses', 'whatsapp_sent'].includes(metricName)) {
        await this.syncBotMetrics(metricName, value, unit, metadata);
      }

      console.log(`📈 Bot metric tracked: ${metricName} = ${value} ${unit}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to track bot metrics:', error);
      return false;
    }
  }

  // Sync bot metrics to Google Sheets
  async syncBotMetrics(metricName, value, unit, metadata) {
    if (!googleSheetsService.isInitialized) return false;

    try {
      const sheet = await googleSheetsService.ensureSheet('System Metrics');
      if (!sheet) return false;

      await sheet.addRow({
        'Timestamp': new Date().toISOString(),
        'Metric Name': `bot_${metricName}`,
        'Value': value,
        'Unit': unit,
        'Metadata': JSON.stringify(metadata)
      });

      console.log(`📊 Bot metric synced to Google Sheets: ${metricName}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to sync bot metrics:', error);
      return false;
    }
  }

  // Get bot analytics summary
  async getBotAnalytics(timeframe = '24h') {
    try {
      const pool = require('../config/database');
      
      // Get bot interaction metrics
      const interactionQuery = `
        SELECT 
          COUNT(*) as total_interactions,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(CASE WHEN intent = 'diet_recommendation' THEN 1 END) as diet_requests,
          COUNT(CASE WHEN intent = 'protection_plan' THEN 1 END) as protection_requests,
          COUNT(CASE WHEN whatsapp_sent = true THEN 1 END) as whatsapp_messages,
          AVG(CASE WHEN action_taken != 'N/A' THEN 1 ELSE 0 END) * 100 as success_rate
        FROM google_sheets_sync_log 
        WHERE sync_type = 'bot_interaction'
          AND created_at >= NOW() - INTERVAL '${timeframe}'
      `;

      const interactionResult = await pool.query(interactionQuery);
      
      // Get user signups from bot
      const signupQuery = `
        SELECT COUNT(*) as bot_signups
        FROM google_sheets_sync_log 
        WHERE sync_type = 'user_signup'
          AND created_at >= NOW() - INTERVAL '${timeframe}'
          AND data::text LIKE '%bot%'
      `;

      const signupResult = await pool.query(signupQuery);

      return {
        interactions: interactionResult.rows[0] || {},
        signups: signupResult.rows[0] || {},
        timeframe: timeframe
      };

    } catch (error) {
      console.error('❌ Failed to get bot analytics:', error);
      return {
        interactions: {},
        signups: {},
        timeframe: timeframe,
        error: error.message
      };
    }
  }

  // Create webhook endpoint for bot data
  async handleBotWebhook(req, res) {
    try {
      const {
        userId,
        email,
        phone,
        botMessage,
        botResponse,
        intent,
        actionTaken,
        whatsappSent,
        sessionId,
        messageType,
        eventType
      } = req.body;

      // Validate required fields
      if (!userId || !eventType) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, eventType'
        });
      }

      let result = false;

      switch (eventType) {
        case 'interaction':
          result = await this.trackBotInteraction(
            userId, email, phone, botMessage, botResponse, 
            intent, actionTaken, whatsappSent, sessionId, messageType
          );
          break;

        case 'signup':
          result = await this.trackBotSignup(userId, email, phone, 'bot');
          break;

        case 'metrics':
          result = await this.trackBotMetrics(
            botMessage, // using botMessage field for metric name
            botResponse, // using botResponse field for value
            intent, // using intent field for unit
            JSON.parse(actionTaken || '{}') // using actionTaken for metadata
          );
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid event type'
          });
      }

      if (result) {
        res.json({
          success: true,
          message: 'Bot data tracked successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to track bot data'
        });
      }

    } catch (error) {
      console.error('❌ Bot webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get bot data from Google Sheets
  async getBotDataFromSheets(sheetName = 'Bot Data', limit = 100) {
    try {
      if (!googleSheetsService.isInitialized) {
        return { success: false, message: 'Google Sheets not initialized' };
      }

      const sheet = await googleSheetsService.ensureSheet(sheetName);
      if (!sheet) {
        return { success: false, message: 'Sheet not found' };
      }

      const rows = await sheet.getRows();
      const data = rows.slice(0, limit).map(row => ({
        timestamp: row.Timestamp,
        userId: row['User ID'],
        email: row.Email,
        phone: row.Phone,
        botMessage: row['Bot Message'],
        botResponse: row['Bot Response'],
        intent: row.Intent,
        actionTaken: row['Action Taken'],
        whatsappSent: row['WhatsApp Sent'],
        sessionId: row['Session ID'],
        messageType: row['Message Type']
      }));

      return {
        success: true,
        data: data,
        totalRows: rows.length,
        limit: limit
      };

    } catch (error) {
      console.error('❌ Failed to get bot data from sheets:', error);
      return {
        success: false,
        message: 'Failed to retrieve bot data',
        error: error.message
      };
    }
  }

  // Export bot data for analysis
  async exportBotData(timeframe = '7d', format = 'json') {
    try {
      const analytics = await this.getBotAnalytics(timeframe);
      const sheetsData = await this.getBotDataFromSheets('Bot Data', 1000);

      const exportData = {
        summary: analytics,
        interactions: sheetsData.success ? sheetsData.data : [],
        exportTime: new Date().toISOString(),
        timeframe: timeframe,
        format: format
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csv = this.convertToCSV(exportData.interactions);
        return {
          success: true,
          data: csv,
          filename: `bot_data_${timeframe}_${Date.now()}.csv`
        };
      }

      return {
        success: true,
        data: exportData,
        filename: `bot_data_${timeframe}_${Date.now()}.json`
      };

    } catch (error) {
      console.error('❌ Failed to export bot data:', error);
      return {
        success: false,
        message: 'Failed to export bot data',
        error: error.message
      };
    }
  }

  // Convert data to CSV format
  convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}

module.exports = new BotDataService();
