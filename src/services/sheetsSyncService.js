const { GoogleSpreadsheet } = require('google-spreadsheet');
const pool = require('../config/database');

class SheetsSyncService {
  constructor() {
    this.doc = null;
    this.isInitialized = false;
    this.sheetCache = new Map();
    this.syncQueue = [];
    this.isProcessing = false;
    this.retryCount = 3;
    this.retryDelay = 1000; // 1 second
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
      
      // Pre-load and cache sheets
      await this.cacheSheets();
      
      this.isInitialized = true;
      console.log('✅ Google Sheets sync service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets sync service:', error);
      return false;
    }
  }

  async cacheSheets() {
    const sheetConfigs = [
      { name: 'PROD_Users_Active', title: 'Users' },
      { name: 'PROD_Profiles_Lifestyle', title: 'Profiles' },
      { name: 'PROD_Actions_Engagement', title: 'Actions' },
      { name: 'PROD_Content_Performance', title: 'Content Performance' },
      { name: 'PROD_System_Health', title: 'System Health' }
    ];

    for (const config of sheetConfigs) {
      try {
        let sheet = this.doc.sheetsByTitle[config.name];
        if (!sheet) {
          sheet = await this.doc.addSheet({
            title: config.name,
            headerValues: this.getHeaderValues(config.title)
          });
        }
        this.sheetCache.set(config.name, sheet);
      } catch (error) {
        console.error(`❌ Failed to cache sheet ${config.name}:`, error);
      }
    }
  }

  getHeaderValues(sheetTitle) {
    const headers = {
      'Users': [
        'user_id', 'email', 'phone', 'city', 'created_at', 'last_seen', 
        'status', 'whatsapp_consent', 'marketing_consent'
      ],
      'Profiles': [
        'user_id', 'age', 'gender', 'city', 'diet_type', 'budget_level', 
        'lifestyle', 'updated_at', 'completion_score', 'risk_band'
      ],
      'Actions': [
        'action_id', 'user_id', 'action_type', 'source', 'timestamp', 
        'metadata', 'session_id', 'device_type'
      ],
      'Content Performance': [
        'content_id', 'content_type', 'content_title', 'view_count', 
        'unique_users', 'conversion_rate', 'last_viewed', 'effectiveness_score'
      ],
      'System Health': [
        'metric_name', 'metric_value', 'metric_unit', 'timestamp', 
        'status', 'alert_threshold'
      ]
    };
    
    return headers[sheetTitle] || ['timestamp', 'data'];
  }

  // Non-blocking sync methods
  async syncUserSignup(userData) {
    if (!this.isInitialized) {
      this.queueSync('user_signup', userData);
      return;
    }

    // Fire and forget - don't wait for completion
    this.performSync('user_signup', userData).catch(error => {
      console.error('❌ Background user signup sync failed:', error);
    });
  }

  async syncProfileUpdate(profileData) {
    if (!this.isInitialized) {
      this.queueSync('profile_update', profileData);
      return;
    }

    this.performSync('profile_update', profileData).catch(error => {
      console.error('❌ Background profile update sync failed:', error);
    });
  }

  async syncUserAction(actionData) {
    if (!this.isInitialized) {
      this.queueSync('user_action', actionData);
      return;
    }

    this.performSync('user_action', actionData).catch(error => {
      console.error('❌ Background user action sync failed:', error);
    });
  }

  async syncSystemHealth(metricData) {
    if (!this.isInitialized) {
      this.queueSync('system_health', metricData);
      return;
    }

    this.performSync('system_health', metricData).catch(error => {
      console.error('❌ Background system health sync failed:', error);
    });
  }

  // Core sync logic with retry mechanism
  async performSync(syncType, data, attempt = 1) {
    try {
      let sheet;
      let rowData;

      switch (syncType) {
        case 'user_signup':
          sheet = this.sheetCache.get('PROD_Users_Active');
          rowData = {
            user_id: data.user_id,
            email: data.email,
            phone: data.phone || '',
            city: data.city || '',
            created_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            status: 'active',
            whatsapp_consent: data.whatsapp_consent || false,
            marketing_consent: data.marketing_consent || false
          };
          break;

        case 'profile_update':
          sheet = this.sheetCache.get('PROD_Profiles_Lifestyle');
          rowData = {
            user_id: data.user_id,
            age: data.age,
            gender: data.gender,
            city: data.city,
            diet_type: data.diet_type,
            budget_level: data.budget_level,
            lifestyle: data.lifestyle,
            updated_at: new Date().toISOString(),
            completion_score: this.calculateCompletionScore(data),
            risk_band: this.calculateRiskBand(data)
          };
          break;

        case 'user_action':
          sheet = this.sheetCache.get('PROD_Actions_Engagement');
          rowData = {
            action_id: data.action_id || this.generateActionId(),
            user_id: data.user_id,
            action_type: data.action_type,
            source: data.source || 'website',
            timestamp: new Date().toISOString(),
            metadata: data.metadata ? JSON.stringify(data.metadata) : '',
            session_id: data.session_id || '',
            device_type: data.device_type || 'unknown'
          };
          break;

        case 'system_health':
          sheet = this.sheetCache.get('PROD_System_Health');
          rowData = {
            metric_name: data.metric_name,
            metric_value: data.metric_value,
            metric_unit: data.metric_unit,
            timestamp: new Date().toISOString(),
            status: data.status,
            alert_threshold: data.alert_threshold
          };
          break;

        default:
          throw new Error(`Unknown sync type: ${syncType}`);
      }

      if (!sheet) {
        throw new Error(`Sheet not found for sync type: ${syncType}`);
      }

      await sheet.addRow(rowData);
      await this.logSyncSuccess(syncType, data);

    } catch (error) {
      if (attempt < this.retryCount) {
        console.warn(`⚠️ Sync attempt ${attempt} failed for ${syncType}, retrying...`);
        await this.delay(this.retryDelay * attempt);
        return this.performSync(syncType, data, attempt + 1);
      } else {
        console.error(`❌ All sync attempts failed for ${syncType}:`, error);
        await this.logSyncFailure(syncType, data, error.message);
        throw error;
      }
    }
  }

  // Queue system for when Sheets is unavailable
  queueSync(syncType, data) {
    this.syncQueue.push({ syncType, data, timestamp: new Date().toISOString() });
    console.log(`📝 Queued ${syncType} sync for later processing`);
  }

  async processQueue() {
    if (this.isProcessing || this.syncQueue.length === 0) return;

    this.isProcessing = true;
    console.log(`🔄 Processing ${this.syncQueue.length} queued sync operations`);

    while (this.syncQueue.length > 0) {
      const { syncType, data } = this.syncQueue.shift();
      try {
        await this.performSync(syncType, data);
      } catch (error) {
        console.error(`❌ Failed to process queued sync ${syncType}:`, error);
      }
    }

    this.isProcessing = false;
    console.log('✅ Queue processing completed');
  }

  // Helper methods
  calculateCompletionScore(profileData) {
    const fields = ['age', 'gender', 'city', 'diet_type', 'budget_level', 'lifestyle'];
    const completedFields = fields.filter(field => profileData[field] && profileData[field] !== '');
    return Math.round((completedFields.length / fields.length) * 100);
  }

  calculateRiskBand(profileData) {
    if (profileData.age >= 50 || profileData.lifestyle === 'sedentary') {
      return 'higher_attention';
    } else if (profileData.age >= 40) {
      return 'moderate';
    }
    return 'low';
  }

  generateActionId() {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async logSyncSuccess(syncType, data) {
    try {
      const query = `
        INSERT INTO google_sheets_sync_log (sync_type, user_id, data, status)
        VALUES ($1, $2, $3, 'success')
        RETURNING id
      `;
      
      await pool.query(query, [
        syncType, 
        data.user_id || null, 
        JSON.stringify(data)
      ]);
    } catch (error) {
      console.error('❌ Failed to log sync success:', error);
    }
  }

  async logSyncFailure(syncType, data, errorMessage) {
    try {
      const query = `
        INSERT INTO google_sheets_sync_log (sync_type, user_id, data, status, error_message)
        VALUES ($1, $2, $3, 'failed', $4)
        RETURNING id
      `;
      
      await pool.query(query, [
        syncType, 
        data.user_id || null, 
        JSON.stringify(data),
        errorMessage
      ]);
    } catch (error) {
      console.error('❌ Failed to log sync failure:', error);
    }
  }

  // Health check and maintenance
  async getSyncStatus() {
    try {
      const query = `
        SELECT 
          sync_type,
          COUNT(*) as total_syncs,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_syncs,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_syncs,
          MAX(created_at) as last_sync
        FROM google_sheets_sync_log 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY sync_type
        ORDER BY sync_type
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get sync status:', error);
      return [];
    }
  }

  async cleanupOldLogs(days = 30) {
    try {
      const query = `
        DELETE FROM google_sheets_sync_log 
        WHERE created_at < NOW() - INTERVAL '${days} days'
        RETURNING COUNT(*) as deleted_count
      `;
      
      const result = await pool.query(query);
      console.log(`🧹 Cleaned up ${result.rows[0].deleted_count} old sync logs`);
      return result.rows[0].deleted_count;
    } catch (error) {
      console.error('❌ Failed to cleanup old logs:', error);
      return 0;
    }
  }

  // Start background processing
  startBackgroundProcessing() {
    // Process queue every 30 seconds
    setInterval(() => {
      if (this.isInitialized) {
        this.processQueue();
      }
    }, 30000);

    // Cleanup old logs daily
    setInterval(() => {
      this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000);

    console.log('🔄 Background sync processing started');
  }
}

module.exports = new SheetsSyncService();
