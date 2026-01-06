const axios = require('axios');
const pool = require('../config/database');

class WebhookService {
  constructor() {
    this.n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    this.timeout = 10000; // 10 seconds timeout
  }

  async triggerN8nWebhook(userId, actionType, additionalData = {}) {
    if (!this.n8nWebhookUrl) {
      console.warn('⚠️ N8N webhook URL not configured. Webhook disabled.');
      return false;
    }

    try {
      // Get user profile data for consent check
      const profileQuery = `
        SELECT up.*, u.email 
        FROM user_profiles up 
        JOIN users u ON up.user_id = u.id 
        WHERE up.user_id = $1
      `;
      const profileResult = await pool.query(profileQuery, [userId]);

      if (profileResult.rows.length === 0) {
        console.warn(`⚠️ No profile found for user ${userId}. Webhook not triggered.`);
        return false;
      }

      const profile = profileResult.rows[0];

      // Check consent based on action type
      if (!this.hasConsent(actionType, profile)) {
        console.log(`ℹ️ User ${userId} has not consented to ${actionType}. Webhook not triggered.`);
        return false;
      }

      // Prepare webhook payload
      const payload = {
        user_id: userId,
        phone: profile.phone || 'N/A',
        action_type: actionType,
        consent_flags: {
          whatsapp: profile.whatsapp_consent || false,
          marketing: profile.marketing_consent || false
        },
        timestamp: new Date().toISOString(),
        ...additionalData
      };

      // Make webhook call
      const response = await axios.post(this.n8nWebhookUrl, payload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CerviCare-Webhook/1.0'
        }
      });

      // Log successful webhook
      await this.logWebhook(userId, actionType, payload, response.status, response.data);

      console.log(`✅ N8N webhook triggered successfully for user ${userId}, action: ${actionType}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to trigger N8N webhook for user ${userId}, action: ${actionType}:`, error.message);

      // Log failed webhook
      await this.logWebhook(userId, actionType, {}, null, null, error.message);

      return false;
    }
  }

  hasConsent(actionType, profile) {
    switch (actionType) {
      case 'profile_completed':
      case 'protection_plan_accessed':
        return profile.whatsapp_consent === true;

      case 'marketing_update':
      case 'newsletter_subscription':
        return profile.marketing_consent === true;

      case 'user_signup':
        // Signup events don't require consent (welcome messages)
        return true;

      default:
        // Default to requiring WhatsApp consent
        return profile.whatsapp_consent === true;
    }
  }

  async logWebhook(userId, webhookType, payload, responseStatus, responseBody, errorMessage = null) {
    try {
      const query = `
        INSERT INTO webhook_logs (user_id, webhook_type, payload, response_status, response_body)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      await pool.query(query, [
        userId,
        webhookType,
        JSON.stringify(payload),
        responseStatus,
        responseBody ? JSON.stringify(responseBody) : null
      ]);
    } catch (error) {
      console.error('❌ Failed to log webhook:', error);
    }
  }

  async getWebhookLogs(userId = null, limit = 50) {
    try {
      let query = `
        SELECT * FROM webhook_logs 
        ${userId ? 'WHERE user_id = $1' : ''} 
        ORDER BY created_at DESC 
        LIMIT ${userId ? '$2' : '$1'}
      `;

      const params = userId ? [userId, limit] : [limit];
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get webhook logs:', error);
      return [];
    }
  }

  async triggerProfileCompleted(userId) {
    return await this.triggerN8nWebhook(userId, 'profile_completed', {
      event: 'user_profile_completed',
      category: 'user_engagement'
    });
  }

  async triggerProtectionPlanAccessed(userId, riskBand) {
    return await this.triggerN8nWebhook(userId, 'protection_plan_accessed', {
      event: 'protection_plan_viewed',
      category: 'health_engagement',
      risk_band: riskBand
    });
  }

  async triggerDietPlanGenerated(userId, dietType, recommendationsCount) {
    return await this.triggerN8nWebhook(userId, 'diet_plan_generated', {
      event: 'diet_plan_viewed',
      category: 'health_engagement',
      diet_type: dietType,
      recommendations_count: recommendationsCount
    });
  }

  async triggerUserSignup(userId, email) {
    return await this.triggerN8nWebhook(userId, 'user_signup', {
      event: 'new_user_registered',
      category: 'user_acquisition',
      signup_timestamp: new Date().toISOString()
    });
  }

  // Test webhook endpoint
  async testWebhook() {
    if (!this.n8nWebhookUrl) {
      return { success: false, message: 'N8N webhook URL not configured' };
    }

    try {
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Test webhook from CerviCare backend'
      };

      const response = await axios.post(this.n8nWebhookUrl, testPayload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CerviCare-Webhook/1.0'
        }
      });

      return {
        success: true,
        message: 'Test webhook successful',
        status: response.status,
        response: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Test webhook failed',
        error: error.message
      };
    }
  }
}

module.exports = new WebhookService();
