const DietContent = require('../models/DietContent');
const ProtectionPlanContent = require('../models/ProtectionPlanContent');
const ContentAuditLog = require('../models/ContentAuditLog');

class AdminController {
  static async createDietContent(req, res) {
    try {
      const contentData = req.body;
      const adminId = req.admin.userId || 'system';

      // Create diet content
      const content = await DietContent.create(contentData);

      // Log the action
      await ContentAuditLog.create(
        adminId,
        'create',
        'diet_content',
        content.id,
        null,
        content
      );

      res.status(201).json({
        success: true,
        message: 'Diet content created successfully',
        data: content
      });
    } catch (error) {
      console.error('Create diet content error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating diet content'
      });
    }
  }

  static async getDietContent(req, res) {
    try {
      const { diet_type, budget_level, region, limit = 50 } = req.query;

      let content;
      if (diet_type && budget_level && region) {
        content = await DietContent.findByFilters(diet_type, budget_level, region);
      } else if (diet_type) {
        content = await DietContent.findByDietType(diet_type);
      } else if (budget_level) {
        content = await DietContent.findByBudgetLevel(budget_level);
      } else if (region) {
        content = await DietContent.findByRegion(region);
      } else {
        content = await DietContent.getAll();
      }

      // Limit results if specified
      const limitedContent = limit ? content.slice(0, parseInt(limit)) : content;

      res.json({
        success: true,
        data: limitedContent,
        total: content.length,
        returned: limitedContent.length
      });
    } catch (error) {
      console.error('Get diet content error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching diet content'
      });
    }
  }

  static async updateDietContent(req, res) {
    try {
      const { id } = req.params;
      const contentData = req.body;
      const adminId = req.admin.userId || 'system';

      // Get existing content for audit
      const existingContent = await DietContent.findById(id);
      if (!existingContent) {
        return res.status(404).json({
          success: false,
          message: 'Diet content not found'
        });
      }

      // Update content (you'll need to implement update method in DietContent model)
      const updatedContent = await DietContent.update(id, contentData);

      // Log the action
      await ContentAuditLog.create(
        adminId,
        'update',
        'diet_content',
        id,
        existingContent,
        updatedContent
      );

      res.json({
        success: true,
        message: 'Diet content updated successfully',
        data: updatedContent
      });
    } catch (error) {
      console.error('Update diet content error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating diet content'
      });
    }
  }

  static async deleteDietContent(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.admin.userId || 'system';

      // Get existing content for audit
      const existingContent = await DietContent.findById(id);
      if (!existingContent) {
        return res.status(404).json({
          success: false,
          message: 'Diet content not found'
        });
      }

      // Delete content (you'll need to implement delete method in DietContent model)
      await DietContent.delete(id);

      // Log the action
      await ContentAuditLog.create(
        adminId,
        'delete',
        'diet_content',
        id,
        existingContent,
        null
      );

      res.json({
        success: true,
        message: 'Diet content deleted successfully'
      });
    } catch (error) {
      console.error('Delete diet content error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting diet content'
      });
    }
  }

  static async createProtectionPlanContent(req, res) {
    try {
      const contentData = req.body;
      const adminId = req.admin.userId || 'system';

      // Create protection plan content
      const content = await ProtectionPlanContent.create(contentData);

      // Log the action
      await ContentAuditLog.create(
        adminId,
        'create',
        'protection_plan_content',
        content.id,
        null,
        content
      );

      res.status(201).json({
        success: true,
        message: 'Protection plan content created successfully',
        data: content
      });
    } catch (error) {
      console.error('Create protection plan content error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating protection plan content'
      });
    }
  }

  static async getProtectionPlanContent(req, res) {
    try {
      const { risk_band, plan_type, section, limit = 50 } = req.query;

      let content;
      if (risk_band && plan_type && section) {
        content = await ProtectionPlanContent.findByFilters(risk_band, plan_type, section);
      } else if (risk_band) {
        content = await ProtectionPlanContent.findByRiskBand(risk_band);
      } else if (plan_type) {
        content = await ProtectionPlanContent.findByPlanType(plan_type);
      } else if (section) {
        content = await ProtectionPlanContent.findBySection(section);
      } else {
        content = await ProtectionPlanContent.getAll();
      }

      // Limit results if specified
      const limitedContent = limit ? content.slice(0, parseInt(limit)) : content;

      res.json({
        success: true,
        data: limitedContent,
        total: content.length,
        returned: limitedContent.length
      });
    } catch (error) {
      console.error('Get protection plan content error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching protection plan content'
      });
    }
  }

  static async updateProtectionPlanContent(req, res) {
    try {
      const { id } = req.params;
      const contentData = req.body;
      const adminId = req.admin?.userId || 'system';

      // Get existing content for audit
      const existingContent = await ProtectionPlanContent.findById(id);
      if (!existingContent) {
        return res.status(404).json({
          success: false,
          message: 'Protection plan content not found'
        });
      }

      // Update content
      const updatedContent = await ProtectionPlanContent.update(id, {
        ...contentData,
        updated_by: adminId
      });

      // Log the action
      await ContentAuditLog.create(
        adminId,
        'update',
        'protection_plan_content',
        id,
        existingContent,
        updatedContent
      );

      res.json({
        success: true,
        message: 'Protection plan content updated successfully',
        data: updatedContent
      });
    } catch (error) {
      console.error('Update protection plan content error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating protection plan content'
      });
    }
  }

  static async deleteProtectionPlanContent(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.admin?.userId || 'system';

      // Get existing content for audit
      const existingContent = await ProtectionPlanContent.findById(id);
      if (!existingContent) {
        return res.status(404).json({
          success: false,
          message: 'Protection plan content not found'
        });
      }

      // Delete content (soft delete)
      await ProtectionPlanContent.delete(id);

      // Log the action
      await ContentAuditLog.create(
        adminId,
        'delete',
        'protection_plan_content',
        id,
        existingContent,
        null
      );

      res.json({
        success: true,
        message: 'Protection plan content deleted successfully'
      });
    } catch (error) {
      console.error('Delete protection plan content error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting protection plan content'
      });
    }
  }

  static async getAuditLogs(req, res) {
    try {
      const { table_name, days = 7, limit = 100 } = req.query;

      let logs;
      if (table_name) {
        logs = await ContentAuditLog.getByTableName(table_name, parseInt(limit));
      } else {
        logs = await ContentAuditLog.getRecent(parseInt(days), parseInt(limit));
      }

      res.json({
        success: true,
        data: logs,
        total: logs.length
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching audit logs'
      });
    }
  }

  static async getSystemStats(req, res) {
    try {
      // Get basic statistics
      const dietContentCount = await DietContent.getAll();
      const protectionContentCount = await ProtectionPlanContent.getAll();
      const recentLogs = await ContentAuditLog.getRecent(1, 50);

      res.json({
        success: true,
        data: {
          diet_content_count: dietContentCount.length,
          protection_plan_content_count: protectionContentCount.length,
          recent_admin_actions: recentLogs.length,
          admin_info: {
            email: req.admin.email,
            role: req.admin.role,
            source: req.admin.source
          }
        }
      });
    } catch (error) {
      console.error('Get system stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching system stats'
      });
    }
  }
}

module.exports = AdminController;
