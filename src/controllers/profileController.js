const UserProfile = require('../models/UserProfile');
const webhookService = require('../services/webhookService');
const googleSheetsService = require('../services/googleSheetsService');

class ProfileController {
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const profile = await UserProfile.findByUserId(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found. Please create a profile first.'
        });
      }

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching profile'
      });
    }
  }

  static async createOrUpdateProfile(req, res) {
    try {
      const userId = req.user.id;
      const profileData = req.body;

      const profile = await UserProfile.upsert(userId, profileData);

      // Add user email to profile data for services
      const profileWithEmail = { ...profile, email: req.user.email };

      // Trigger webhook if profile is completed and user has consent
      if (profileData.whatsapp_consent) {
        await webhookService.triggerProfileCompleted(userId);
      }

      // Sync to Google Sheets
      await googleSheetsService.syncProfileUpdate(userId, profileWithEmail);

      res.json({
        success: true,
        message: 'Profile saved successfully',
        data: profile
      });
    } catch (error) {
      console.error('Save profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while saving profile'
      });
    }
  }
}

module.exports = ProfileController;
