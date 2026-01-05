const { GoogleSpreadsheet } = require('google-spreadsheet');
const pool = require('../config/database');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (!process.env.GOOGLE_SHEETS_CREDENTIALS || !process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
        console.warn('⚠️ Google Sheets credentials not configured. Sync disabled.');
        return false;
      }

      const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
      this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
      
      await this.doc.useServiceAccountAuth(credentials);
      await this.doc.loadInfo();
      
      this.isInitialized = true;
      console.log('✅ Google Sheets service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets service:', error);
      return false;
    }
  }

  async ensureSheet(sheetTitle) {
    if (!this.isInitialized) return null;

    try {
      let sheet = this.doc.sheetsByTitle[sheetTitle];
      
      if (!sheet) {
        sheet = await this.doc.addSheet({
          title: sheetTitle,
          headerValues: this.getHeaderValues(sheetTitle)
        });
      }
      
      return sheet;
    } catch (error) {
      console.error(`❌ Failed to ensure sheet ${sheetTitle}:`, error);
      return null;
    }
  }

  getHeaderValues(sheetTitle) {
    const headers = {
      'User Signups': ['Timestamp', 'User ID', 'Email', 'Signup Date'],
      'Profile Updates': ['Timestamp', 'User ID', 'Email', 'Age', 'Gender', 'City', 'Diet Type', 'Budget Level', 'Lifestyle', 'WhatsApp Consent', 'Marketing Consent', 'Phone'],
      'Diet Plans': ['Timestamp', 'User ID', 'Email', 'Diet Type', 'Budget Level', 'City', 'Recommendations Count', 'Top Recommendation'],
      'Protection Plans': ['Timestamp', 'User ID', 'Email', 'Age', 'Lifestyle', 'Risk Band', 'Plan Sections']
    };
    
    return headers[sheetTitle] || ['Timestamp', 'User ID', 'Data'];
  }

  async syncUserSignup(userId, email) {
    if (!this.isInitialized) return false;

    try {
      const sheet = await this.ensureSheet('User Signups');
      if (!sheet) return false;

      await sheet.addRow({
        'Timestamp': new Date().toISOString(),
        'User ID': userId,
        'Email': email,
        'Signup Date': new Date().toISOString()
      });

      await this.logSyncEvent('user_signup', userId, { email });
      return true;
    } catch (error) {
      console.error('❌ Failed to sync user signup:', error);
      await this.logSyncEvent('user_signup', userId, { email, error: error.message }, 'failed');
      return false;
    }
  }

  async syncProfileUpdate(userId, profileData) {
    if (!this.isInitialized) return false;

    try {
      const sheet = await this.ensureSheet('Profile Updates');
      if (!sheet) return false;

      await sheet.addRow({
        'Timestamp': new Date().toISOString(),
        'User ID': userId,
        'Email': profileData.email || 'N/A',
        'Age': profileData.age || 'N/A',
        'Gender': profileData.gender || 'N/A',
        'City': profileData.city || 'N/A',
        'Diet Type': profileData.diet_type || 'N/A',
        'Budget Level': profileData.budget_level || 'N/A',
        'Lifestyle': profileData.lifestyle || 'N/A',
        'WhatsApp Consent': profileData.whatsapp_consent || false,
        'Marketing Consent': profileData.marketing_consent || false,
        'Phone': profileData.phone || 'N/A'
      });

      await this.logSyncEvent('profile_update', userId, profileData);
      return true;
    } catch (error) {
      console.error('❌ Failed to sync profile update:', error);
      await this.logSyncEvent('profile_update', userId, profileData, 'failed', error.message);
      return false;
    }
  }

  async syncDietPlan(userId, email, profile, recommendations) {
    if (!this.isInitialized) return false;

    try {
      const sheet = await this.ensureSheet('Diet Plans');
      if (!sheet) return false;

      const topRecommendation = recommendations.length > 0 ? recommendations[0].food_name : 'N/A';

      await sheet.addRow({
        'Timestamp': new Date().toISOString(),
        'User ID': userId,
        'Email': email || 'N/A',
        'Diet Type': profile.diet_type,
        'Budget Level': profile.budget_level,
        'City': profile.city,
        'Recommendations Count': recommendations.length,
        'Top Recommendation': topRecommendation
      });

      await this.logSyncEvent('diet_plan', userId, { 
        email, 
        profile, 
        recommendationsCount: recommendations.length 
      });
      return true;
    } catch (error) {
      console.error('❌ Failed to sync diet plan:', error);
      await this.logSyncEvent('diet_plan', userId, { email, profile }, 'failed', error.message);
      return false;
    }
  }

  async syncProtectionPlan(userId, email, profile, protectionPlan) {
    if (!this.isInitialized) return false;

    try {
      const sheet = await this.ensureSheet('Protection Plans');
      if (!sheet) return false;

      const sections = Object.keys(protectionPlan).filter(key => 
        Array.isArray(protectionPlan[key]) && protectionPlan[key].length > 0
      ).join(', ');

      await sheet.addRow({
        'Timestamp': new Date().toISOString(),
        'User ID': userId,
        'Email': email || 'N/A',
        'Age': profile.age,
        'Lifestyle': profile.lifestyle,
        'Risk Band': profile.assigned_risk_band,
        'Plan Sections': sections || 'N/A'
      });

      await this.logSyncEvent('protection_plan', userId, { 
        email, 
        profile, 
        sectionsCount: sections.split(', ').filter(s => s !== 'N/A').length 
      });
      return true;
    } catch (error) {
      console.error('❌ Failed to sync protection plan:', error);
      await this.logSyncEvent('protection_plan', userId, { email, profile }, 'failed', error.message);
      return false;
    }
  }

  async logSyncEvent(syncType, userId, data, status = 'pending', errorMessage = null) {
    try {
      const query = `
        INSERT INTO google_sheets_sync_log (sync_type, user_id, data, status, error_message)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      
      await pool.query(query, [syncType, userId, JSON.stringify(data), status, errorMessage]);
    } catch (error) {
      console.error('❌ Failed to log sync event:', error);
    }
  }

  async getSyncLogs(userId = null, limit = 50) {
    try {
      let query = `
        SELECT * FROM google_sheets_sync_log 
        ${userId ? 'WHERE user_id = $1' : ''} 
        ORDER BY created_at DESC 
        LIMIT ${userId ? '$2' : '$1'}
      `;
      
      const params = userId ? [userId, limit] : [limit];
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get sync logs:', error);
      return [];
    }
  }
}

module.exports = new GoogleSheetsService();
