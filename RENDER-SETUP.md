# CerviCare Backend - Render Deployment Guide

## 🚀 Quick Setup for Render

### 1. **Repository Connected**
✅ **Git Repository**: https://github.com/satyamr814/cervicare-backend.git  
✅ **Latest Changes Pushed**: Phase 4 complete with avatars, analytics, and bot integration

### 2. **Render Web Service Setup**

#### **Step 1: Create New Web Service**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `satyamr814/cervicare-backend`
4. Select the `main` branch

#### **Step 2: Configure Build Settings**
```yaml
# Render Configuration
Build Command: npm install
Start Command: npm start
Runtime: Node 18 (or latest)
Root Directory: ./
```

#### **Step 3: Environment Variables**
Add these environment variables in Render dashboard:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/database_name

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-for-production

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Phase 2: Admin Access
ADMIN_KEY=your-admin-secret-key-min-16-chars
ADMIN_EMAILS=admin@cervicare.com,superadmin@cervicare.com

# Phase 3: Google Sheets Integration
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"your-project-id","private_key_id":"your-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}
GOOGLE_SHEETS_SPREADSHEET_ID=1jRprM6lBFldJSUEaoBtDJ6H3r4NXYVaXtXSDgYI_G1Q

# Phase 3: n8n Automation Integration
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/cervicare

# Phase 3: WhatsApp Business API
WHATSAPP_BUSINESS_PHONE_ID=your-whatsapp-phone-id
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token

# Phase 4: Security & Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
ADMIN_RATE_LIMIT_MAX=50
ENABLE_SECURITY_MONITORING=true

# Phase 4: Analytics & Monitoring
ENABLE_ANALYTICS=true
ANALYTICS_RETENTION_DAYS=90
SYSTEM_METRICS_RETENTION_HOURS=24
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_SECURITY_AUDIT=true

# Phase 4: Feature Flags
FEATURE_ROLLOUT_ENABLED=true
DEFAULT_ROLLOUT_PERCENTAGE=0
ENABLE_FEATURE_FLAG_CACHE=true
```

### 3. **Database Setup**

#### **Option A: Render PostgreSQL (Recommended)**
1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Choose a plan (Free tier available)
3. Note the connection string from Render dashboard
4. Add the connection string to `DATABASE_URL` environment variable

#### **Option B: External Database**
If using external PostgreSQL, update `DATABASE_URL` accordingly.

### 4. **Database Schema Setup**

After deployment, run these commands to set up the database:

```bash
# Access your Render service shell (in Render dashboard)
# Run database setup scripts

# Phase 1 Schema
psql $DATABASE_URL -f database/schema.sql

# Phase 2 Updates
psql $DATABASE_URL -f database/schema-phase2-updates.sql

# Phase 3 Updates
psql $DATABASE_URL -f database/schema-phase3-updates.sql

# Phase 4 Updates
psql $DATABASE_URL -f database/schema-phase4-updates.sql

# Profile & Avatar Updates
psql $DATABASE_URL -f database/schema-profile-updates.sql
```

### 5. **Google Sheets Integration**

#### **Step 1: Create Google Service Account**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or use existing one
3. Enable Google Sheets API
4. Create a Service Account
5. Generate and download JSON key file

#### **Step 2: Share Google Sheet**
1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1jRprM6lBFldJSUEaoBtDJ6H3r4NXYVaXtXSDgYI_G1Q
2. Share with the service account email
3. Give it "Editor" permissions

#### **Step 3: Update Environment Variables**
Add the service account JSON to `GOOGLE_SHEETS_CREDENTIALS` environment variable.

### 6. **Health Check & Monitoring**

Your deployed service will have these endpoints:

- **Health Check**: `https://your-app.onrender.com/api/health`
- **Detailed Health**: `https://your-app.onrender.com/api/health/detailed`
- **API Documentation**: Built into the endpoints

### 7. **Bot Integration**

#### **CerviBOT Integration**
Your bot can send data to these endpoints:

```bash
# Bot Webhook (no auth required)
POST https://your-app.onrender.com/api/bot-data/webhook

# Example payload:
{
  "eventType": "interaction",
  "userId": "user-uuid",
  "email": "user@example.com",
  "phone": "+1234567890",
  "botMessage": "What diet would you prefer?",
  "botResponse": "I prefer vegetarian diet",
  "intent": "diet_preference",
  "actionTaken": "profile_updated",
  "whatsappSent": true,
  "sessionId": "session-123",
  "messageType": "text"
}
```

#### **Bot Data Tracking**
```bash
# Track new user signup from bot
{
  "eventType": "signup",
  "userId": "user-uuid",
  "email": "user@example.com",
  "phone": "+1234567890"
}

# Track bot metrics
{
  "eventType": "metrics",
  "botMessage": "daily_interactions",
  "botResponse": "150",
  "intent": "count",
  "actionTaken": "{\"source\":\"cervibot\"}"
}
```

### 8. **Frontend Configuration**

Update your frontend to use the Render URL:

```javascript
// In your frontend JavaScript
const API_BASE_URL = 'https://your-app.onrender.com/api';

// Example API calls
fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

### 9. **Testing the Deployment**

#### **Test API Endpoints**
```bash
# Health check
curl https://your-app.onrender.com/api/health

# Test authentication
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test bot webhook
curl -X POST https://your-app.onrender.com/api/bot-data/webhook \
  -H "Content-Type: application/json" \
  -d '{"eventType":"interaction","userId":"test","botMessage":"Hello","botResponse":"Hi there"}'
```

#### **Test Google Sheets Sync**
1. Create a test user through your frontend
2. Check your Google Sheet for new entries
3. Verify data appears in both "User Logins" and "Bot Data" sheets

### 10. **Monitoring & Logs**

- **Render Logs**: Available in Render dashboard
- **Health Monitoring**: `/api/health` endpoint
- **Analytics**: `/api/analytics` (admin access required)
- **Bot Analytics**: `/api/bot-data/analytics` (admin access required)

### 11. **Troubleshooting**

#### **Common Issues**
1. **Database Connection**: Check `DATABASE_URL` format
2. **Google Sheets**: Verify service account permissions
3. **CORS Issues**: Update `ALLOWED_ORIGINS`
4. **Bot Webhook**: Check payload format

#### **Debug Commands**
```bash
# Check service logs in Render dashboard
# Test database connection
curl https://your-app.onrender.com/api/health/detailed

# Check Google Sheets sync
# Look for "✅ Google Sheets service initialized" in logs
```

### 12. **Security Checklist**

- [ ] JWT secret is strong (32+ characters)
- [ ] Database URL is secure
- [ ] CORS origins are properly set
- [ ] Rate limiting is enabled
- [ ] Admin emails are verified
- [ ] Google Sheets service account has minimal permissions

### 13. **Performance Optimization**

- [ ] Enable Redis caching (optional)
- [ ] Configure CDN for static assets
- [ ] Monitor response times
- [ ] Set up alerts for high error rates

---

## 🎯 **Next Steps**

1. **Deploy to Render** using the steps above
2. **Test all endpoints** to ensure functionality
3. **Connect CerviBOT** to the webhook endpoint
4. **Verify Google Sheets** integration is working
5. **Monitor performance** and set up alerts

Your CerviCare backend is now production-ready with:
- ✅ **Phase 4 Complete**: Analytics, avatars, security
- ✅ **Google Sheets Integration**: User data and bot tracking
- ✅ **Bot Data API**: Ready for CerviBOT integration
- ✅ **Production Hardening**: Security, monitoring, health checks
- ✅ **Scalable Architecture**: Ready for growth

**Deploy URL**: Will be provided by Render after deployment  
**Health Check**: `https://your-app.onrender.com/api/health`  
**Bot Webhook**: `https://your-app.onrender.com/api/bot-data/webhook`
