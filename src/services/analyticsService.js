const pool = require('../config/database');

class AnalyticsService {
  constructor() {
    this.eventTypes = [
      'user_signed_up',
      'profile_completed',
      'diet_plan_viewed',
      'protection_plan_viewed',
      'whatsapp_opt_in',
      'reminder_triggered',
      'admin_content_created',
      'admin_content_updated',
      'premium_feature_used',
      'support_request'
    ];
  }

  async trackEvent(userId, eventType, eventData = {}, metadata = {}) {
    try {
      // Validate event type
      if (!this.eventTypes.includes(eventType)) {
        console.warn(`⚠️ Unknown event type: ${eventType}`);
        return false;
      }

      // Sanitize event data - remove sensitive information
      const sanitizedData = this.sanitizeEventData(eventData);

      const query = `
        INSERT INTO product_events (user_id, event_type, event_data, session_id, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;

      const result = await pool.query(query, [
        userId || null,
        eventType,
        JSON.stringify(sanitizedData),
        metadata.sessionId || null,
        metadata.ipAddress || null,
        metadata.userAgent || null
      ]);

      const eventId = result.rows[0].id;

      // Update content analytics if applicable
      if (eventType === 'diet_plan_viewed' || eventType === 'protection_plan_viewed') {
        await this.updateContentAnalytics(eventData.contentId, eventType);
      }

      // Track premium feature usage
      if (eventType === 'premium_feature_used') {
        await this.trackPremiumFeatureUsage(userId, eventData.featureName);
      }

      // Log to Google Sheets for admin visibility (non-blocking)
      this.syncEventToSheets(eventId, eventType, sanitizedData, userId).catch(error => {
        console.error('❌ Failed to sync event to Sheets:', error);
      });

      console.log(`📊 Event tracked: ${eventType} for user ${userId}`);
      return eventId;

    } catch (error) {
      console.error('❌ Failed to track event:', error);
      return false;
    }
  }

  sanitizeEventData(eventData) {
    const sensitiveFields = ['password', 'email', 'phone', 'address', 'ssn', 'credit_card'];
    const sanitized = { ...eventData };

    // Remove or mask sensitive fields
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        if (field === 'email') {
          sanitized[field] = sanitized[field].substring(0, 3) + '***@***.com';
        } else if (field === 'phone') {
          sanitized[field] = sanitized[field].substring(0, 3) + '****';
        } else {
          delete sanitized[field];
        }
      }
    });

    // Remove any medical diagnosis data
    if (sanitized.medical_diagnosis || sanitized.diagnosis) {
      delete sanitized.medical_diagnosis;
      delete sanitized.diagnosis;
    }

    return sanitized;
  }

  async updateContentAnalytics(contentId, contentType) {
    try {
      const query = `
        INSERT INTO content_analytics (content_id, content_type, views_count, unique_users, last_viewed)
        VALUES ($1, $2, 1, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (content_id, content_type)
        DO UPDATE SET
          views_count = content_analytics.views_count + 1,
          unique_users = content_analytics.unique_users + 
            CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM product_events pe 
                WHERE pe.event_data->>'contentId' = $1 
                AND pe.event_type = $2 
                AND pe.user_id IN (
                  SELECT DISTINCT user_id FROM product_events pe2 
                  WHERE pe2.event_data->>'contentId' = $1 
                  AND pe2.event_type = $2
                )
              ) THEN 1 ELSE 0 END,
          last_viewed = CURRENT_TIMESTAMP,
          performance_score = (
            (content_analytics.views_count + 1) * 0.3 + 
            (content_analytics.unique_users + 1) * 0.7
          )
        RETURNING id
      `;

      await pool.query(query, [contentId, contentType]);
    } catch (error) {
      console.error('❌ Failed to update content analytics:', error);
    }
  }

  async trackPremiumFeatureUsage(userId, featureName) {
    try {
      const query = `
        INSERT INTO premium_feature_usage (user_id, feature_name, usage_count, last_used)
        VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, feature_name)
        DO UPDATE SET
          usage_count = premium_feature_usage.usage_count + 1,
          last_used = CURRENT_TIMESTAMP
        RETURNING id
      `;

      await pool.query(query, [userId, featureName]);
    } catch (error) {
      console.error('❌ Failed to track premium feature usage:', error);
    }
  }

  async syncEventToSheets(eventId, eventType, eventData, userId) {
    try {
      const sheetsSyncService = require('./sheetsSyncService');
      
      const sheetData = {
        event_id: eventId,
        user_id: userId,
        event_type: eventType,
        timestamp: new Date().toISOString(),
        metadata: JSON.stringify(eventData)
      };

      await sheetsSyncService.syncUserAction(sheetData);
    } catch (error) {
      console.error('❌ Failed to sync event to Sheets:', error);
    }
  }

  async getUserEngagementMetrics(userId, days = 30) {
    try {
      const query = `
        SELECT 
          date,
          events_count,
          unique_sessions,
          time_spent_minutes,
          engagement_score,
          last_activity
        FROM user_engagement_metrics
        WHERE user_id = $1 
          AND date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY date DESC
      `;

      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get user engagement metrics:', error);
      return [];
    }
  }

  async getContentAnalytics(contentType = null) {
    try {
      let query = `
        SELECT 
          content_id,
          content_type,
          views_count,
          unique_users,
          conversion_rate,
          performance_score,
          last_viewed
        FROM content_analytics
      `;

      const params = [];
      if (contentType) {
        query += ' WHERE content_type = $1';
        params.push(contentType);
      }

      query += ' ORDER BY performance_score DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get content analytics:', error);
      return [];
    }
  }

  async getSystemMetrics(metricName = null, hours = 24) {
    try {
      let query = `
        SELECT 
          metric_name,
          metric_value,
          metric_unit,
          timestamp,
          tags
        FROM system_metrics
        WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '${hours} hours'
      `;

      const params = [];
      if (metricName) {
        query += ' AND metric_name = $1';
        params.push(metricName);
      }

      query += ' ORDER BY timestamp DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get system metrics:', error);
      return [];
    }
  }

  async recordSystemMetric(metricName, value, unit = null, tags = {}) {
    try {
      const query = `
        INSERT INTO system_metrics (metric_name, metric_value, metric_unit, tags)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;

      const result = await pool.query(query, [
        metricName,
        parseFloat(value),
        unit,
        JSON.stringify(tags)
      ]);

      return result.rows[0].id;
    } catch (error) {
      console.error('❌ Failed to record system metric:', error);
      return false;
    }
  }

  async getAnalyticsSummary(days = 30) {
    try {
      const queries = [
        // User growth
        `SELECT COUNT(*) as new_users FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'`,
        
        // Active users
        `SELECT COUNT(DISTINCT user_id) as active_users FROM product_events WHERE timestamp >= CURRENT_DATE - INTERVAL '${days} days'`,
        
        // Total events
        `SELECT COUNT(*) as total_events FROM product_events WHERE timestamp >= CURRENT_DATE - INTERVAL '${days} days'`,
        
        // Profile completion rate
        `SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN up.user_id IS NOT NULL THEN 1 END) as completed_profiles
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.created_at >= CURRENT_DATE - INTERVAL '${days} days'`,
        
        // Premium usage
        `SELECT COUNT(*) as premium_users FROM users WHERE plan_type = 'premium' AND created_at >= CURRENT_DATE - INTERVAL '${days} days'`,
        
        // WhatsApp opt-in rate
        `SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN whatsapp_consent = true THEN 1 END) as whatsapp_opt_ins
        FROM user_profiles
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'`
      ];

      const results = await Promise.all(queries.map(query => pool.query(query)));

      return {
        new_users: parseInt(results[0].rows[0].new_users),
        active_users: parseInt(results[1].rows[0].active_users),
        total_events: parseInt(results[2].rows[0].total_events),
        profile_completion_rate: results[3].rows[0].total_users > 0 
          ? (parseInt(results[3].rows[0].completed_profiles) / parseInt(results[3].rows[0].total_users)) * 100 
          : 0,
        premium_users: parseInt(results[4].rows[0].premium_users),
        whatsapp_opt_in_rate: results[5].rows[0].total_users > 0
          ? (parseInt(results[5].rows[0].whatsapp_opt_ins) / parseInt(results[5].rows[0].total_users)) * 100
          : 0
      };

    } catch (error) {
      console.error('❌ Failed to get analytics summary:', error);
      return null;
    }
  }

  async getTopContent(limit = 10, contentType = null) {
    try {
      let query = `
        SELECT 
          ca.content_id,
          ca.content_type,
          ca.views_count,
          ca.unique_users,
          ca.performance_score,
          CASE 
            WHEN ca.content_type = 'diet' THEN dc.food_name
            WHEN ca.content_type = 'protection' THEN ppc.reason
            ELSE 'Unknown Content'
          END as content_title
        FROM content_analytics ca
        LEFT JOIN diet_content dc ON ca.content_id = dc.id AND ca.content_type = 'diet'
        LEFT JOIN protection_plan_content ppc ON ca.content_id = ppc.id AND ca.content_type = 'protection'
      `;

      const params = [];
      if (contentType) {
        query += ' WHERE ca.content_type = $1';
        params.push(contentType);
      }

      query += ' ORDER BY ca.performance_score DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get top content:', error);
      return [];
    }
  }

  async getUserFunnelAnalysis(days = 30) {
    try {
      const query = `
        WITH funnel_stages AS (
          SELECT 
            COUNT(DISTINCT CASE WHEN event_type = 'user_signed_up' THEN user_id END) as signed_up,
            COUNT(DISTINCT CASE WHEN event_type = 'profile_completed' THEN user_id END) as profile_completed,
            COUNT(DISTINCT CASE WHEN event_type = 'diet_plan_viewed' THEN user_id END) as diet_viewed,
            COUNT(DISTINCT CASE WHEN event_type = 'protection_plan_viewed' THEN user_id END) as protection_viewed,
            COUNT(DISTINCT CASE WHEN event_type = 'whatsapp_opt_in' THEN user_id END) as whatsapp_opt_in
          FROM product_events
          WHERE timestamp >= CURRENT_DATE - INTERVAL '${days} days'
        )
        SELECT 
          signed_up,
          profile_completed,
          diet_viewed,
          protection_viewed,
          whatsapp_opt_in,
          CASE 
            WHEN signed_up > 0 THEN ROUND((profile_completed::decimal / signed_up) * 100, 2)
            ELSE 0
          END as profile_completion_rate,
          CASE 
            WHEN profile_completed > 0 THEN ROUND((diet_viewed::decimal / profile_completed) * 100, 2)
            ELSE 0
          END as diet_view_rate,
          CASE 
            WHEN profile_completed > 0 THEN ROUND((protection_viewed::decimal / profile_completed) * 100, 2)
            ELSE 0
          END as protection_view_rate,
          CASE 
            WHEN protection_viewed > 0 THEN ROUND((whatsapp_opt_in::decimal / protection_viewed) * 100, 2)
            ELSE 0
          END as whatsapp_opt_in_rate
        FROM funnel_stages
      `;

      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to get funnel analysis:', error);
      return null;
    }
  }

  async cleanupOldData(days = 90) {
    try {
      const query = `
        SELECT cleanup_old_analytics_data() as deleted_count
      `;
      
      const result = await pool.query(query);
      console.log(`🧹 Cleaned up ${result.rows[0].deleted_count} old analytics records`);
      return result.rows[0].deleted_count;
    } catch (error) {
      console.error('❌ Failed to cleanup old data:', error);
      return 0;
    }
  }
}

module.exports = new AnalyticsService();
