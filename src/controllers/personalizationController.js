const UserProfile = require('../models/UserProfile');
const DietContent = require('../models/DietContent');
const ProtectionPlanContent = require('../models/ProtectionPlanContent');
const webhookService = require('../services/webhookService');
const googleSheetsService = require('../services/googleSheetsService');

class PersonalizationController {
  static async getDietPlan(req, res) {
    try {
      const userId = req.user.id;

      // Get user profile
      const profile = await UserProfile.findByUserId(userId);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found. Please complete your profile first.'
        });
      }

      // Rule-based personalization: Get diet content matching user's preferences
      const dietRecommendations = await DietContent.findByFilters(
        profile.diet_type,
        profile.budget_level,
        profile.city.toLowerCase().replace(/\s+/g, '_') // Normalize city name
      );

      // If no exact match, try broader search
      let finalRecommendations = dietRecommendations;
      if (dietRecommendations.length === 0) {
        // Try matching by diet type and budget level only
        const broaderResults = await DietContent.findByFilters(
          profile.diet_type,
          profile.budget_level,
          'general'
        );
        finalRecommendations = broaderResults;
      }

      // If still no results, get general recommendations for diet type
      if (finalRecommendations.length === 0) {
        const dietTypeResults = await DietContent.findByDietType(profile.diet_type);
        finalRecommendations = dietTypeResults.slice(0, 5); // Limit to 5 items
      }

      // Trigger webhook for diet plan generation (non-blocking)
      webhookService.triggerDietPlanGenerated(userId, profile.diet_type, finalRecommendations.length).catch(console.error);

      // Log action (non-blocking)
      googleSheetsService.syncUserAction(userId, 'diet_plan_viewed', 'website').catch(console.error);

      res.json({
        success: true,
        message: 'Diet plan retrieved successfully',
        data: {
          profile: {
            diet_type: profile.diet_type,
            budget_level: profile.budget_level,
            city: profile.city
          },
          recommendations: finalRecommendations,
          total_recommendations: finalRecommendations.length
        }
      });
    } catch (error) {
      console.error('Get diet plan error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while generating diet plan'
      });
    }
  }

  static async getProtectionPlan(req, res) {
    try {
      const userId = req.user.id;

      // Get user profile
      const profile = await UserProfile.findByUserId(userId);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found. Please complete your profile first.'
        });
      }

      // Rule-based risk band assignment (non-medical, lifestyle-based only)
      // This is NOT medical diagnosis - just lifestyle risk categorization
      let riskBand = 'low';

      if (profile.age >= 40) {
        riskBand = 'moderate';
      }
      if (profile.age >= 50 || profile.lifestyle === 'sedentary') {
        riskBand = 'higher_attention';
      }

      // Get protection plan content based on risk band
      const protectionContent = await ProtectionPlanContent.findByRiskBand(riskBand);

      // Organize content by sections
      const organizedContent = {
        diet: protectionContent.filter(item => item.section === 'diet'),
        lifestyle: protectionContent.filter(item => item.section === 'lifestyle'),
        screening: protectionContent.filter(item => item.section === 'screening')
      };

      // Trigger webhook for protection plan access (non-blocking)
      webhookService.triggerProtectionPlanAccessed(userId, riskBand).catch(console.error);

      // Log action (non-blocking)
      googleSheetsService.syncUserAction(userId, 'protection_plan_viewed', 'website').catch(console.error);

      res.json({
        success: true,
        message: 'Protection plan retrieved successfully',
        data: {
          profile: {
            age: profile.age,
            lifestyle: profile.lifestyle,
            assigned_risk_band: riskBand
          },
          protection_plan: organizedContent,
          disclaimer: 'This is preventive guidance only and not medical advice. Please consult healthcare professionals for medical concerns.'
        }
      });
    } catch (error) {
      console.error('Get protection plan error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while generating protection plan'
      });
    }
  }

  // Legacy Compatibility: Match root server.js format
  static async getLegacyProtectionPlan(req, res) {
    try {
      const userId = req.params.userId || req.user?.id;
      const profile = await UserProfile.findByUserId(userId);

      // Default data if no profile yet
      const score = profile ? (profile.age > 40 ? 65 : 45) : 45;

      const data = {
        userId,
        score,
        plans: [
          {
            id: 'plan-1',
            title: 'Annual Screening Schedule',
            description: 'Regular PAP smears and HPV tests are your first line of defense.',
            status: 'not-started',
            priority: 'high',
            duration: '12 months',
            steps: [
              { title: 'Schedule Consultation', note: 'Book appointment with a gynecologist', frequency: 'Once' },
              { title: 'Complete PAP Smear', note: 'Standard diagnostic test', frequency: 'Every 3 years' }
            ],
            notes: ''
          }
        ],
        updatedAt: new Date().toISOString()
      };

      res.json({ success: true, data });
    } catch (error) {
      console.error('Legacy protection plan error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

module.exports = PersonalizationController;
