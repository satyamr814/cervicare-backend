const pool = require('../config/database');

class RoleMiddleware {
  static requireRole(requiredRole) {
    return async (req, res, next) => {
      try {
        // Get user ID from JWT token (set by auth middleware)
        const userId = req.user?.userId || req.user?.id;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        // Get user role from database
        const query = `
          SELECT role, plan_type, is_active, email_verified
          FROM users 
          WHERE id = $1
        `;
        
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'User not found'
          });
        }

        const user = result.rows[0];

        // Check if user is active
        if (!user.is_active) {
          return res.status(403).json({
            success: false,
            message: 'Account is deactivated'
          });
        }

        // Check if email is verified (for production)
        if (process.env.NODE_ENV === 'production' && !user.email_verified) {
          return res.status(403).json({
            success: false,
            message: 'Email verification required'
          });
        }

        // Check role hierarchy
        const roleHierarchy = {
          'user': 1,
          'admin': 2
        };

        const userRoleLevel = roleHierarchy[user.role] || 0;
        const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

        if (userRoleLevel < requiredRoleLevel) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions'
          });
        }

        // Add user info to request for downstream use
        req.userRole = user.role;
        req.userPlanType = user.plan_type;
        
        next();
      } catch (error) {
        console.error('Role middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    };
  }

  static requireAdmin() {
    return RoleMiddleware.requireRole('admin');
  }

  static requireUser() {
    return RoleMiddleware.requireRole('user');
  }

  static requirePremium() {
    return async (req, res, next) => {
      try {
        // First check if user is authenticated
        const userId = req.user?.userId;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        // Get user plan type
        const query = `
          SELECT plan_type, trial_expires_at
          FROM users 
          WHERE id = $1 AND is_active = true
        `;
        
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'User not found'
          });
        }

        const user = result.rows[0];

        // Check if user has premium access
        const hasPremium = user.plan_type === 'premium' || 
                          (user.plan_type === 'trial' && user.trial_expires_at > new Date());

        if (!hasPremium) {
          return res.status(403).json({
            success: false,
            message: 'Premium subscription required',
            code: 'PREMIUM_REQUIRED'
          });
        }

        // Add plan info to request
        req.userPlanType = user.plan_type;
        req.isPremium = true;
        
        next();
      } catch (error) {
        console.error('Premium middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    };
  }

  static requireFeature(featureName) {
    return async (req, res, next) => {
      try {
        const userId = req.user?.userId;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        // Check if feature is enabled globally
        const featureQuery = `
          SELECT enabled, rollout_percentage, target_user_roles, target_plan_types
          FROM feature_flags
          WHERE flag_name = $1
        `;
        
        const featureResult = await pool.query(featureQuery, [featureName]);
        
        if (featureResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Feature not found'
          });
        }

        const feature = featureResult.rows[0];

        // Check if feature is globally enabled
        if (!feature.enabled) {
          return res.status(403).json({
            success: false,
            message: 'Feature is not available',
            code: 'FEATURE_DISABLED'
          });
        }

        // Get user details for targeting
        const userQuery = `
          SELECT role, plan_type
          FROM users 
          WHERE id = $1 AND is_active = true
        `;
        
        const userResult = await pool.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'User not found'
          });
        }

        const user = userResult.rows[0];

        // Check if user is in target roles
        if (feature.target_user_roles.length > 0 && !feature.target_user_roles.includes(user.role)) {
          return res.status(403).json({
            success: false,
            message: 'Feature not available for your role',
            code: 'FEATURE_ROLE_RESTRICTED'
          });
        }

        // Check if user is in target plan types
        if (feature.target_plan_types.length > 0 && !feature.target_plan_types.includes(user.plan_type)) {
          return res.status(403).json({
            success: false,
            message: 'Feature requires premium subscription',
            code: 'FEATURE_PLAN_RESTRICTED'
          });
        }

        // Check rollout percentage (simple hash-based rollout)
        if (feature.rollout_percentage < 100) {
          const userHash = require('crypto').createHash('md5').update(userId + featureName).digest('hex');
          const hashValue = parseInt(userHash.substring(0, 8), 16) % 100;
          
          if (hashValue >= feature.rollout_percentage) {
            return res.status(403).json({
              success: false,
              message: 'Feature not yet available',
              code: 'FEATURE_ROLLOUT_PENDING'
            });
          }
        }

        // Check user-specific assignment
        const assignmentQuery = `
          SELECT enabled
          FROM user_feature_assignments
          WHERE user_id = $1 AND flag_name = $2
        `;
        
        const assignmentResult = await pool.query(assignmentQuery, [userId, featureName]);
        
        if (assignmentResult.rows.length > 0 && !assignmentResult.rows[0].enabled) {
          return res.status(403).json({
            success: false,
            message: 'Feature access revoked',
            code: 'FEATURE_ACCESS_REVOKED'
          });
        }

        // Track feature usage
        const analyticsService = require('../services/analyticsService');
        analyticsService.trackEvent(userId, 'premium_feature_used', {
          featureName: featureName
        }, {
          sessionId: req.sessionId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        next();
      } catch (error) {
        console.error('Feature middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    };
  }

  static async updateUserLastLogin(userId) {
    try {
      const query = `
        UPDATE users 
        SET last_login_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `;
      
      await pool.query(query, [userId]);
    } catch (error) {
      console.error('Failed to update user last login:', error);
    }
  }

  static async logSecurityEvent(userId, action, resourceType = null, resourceId = null, success = true, errorMessage = null) {
    try {
      const query = `
        INSERT INTO security_audit_logs (user_id, action, resource_type, resource_id, success, error_message)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      const result = await pool.query(query, [userId, action, resourceType, resourceId, success, errorMessage]);
      return result.rows[0].id;
    } catch (error) {
      console.error('Failed to log security event:', error);
      return null;
    }
  }
}

module.exports = RoleMiddleware;
