const { GoogleSpreadsheet } = require('google-spreadsheet');
const pool = require('../config/database');
const fs = require('fs');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.isInitialized = false;
    this.syncQueue = [];
    this.isProcessing = false;
    this.retryCount = 3;
    this.retryDelay = 1000;
  }

  loadCredentials() {
    if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
      return JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
    }

    const credsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH ||
      process.env.GOOGLE_SHEETS_CREDENTIALS_FILE ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (credsPath) {
      try {
        const raw = fs.readFileSync(credsPath, 'utf8');
        return JSON.parse(raw);
      } catch (error) {
        console.error('❌ Failed to read credentials file:', error.message);
        return null;
      }
    }
    return null;
  }

  async initialize() {
    try {
      if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
        console.warn('⚠️ Google Sheets spreadsheet ID not configured. Sync disabled.');
        return false;
      }

      const credentials = this.loadCredentials();
      if (!credentials) {
        console.warn('⚠️ Google Sheets credentials not configured. Sync disabled.');
        return false;
      }

      this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
      await this.doc.useServiceAccountAuth(credentials);
      await this.doc.loadInfo();

      this.isInitialized = true;
      console.log('✅ Google Sheets service initialized');

      // Process any queued items
      this.processQueue();

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets service:', error);
      return false;
    }
  }

  async queueSync(methodName, args) {
    this.syncQueue.push({ methodName, args, timestamp: new Date().toISOString() });
    console.log(`📝 Queued Google Sheets sync: ${methodName}`);

    // Attempt processing if initialized
    if (this.isInitialized) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing || this.syncQueue.length === 0 || !this.isInitialized) return;

    this.isProcessing = true;
    while (this.syncQueue.length > 0) {
      const { methodName, args } = this.syncQueue[0];
      try {
        await this[methodName](...args, true); // true indicates it's from queue/internal
        this.syncQueue.shift();
      } catch (error) {
        console.error(`❌ Failed to process queued sync ${methodName}:`, error);
        break; // Stop processing queue on failure
      }
    }
    this.isProcessing = false;
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
      'users': ['user_id', 'email', 'phone', 'city', 'created_at'],
      'profiles': ['user_id', 'diet_type', 'budget_level', 'lifestyle', 'profile_image_url', 'updated_at'],
      'actions': ['user_id', 'action_type', 'source', 'timestamp'],
      'User Logins': ['Timestamp', 'User ID', 'Email', 'Signup Date', 'IP Address', 'User Agent', 'Profile Completed', 'Avatar Type', 'City', 'Age', 'Gender', 'Diet Type', 'Budget Level', 'Lifestyle'],
      'Bot Data': ['Timestamp', 'User ID', 'Email', 'Phone', 'Bot Message', 'Bot Response', 'Intent', 'Action Taken', 'WhatsApp Sent', 'Session ID', 'Message Type'],
      'User Analytics': ['Timestamp', 'User ID', 'Email', 'Event Type', 'Event Data', 'Session ID', 'IP Address', 'User Agent'],
      'Content Analytics': ['Timestamp', 'Content Type', 'Content ID', 'Title', 'Views', 'Unique Users', 'Conversion Rate', 'Avg Rating']
    };

    return headers[sheetTitle] || ['Timestamp', 'User ID', 'Data'];
  }

  async syncUserSignup(userId, email, phone = 'N/A', city = 'N/A', fromQueue = false) {
    if (!this.isInitialized && !fromQueue) {
      this.queueSync('syncUserSignup', [userId, email, phone, city]);
      return false;
    }

    try {
      const sheet = await this.ensureSheet('users');
      if (!sheet) return false;

      await sheet.addRow({
        'user_id': userId,
        'email': email,
        'phone': phone,
        'city': city,
        'created_at': new Date().toISOString()
      });

      await this.logSyncEvent('user_signup', userId, { email, phone, city });
      return true;
    } catch (error) {
      console.error('❌ Failed to sync user signup:', error);
      await this.logSyncEvent('user_signup', userId, { email, error: error.message }, 'failed');
      throw error; // Rethrow to let queue/caller handle it
    }
  }

  async syncProfileUpdate(userId, profileData, fromQueue = false) {
    if (!this.isInitialized && !fromQueue) {
      this.queueSync('syncProfileUpdate', [userId, profileData]);
      return false;
    }

    try {
      const sheet = await this.ensureSheet('profiles');
      if (!sheet) return false;

      await sheet.addRow({
        'user_id': userId,
        'diet_type': profileData.diet_type || 'N/A',
        'budget_level': profileData.budget_level || 'N/A',
        'lifestyle': profileData.lifestyle || 'N/A',
        'updated_at': new Date().toISOString()
      });

      await this.logSyncEvent('profile_update', userId, profileData);
      return true;
    } catch (error) {
      console.error('❌ Failed to sync profile update:', error);
      await this.logSyncEvent('profile_update', userId, profileData, 'failed', error.message);
      throw error;
    }
  }

  async syncUserAction(userId, actionType, source = 'website', metadata = {}, fromQueue = false) {
    if (!this.isInitialized && !fromQueue) {
      this.queueSync('syncUserAction', [userId, actionType, source, metadata]);
      return false;
    }

    try {
      const sheet = await this.ensureSheet('actions');
      if (!sheet) return false;

      await sheet.addRow({
        'user_id': userId,
        'action_type': actionType,
        'source': source,
        'timestamp': new Date().toISOString()
      });

      await this.logSyncEvent('user_action', userId, { actionType, source, ...metadata });
      return true;
    } catch (error) {
      console.error('❌ Failed to sync user action:', error);
      throw error;
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
