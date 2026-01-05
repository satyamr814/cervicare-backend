const avatarService = require('../services/avatarService');
const analyticsService = require('../services/analyticsService');
const SecurityMiddleware = require('../middlewares/security');

class AvatarController {
  // Generate AI avatar
  static async generateAIAvatar(req, res) {
    try {
      const userId = req.user?.userId;
      const { style, seed, backgroundColor, ...preferences } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await avatarService.generateAIAvatar(userId, {
        style,
        seed,
        backgroundColor,
        ...preferences
      });

      // Track analytics event
      analyticsService.trackEvent(userId, 'avatar_ai_generated', {
        style: style || 'avataaars',
        backgroundColor: backgroundColor || 'random'
      }, {
        sessionId: req.sessionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'AI avatar generated successfully',
        data: {
          avatarUrl: result.avatarUrl,
          requestId: result.requestId,
          processingTime: result.processingTime
        }
      });

    } catch (error) {
      console.error('Generate AI avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate AI avatar',
        error: error.message
      });
    }
  }

  // Get random avatar
  static async getRandomAvatar(req, res) {
    try {
      const userId = req.user?.userId;
      const { templateType = 'random_set' } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await avatarService.getRandomAvatar(userId, templateType);

      // Track analytics event
      analyticsService.trackEvent(userId, 'avatar_random_selected', {
        templateType: templateType
      }, {
        sessionId: req.sessionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Random avatar selected successfully',
        data: {
          avatarUrl: result.avatarUrl,
          template: result.template
        }
      });

    } catch (error) {
      console.error('Get random avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get random avatar',
        error: error.message
      });
    }
  }

  // Upload custom image
  static async uploadCustomImage(req, res) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const fileData = {
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer
      };

      const result = await avatarService.uploadCustomImage(userId, fileData);

      // Track analytics event
      analyticsService.trackEvent(userId, 'avatar_custom_uploaded', {
        fileSize: fileData.size,
        mimeType: fileData.mimeType
      }, {
        sessionId: req.sessionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Custom image uploaded successfully',
        data: {
          imageUrl: result.imageUrl,
          thumbnailUrl: result.thumbnailUrl,
          uploadId: result.uploadId
        }
      });

    } catch (error) {
      console.error('Upload custom image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload custom image',
        error: error.message
      });
    }
  }

  // Get available avatar templates
  static async getAvatarTemplates(req, res) {
    try {
      const { templateType } = req.query;

      const templates = await avatarService.getAvatarTemplates(templateType);

      res.json({
        success: true,
        data: {
          templates: templates,
          templateType: templateType || 'all'
        }
      });

    } catch (error) {
      console.error('Get avatar templates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get avatar templates',
        error: error.message
      });
    }
  }

  // Get user's avatar history
  static async getUserAvatarHistory(req, res) {
    try {
      const userId = req.user?.userId;
      const { limit = 10 } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const history = await avatarService.getUserAvatarHistory(userId, parseInt(limit));

      res.json({
        success: true,
        data: {
          history: history,
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get user avatar history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get avatar history',
        error: error.message
      });
    }
  }

  // Get user's current avatar
  static async getUserAvatar(req, res) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const avatar = await avatarService.getUserAvatar(userId);

      res.json({
        success: true,
        data: {
          avatar: avatar
        }
      });

    } catch (error) {
      console.error('Get user avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user avatar',
        error: error.message
      });
    }
  }

  // Delete current avatar
  static async deleteCurrentAvatar(req, res) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      await avatarService.deleteCurrentAvatar(userId);

      // Track analytics event
      analyticsService.trackEvent(userId, 'avatar_deleted', {}, {
        sessionId: req.sessionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Avatar deleted successfully'
      });

    } catch (error) {
      console.error('Delete current avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete avatar',
        error: error.message
      });
    }
  }

  // Update avatar preferences
  static async updateAvatarPreferences(req, res) {
    try {
      const userId = req.user?.userId;
      const { preferredStyle, defaultColor, autoGenerate } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Update user profile with avatar preferences
      const pool = require('../config/database');
      const query = `
        UPDATE user_profiles 
        SET avatar_metadata = avatar_metadata || $1
        WHERE user_id = $2
        RETURNING avatar_metadata
      `;

      const result = await pool.query(query, [
        JSON.stringify({
          preferences: {
            preferredStyle: preferredStyle || 'avataaars',
            defaultColor: defaultColor || '3b82f6',
            autoGenerate: autoGenerate || false
          }
        }),
        userId
      ]);

      res.json({
        success: true,
        message: 'Avatar preferences updated successfully',
        data: {
          preferences: result.rows[0].avatar_metadata?.preferences || {}
        }
      });

    } catch (error) {
      console.error('Update avatar preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update avatar preferences',
        error: error.message
      });
    }
  }

  // Get avatar statistics (admin only)
  static async getAvatarStatistics(req, res) {
    try {
      const pool = require('../config/database');

      // Get avatar type distribution
      const typeQuery = `
        SELECT 
          avatar_type,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
        FROM user_profiles
        WHERE avatar_type IS NOT NULL
        GROUP BY avatar_type
        ORDER BY count DESC
      `;

      const typeResult = await pool.query(typeQuery);

      // Get most popular templates
      const templateQuery = `
        SELECT 
          avatar_metadata->>'template_name' as template_name,
          COUNT(*) as usage_count
        FROM user_profiles
        WHERE avatar_type = 'random' 
          AND avatar_metadata->>'template_name' IS NOT NULL
        GROUP BY avatar_metadata->>'template_name'
        ORDER BY usage_count DESC
        LIMIT 10
      `;

      const templateResult = await pool.query(templateQuery);

      // Get generation statistics
      const generationQuery = `
        SELECT 
          generation_type,
          COUNT(*) as total_requests,
          COUNT(CASE WHEN generation_status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN generation_status = 'failed' THEN 1 END) as failed,
          ROUND(AVG(processing_time_ms), 2) as avg_processing_time
        FROM avatar_generation_requests
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY generation_type
      `;

      const generationResult = await pool.query(generationQuery);

      res.json({
        success: true,
        data: {
          typeDistribution: typeResult.rows,
          popularTemplates: templateResult.rows,
          generationStats: generationResult.rows
        }
      });

    } catch (error) {
      console.error('Get avatar statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get avatar statistics',
        error: error.message
      });
    }
  }
}

module.exports = AvatarController;
