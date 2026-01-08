# CerviCare Backend Phase 2 - Architecture & Implementation

## 🎯 Phase 2 Objectives

Phase 2 transforms the CerviCare backend from a basic API into an operational, automation-ready platform with:
- **Admin Content Management**: Curated content control without UI
- **Data Visibility**: Google Sheets integration for admin insights
- **Automation Hooks**: n8n-ready webhooks for WhatsApp automation
- **Consent Management**: GDPR-compliant user consent handling

## 🏗️ Enhanced Architecture

### New Components Added in Phase 2

```
/src
  /config          # Existing: Database & JWT
  /controllers     # Enhanced: + adminController, webhookController
  /middlewares     # Enhanced: + admin middleware
  /models          # Enhanced: + AdminUser, ContentAuditLog
  /routes          # Enhanced: + admin, webhook routes
  /services        # NEW: googleSheetsService, webhookService
  server.js        # Enhanced: + service initialization
```

### Database Schema Extensions

**New Tables:**
- `admin_users` - Administrative user management
- `content_audit_log` - Track all content changes
- `webhook_logs` - Log automation events
- `google_sheets_sync_log` - Track sync operations

**Enhanced Tables:**
- `user_profiles` - Added consent flags and phone field

## 🔐 Admin Content Management

### Access Control
Two-layer authentication system:
1. **Environment Key**: Simple `X-Admin-Key` header
2. **JWT Token**: Role-based with admin email verification

### Content Management APIs
```javascript
// Diet Content Management
POST /api/admin/diet-content    // Create new diet recommendations
GET /api/admin/diet-content     // Retrieve with filters

// Protection Plan Management  
POST /api/admin/protection-plan // Create protection content
GET /api/admin/protection-plan  // Retrieve with filters

// Audit & Monitoring
GET /api/admin/audit-logs       // Content change history
GET /api/admin/stats           // System statistics
```

### Audit Trail System
Every content change is logged:
- **Who**: Admin ID and email
- **What**: Action type (create/update/delete)
- **Where**: Table and record affected
- **When**: Timestamp
- **Before/After**: JSON snapshots of data

## 📊 Google Sheets Integration (Visibility Layer)

### Purpose & Design Philosophy
Google Sheets is **NOT** a database - it's a visibility layer for:
- **Admin Dashboard**: Non-technical team members
- **Demo Purposes**: Judge presentations and stakeholder reviews
- **Quick Insights**: Real-time user activity monitoring

### Automated Sync Events
Four key data flows are automatically synced:

1. **User Signups**
   ```javascript
   // Triggered on: POST /api/auth/signup
   // Sheet: "User Signups"
   // Data: Timestamp, User ID, Email, Signup Date
   ```

2. **Profile Updates**
   ```javascript
   // Triggered on: POST /api/profile
   // Sheet: "Profile Updates"  
   // Data: Complete profile with consent flags
   ```

3. **Diet Plan Generation**
   ```javascript
   // Triggered on: GET /api/diet-plan
   // Sheet: "Diet Plans"
   // Data: User preferences, recommendations count
   ```

4. **Protection Plan Access**
   ```javascript
   // Triggered on: GET /api/protection-plan
   // Sheet: "Protection Plans"
   // Data: Risk band, plan sections accessed
   ```

### Service Architecture
```javascript
class GoogleSheetsService {
  async initialize()           // Service account auth
  async ensureSheet(title)     // Create sheets if needed
  async syncUserSignup()       // Sync new users
  async syncProfileUpdate()    // Sync profile changes
  async syncDietPlan()         // Sync diet recommendations
  async syncProtectionPlan()   // Sync protection plans
  async logSyncEvent()         // Track sync operations
}
```

## 🔗 n8n Automation Webhooks

### Consent-Driven Automation
Webhooks are **only triggered** with explicit user consent:

```javascript
// Consent Check Logic
hasConsent(actionType, profile) {
  switch (actionType) {
    case 'profile_completed':
    case 'protection_plan_accessed':
      return profile.whatsapp_consent === true;
    
    case 'marketing_update':
      return profile.marketing_consent === true;
    
    case 'user_signup':
      return true; // Welcome messages don't require consent
  }
}
```

### Webhook Events & Payloads

1. **User Signup**
   ```json
   {
     "user_id": "uuid",
     "email": "user@example.com",
     "action_type": "user_signup",
     "timestamp": "2024-01-05T10:00:00Z",
     "event": "new_user_registered",
     "category": "user_acquisition"
   }
   ```

2. **Profile Completed**
   ```json
   {
     "user_id": "uuid",
     "phone": "+1234567890",
     "action_type": "profile_completed",
     "timestamp": "2024-01-05T10:05:00Z",
     "event": "user_profile_completed",
     "category": "user_engagement"
   }
   ```

3. **Protection Plan Accessed**
   ```json
   {
     "user_id": "uuid",
     "phone": "+1234567890",
     "action_type": "protection_plan_accessed",
     "timestamp": "2024-01-05T10:10:00Z",
     "event": "protection_plan_viewed",
     "category": "health_engagement",
     "risk_band": "moderate"
   }
   ```

### Webhook Service Architecture
```javascript
class WebhookService {
  async triggerN8nWebhook()     // Main webhook trigger
  hasConsent()                   // GDPR compliance check
  async logWebhook()             // Track webhook calls
  async testWebhook()            // Health check endpoint
}
```

## 🔄 Data Flow Architecture

### Complete User Journey with Phase 2 Enhancements

1. **User Registration**
   ```
   Signup Request → User Created → JWT Token → 
   Webhook Triggered (n8n) → Google Sheets Sync → Response
   ```

2. **Profile Creation**
   ```
   Profile Data → Consent Check → Profile Saved → 
   Webhook Triggered (if consent) → Google Sheets Sync → Response
   ```

3. **Personalization Request**
   ```
   Authenticated Request → Profile Lookup → Content Matching → 
   Webhook Triggered → Google Sheets Sync → Personalized Response
   ```

### Admin Content Flow
```
Admin Auth → Content Creation → Audit Log → Database → 
Google Sheets Sync (optional) → User Personalization
```

## 🛡️ Safety & Compliance

### GDPR Compliance
- **Explicit Consent**: Separate flags for WhatsApp and marketing
- **Consent Tracking**: All consent changes logged
- **Data Minimization**: Only necessary data shared with webhooks
- **Right to Withdraw**: Users can disable consent anytime

### Security Enhancements
- **Admin Access Control**: Multi-layer authentication
- **Audit Trail**: Complete content change history
- **Webhook Security**: Timeout handling and error logging
- **Data Validation**: Enhanced Joi schemas for new fields

## 🚀 Automation Integration

### n8n Workflow Integration
The webhook system is designed for seamless n8n integration:

1. **Webhook Trigger Node**: Receives events from CerviCare
2. **Filter Node**: Routes based on action_type
3. **WhatsApp Node**: Sends messages (with consent)
4. **Database Node**: Updates external systems
5. **Delay/Logic Nodes**: Implements follow-up sequences

### Example n8n Workflow
```
CerviCare Webhook → Filter by Action → 
Check Consent → WhatsApp Message → 
Update CRM → Schedule Follow-up
```

## 📈 Monitoring & Observability

### Log Tables for Debugging
- `webhook_logs`: All webhook calls and responses
- `google_sheets_sync_log`: Sync operation status
- `content_audit_log`: Admin content changes

### System Status Endpoint
```javascript
GET /api/webhook/status
{
  "webhook": {
    "configured": true,
    "test_result": "success"
  },
  "google_sheets": {
    "configured": true,
    "initialized": true
  },
  "environment": {
    "node_env": "production",
    "has_admin_key": true
  }
}
```

## 🔧 Deployment Considerations

### Environment Variables (Phase 2)
```env
# Admin Access
ADMIN_KEY=your-admin-secret-key
ADMIN_EMAILS=admin@cervicare.com

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# n8n Integration
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/cervicare
```

### Database Migration
```bash
# Apply Phase 2 schema updates
psql -d cervicare_db -f database/schema-phase2-updates.sql
```

## 🎯 Phase 3 Preparation

Phase 2 establishes the foundation for Phase 3:

### Scalable Architecture
- **Service Layer**: Modular services for easy extension
- **Event-Driven**: Webhook system ready for more complex workflows
- **Audit Infrastructure**: Complete change tracking for compliance

### Integration Points
- **WhatsApp Business**: Ready for direct API integration
- **External Systems**: Webhook format compatible with any automation platform
- **Analytics**: Google Sheets provides foundation for BI tools

### Content Management
- **Admin APIs**: Ready for UI dashboard development
- **Version Control**: Audit trail supports content versioning
- **Workflow Automation**: Content changes can trigger automated processes

## 📋 API Endpoints Summary

### Authentication (Existing)
- `POST /api/auth/signup` - Enhanced with webhooks
- `POST /api/auth/login` - Enhanced with email in JWT

### Profile Management (Enhanced)
- `GET /api/profile` - Existing functionality
- `POST /api/profile` - Enhanced with consent fields and webhooks

### Personalization (Enhanced)
- `GET /api/diet-plan` - Enhanced with webhooks and sync
- `GET /api/protection-plan` - Enhanced with webhooks and sync

### Admin Management (NEW)
- `POST /api/admin/diet-content` - Create diet content
- `GET /api/admin/diet-content` - Retrieve diet content
- `POST /api/admin/protection-plan` - Create protection content
- `GET /api/admin/protection-plan` - Retrieve protection content
- `GET /api/admin/audit-logs` - View content changes
- `GET /api/admin/stats` - System statistics

### Webhook Management (NEW)
- `POST /api/webhook/n8n` - Public webhook endpoint
- `POST /api/webhook/test` - Test webhook connectivity
- `GET /api/webhook/logs` - View webhook history
- `GET /api/webhook/google-sheets-logs` - View sync history
- `POST /api/webhook/google-sheets-sync` - Manual sync trigger
- `GET /api/webhook/status` - System status

Phase 2 successfully transforms CerviCare into a production-ready, automation-friendly platform while maintaining the core preventive healthcare principles and safety constraints established in Phase 1.
