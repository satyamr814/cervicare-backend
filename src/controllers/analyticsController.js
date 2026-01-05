const analyticsService = require('../services/analyticsService');
const RoleMiddleware = require('../middlewares/roles');
const SecurityMiddleware = require('../middlewares/security');

class AnalyticsController {
  // Track user events
  static async trackEvent(req, res) {
    try {
      const { eventType, eventData } = req.body;
      const userId = req.user?.userId;

      if (!eventType) {
        return res.status(400).json({
          success: false,
          message: 'Event type is required'
        });
      }

      const eventId = await analyticsService.trackEvent(
        userId,
        eventType,
        eventData,
        {
          sessionId: req.sessionId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      if (eventId) {
        res.json({
          success: true,
          message: 'Event tracked successfully',
          data: {
            eventId: eventId
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to track event'
        });
      }
    } catch (error) {
      console.error('Track event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user engagement metrics
  static async getUserEngagement(req, res) {
    try {
      const userId = req.user?.userId;
      const { days = 30 } = req.query;

      const metrics = await analyticsService.getUserEngagementMetrics(userId, parseInt(days));

      res.json({
        success: true,
        data: {
          metrics: metrics,
          totalDays: parseInt(days)
        }
      });
    } catch (error) {
      console.error('Get user engagement error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get content analytics (admin only)
  static async getContentAnalytics(req, res) {
    try {
      const { contentType } = req.query;

      const analytics = await analyticsService.getContentAnalytics(contentType);

      res.json({
        success: true,
        data: {
          analytics: analytics,
          contentType: contentType || 'all'
        }
      });
    } catch (error) {
      console.error('Get content analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get system metrics (admin only)
  static async getSystemMetrics(req, res) {
    try {
      const { metricName, hours = 24 } = req.query;

      const metrics = await analyticsService.getSystemMetrics(metricName, parseInt(hours));

      res.json({
        success: true,
        data: {
          metrics: metrics,
          metricName: metricName || 'all',
          hours: parseInt(hours)
        }
      });
    } catch (error) {
      console.error('Get system metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get analytics summary (admin only)
  static async getAnalyticsSummary(req, res) {
    try {
      const { days = 30 } = req.query;

      const summary = await analyticsService.getAnalyticsSummary(parseInt(days));

      if (summary) {
        res.json({
          success: true,
          data: {
            summary: summary,
            days: parseInt(days)
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to get analytics summary'
        });
      }
    } catch (error) {
      console.error('Get analytics summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get top performing content (admin only)
  static async getTopContent(req, res) {
    try {
      const { limit = 10, contentType } = req.query;

      const topContent = await analyticsService.getTopContent(parseInt(limit), contentType);

      res.json({
        success: true,
        data: {
          topContent: topContent,
          limit: parseInt(limit),
          contentType: contentType || 'all'
        }
      });
    } catch (error) {
      console.error('Get top content error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user funnel analysis (admin only)
  static async getFunnelAnalysis(req, res) {
    try {
      const { days = 30 } = req.query;

      const funnel = await analyticsService.getUserFunnelAnalysis(parseInt(days));

      if (funnel) {
        res.json({
          success: true,
          data: {
            funnel: funnel,
            days: parseInt(days)
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to get funnel analysis'
        });
      }
    } catch (error) {
      console.error('Get funnel analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user analytics summary (admin only)
  static async getUserAnalytics(req, res) {
    try {
      const { page = 1, limit = 50, status } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = `
        SELECT 
          user_id,
          email,
          role,
          plan_type,
          signup_date,
          last_login_at,
          age,
          gender,
          city,
          diet_type,
          lifestyle,
          total_events,
          last_activity,
          engagement_score,
          activity_status
        FROM user_analytics_summary
      `;

      const params = [];
      const conditions = [];

      if (status) {
        conditions.push(`activity_status = $${params.length + 1}`);
        params.push(status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY last_activity DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(parseInt(limit), offset);

      const result = await pool.query(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM user_analytics_summary';
      if (conditions.length > 0) {
        countQuery += ' WHERE ' + conditions.join(' AND ');
      }

      const countResult = await pool.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        data: {
          users: result.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: total,
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Get user analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Record custom system metric
  static async recordMetric(req, res) {
    try {
      const { metricName, value, unit, tags } = req.body;

      if (!metricName || value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Metric name and value are required'
        });
      }

      const metricId = await analyticsService.recordSystemMetric(
        metricName,
        value,
        unit,
        tags || {}
      );

      if (metricId) {
        res.json({
          success: true,
          message: 'Metric recorded successfully',
          data: {
            metricId: metricId
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to record metric'
        });
      }
    } catch (error) {
      console.error('Record metric error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Cleanup old analytics data (admin only)
  static async cleanupOldData(req, res) {
    try {
      const { days = 90 } = req.query;

      const deletedCount = await analyticsService.cleanupOldData(parseInt(days));

      res.json({
        success: true,
        message: 'Old data cleaned up successfully',
        data: {
          deletedCount: deletedCount,
          days: parseInt(days)
        }
      });
    } catch (error) {
      console.error('Cleanup old data error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get security audit logs (admin only)
  static async getSecurityLogs(req, res) {
    try {
      const { page = 1, limit = 50, action, success } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = `
        SELECT 
          sal.id,
          sal.user_id,
          u.email,
          sal.action,
          sal.resource_type,
          sal.resource_id,
          sal.success,
          sal.error_message,
          sal.timestamp,
          sal.metadata
        FROM security_audit_logs sal
        LEFT JOIN users u ON sal.user_id = u.id
      `;

      const params = [];
      const conditions = [];

      if (action) {
        conditions.push(`sal.action = $${params.length + 1}`);
        params.push(action);
      }

      if (success !== undefined) {
        conditions.push(`sal.success = $${params.length + 1}`);
        params.push(success === 'true');
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY sal.timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(parseInt(limit), offset);

      const result = await pool.query(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM security_audit_logs sal';
      if (conditions.length > 0) {
        countQuery += ' WHERE ' + conditions.join(' AND ');
      }

      const countResult = await pool.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        data: {
          logs: result.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: total,
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Get security logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = AnalyticsController;
