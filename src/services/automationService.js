const axios = require('axios');
const pool = require('../config/database');

class AutomationService {
  constructor() {
    this.n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    this.timeout = 10000; // 10 seconds timeout
    this.retryAttempts = 3;
    this.lastTriggerTime = new Map(); // Simple rate limiting per user/action
    this.rateLimit = 60000; // 1 minute between same user/action triggers
  }

  async triggerN8nWebhook(payload) {
    if (!this.n8nWebhookUrl) {
      console.warn('⚠️ N8N webhook URL not configured. Automation disabled.');
      return false;
    }

    try {
      // Validate payload
      const validatedPayload = this.validatePayload(payload);

      // Simple Rate Limiting
      const rateLimitKey = `${validatedPayload.user_id}:${validatedPayload.action_type}`;
      const now = Date.now();
      if (this.lastTriggerTime.has(rateLimitKey)) {
        const timePassed = now - this.lastTriggerTime.get(rateLimitKey);
        if (timePassed < this.rateLimit) {
          console.log(`ℹ️ Rate limiting: Webhook for user ${validatedPayload.user_id} and action ${validatedPayload.action_type} throttled.`);
          return false;
        }
      }
      this.lastTriggerTime.set(rateLimitKey, now);

      // Check user consent
      const hasConsent = await this.checkUserConsent(validatedPayload.user_id, validatedPayload.action_type);
      if (!hasConsent) {
        console.log(`ℹ️ User ${validatedPayload.user_id} has not consented to ${validatedPayload.action_type}. Webhook not triggered.`);
        return false;
      }

      // Safeguard: Remove any sensitive data from payload before sending
      // We explicitly allow phone for WhatsApp n8n nodes, but filter other PII
      const safePayload = { ...validatedPayload };
      delete safePayload.email; // Ensure email is never leaked to n8n if present
      if (safePayload.metadata) {
        delete safePayload.metadata.email;
        delete safePayload.metadata.password; // Double safety
      }

      // Make webhook call with retry mechanism
      const response = await this.makeWebhookCall(safePayload);

      // Log successful webhook
      await this.logWebhook(safePayload, 'success', response.status, response.data);

      console.log(`✅ N8N webhook triggered successfully for user ${safePayload.user_id}, action: ${safePayload.action_type}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to trigger N8N webhook for user ${payload.user_id}, action: ${payload.action_type}:`, error.message);

      // Log failed webhook
      await this.logWebhook(payload, 'failed', null, null, error.message);

      return false;
    }
  }

  validatePayload(payload) {
    const required = ['user_id', 'action_type', 'timestamp'];
    const missing = required.filter(field => !payload[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    return {
      user_id: payload.user_id,
      phone: payload.phone || null,
      action_type: payload.action_type,
      consent: payload.consent || false,
      timestamp: payload.timestamp || new Date().toISOString(),
      metadata: payload.metadata || {},
      source: payload.source || 'website'
    };
  }

  async checkUserConsent(userId, actionType) {
    try {
      const query = `
        SELECT whatsapp_consent, marketing_consent, phone 
        FROM user_profiles up 
        JOIN users u ON up.user_id = u.id 
        WHERE up.user_id = $1
      `;
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        console.warn(`⚠️ No profile found for user ${userId}`);
        return false;
      }

      const profile = result.rows[0];

      // Consent rules based on action type
      switch (actionType) {
        case 'user_signup':
          // Welcome messages don't require explicit consent
          return true;

        case 'profile_completed':
        case 'diet_plan_viewed':
        case 'protection_plan_viewed':
        case 'reminder_opt_in':
          // Health-related actions require WhatsApp consent
          return profile.whatsapp_consent === true && profile.phone;

        case 'marketing_update':
        case 'newsletter_subscription':
          // Marketing actions require marketing consent
          return profile.marketing_consent === true && profile.phone;

        default:
          // Default to requiring WhatsApp consent
          return profile.whatsapp_consent === true && profile.phone;
      }
    } catch (error) {
      console.error('❌ Error checking user consent:', error);
      return false;
    }
  }

  async makeWebhookCall(payload, attempt = 1) {
    try {
      const response = await axios.post(this.n8nWebhookUrl, payload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CerviCare-Automation/1.0',
          'X-Webhook-Source': 'cervicare-backend',
          'X-Attempt': attempt.toString()
        }
      });

      return response;
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.warn(`⚠️ Webhook attempt ${attempt} failed, retrying...`);
        await this.delay(this.retryDelay * attempt);
        return this.makeWebhookCall(payload, attempt + 1);
      }
      throw error;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async logWebhook(payload, status, responseStatus, responseBody, errorMessage = null) {
    try {
      const query = `
        INSERT INTO webhook_logs (user_id, webhook_type, payload, response_status, response_body)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      await pool.query(query, [
        payload.user_id,
        payload.action_type,
        JSON.stringify(payload),
        responseStatus,
        responseBody ? JSON.stringify(responseBody) : null
      ]);
    } catch (error) {
      console.error('❌ Failed to log webhook:', error);
    }
  }

  // Specific automation triggers
  async triggerUserSignup(userId, email, phone = null) {
    return await this.triggerN8nWebhook({
      user_id: userId,
      phone: phone,
      action_type: 'user_signup',
      timestamp: new Date().toISOString(),
      metadata: {
        email: email,
        signup_source: 'website'
      }
    });
  }

  async triggerProfileCompleted(userId, phone, profileData) {
    return await this.triggerN8nWebhook({
      user_id: userId,
      phone: phone,
      action_type: 'profile_completed',
      timestamp: new Date().toISOString(),
      metadata: {
        diet_type: profileData.diet_type,
        budget_level: profileData.budget_level,
        lifestyle: profileData.lifestyle,
        completion_score: this.calculateCompletionScore(profileData)
      }
    });
  }

  async triggerDietPlanViewed(userId, phone, dietType, recommendationsCount) {
    return await this.triggerN8nWebhook({
      user_id: userId,
      phone: phone,
      action_type: 'diet_plan_viewed',
      timestamp: new Date().toISOString(),
      metadata: {
        diet_type: dietType,
        recommendations_count: recommendationsCount
      }
    });
  }

  async triggerProtectionPlanViewed(userId, phone, riskBand, sections) {
    return await this.triggerN8nWebhook({
      user_id: userId,
      phone: phone,
      action_type: 'protection_plan_viewed',
      timestamp: new Date().toISOString(),
      metadata: {
        risk_band: riskBand,
        sections_accessed: Object.keys(sections).filter(key => sections[key].length > 0)
      }
    });
  }

  async triggerReminderOptIn(userId, phone) {
    return await this.triggerN8nWebhook({
      user_id: userId,
      phone: phone,
      action_type: 'reminder_opt_in',
      timestamp: new Date().toISOString(),
      metadata: {
        opt_in_source: 'website'
      }
    });
  }

  async triggerSupportRequest(userId, phone, issueType) {
    return await this.triggerN8nWebhook({
      user_id: userId,
      phone: phone,
      action_type: 'support_request',
      timestamp: new Date().toISOString(),
      metadata: {
        issue_type: issueType,
        urgency: 'normal'
      }
    });
  }

  calculateCompletionScore(profileData) {
    const fields = ['age', 'gender', 'city', 'diet_type', 'budget_level', 'lifestyle'];
    const completedFields = fields.filter(field => profileData[field] && profileData[field] !== '');
    return Math.round((completedFields.length / fields.length) * 100);
  }

  // Health check and testing
  async testWebhook() {
    if (!this.n8nWebhookUrl) {
      return { success: false, message: 'N8N webhook URL not configured' };
    }

    try {
      const testPayload = {
        test: true,
        action_type: 'test_webhook',
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'cervicare-backend-test',
          environment: process.env.NODE_ENV || 'development'
        }
      };

      const response = await axios.post(this.n8nWebhookUrl, testPayload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CerviCare-Automation/1.0'
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

  async getWebhookStats() {
    try {
      const query = `
        SELECT 
          webhook_type,
          COUNT(*) as total_calls,
          COUNT(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 END) as successful_calls,
          COUNT(CASE WHEN response_status IS NULL OR response_status >= 400 THEN 1 END) as failed_calls,
          MAX(created_at) as last_call,
          AVG(response_status) as avg_response_status
        FROM webhook_logs 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY webhook_type
        ORDER BY total_calls DESC
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get webhook stats:', error);
      return [];
    }
  }

  async getConsentStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN whatsapp_consent = true THEN 1 END) as whatsapp_consent,
          COUNT(CASE WHEN marketing_consent = true THEN 1 END) as marketing_consent,
          COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as has_phone
        FROM user_profiles
      `;

      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to get consent stats:', error);
      return null;
    }
  }
}

module.exports = new AutomationService();
