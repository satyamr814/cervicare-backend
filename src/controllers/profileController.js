const UserProfile = require('../models/UserProfile');
const webhookService = require('../services/webhookService');
const googleSheetsService = require('../services/googleSheetsService');

class ProfileController {
  static async getProfile(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const profile = await UserProfile.findByUserId(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found. Please create a profile first.'
        });
      }

      res.json({
        success: true,
        data: {
          user: req.user,
          profile
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);

      if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
        return res.status(503).json({
          success: false,
          message: 'Database is not reachable. Start PostgreSQL and set DATABASE_URL, then run database/schema.sql.',
          code: 'DB_UNAVAILABLE'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching profile'
      });
    }
  }

  static async createOrUpdateProfile(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const profileData = req.body;

      const profile = await UserProfile.upsert(userId, profileData);

      // Add user email to profile data for services
      const profileWithEmail = { ...profile, email: req.user.email };

      // Log action (non-blocking)
      googleSheetsService.syncUserAction(userId, 'profile_updated', 'website').catch(console.error);

      // Trigger webhook if user has consent (consent check is inside the service)
      // Pass the updated profile data to the webhook service
      webhookService.triggerProfileCompleted(userId, profile.phone, profile).catch(console.error);

      // Sync to Google Sheets with full profile data
      googleSheetsService.syncProfileUpdate(userId, profile).catch(console.error);

      res.json({
        success: true,
        message: 'Profile saved successfully',
        data: {
          user: req.user,
          profile
        }
      });
    } catch (error) {
      console.error('Save profile error:', error);

      if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
        return res.status(503).json({
          success: false,
          message: 'Database is not reachable. Start PostgreSQL and set DATABASE_URL, then run database/schema.sql.',
          code: 'DB_UNAVAILABLE'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while saving profile'
      });
    }
  }
}

module.exports = ProfileController;
