# CerviCare Phase 3 - Deployment Guide

## 🚀 Complete Deployment Instructions

### A) GitHub Repository Setup

#### Folder Structure
```
cervicare-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── jwt.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── personalizationController.js
│   │   ├── adminController.js
│   │   └── webhookController.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── UserProfile.js
│   │   ├── DietContent.js
│   │   ├── ProtectionPlanContent.js
│   │   ├── AdminUser.js
│   │   └── ContentAuditLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── profile.js
│   │   ├── personalization.js
│   │   ├── admin.js
│   │   └── webhook.js
│   ├── services/
│   │   ├── googleSheetsService.js
│   │   ├── webhookService.js
│   │   ├── sheetsSyncService.js
│   │   └── automationService.js
│   └── server.js
├── database/
│   ├── schema.sql
│   └── schema-phase2-updates.sql
├── docs/
│   ├── README-BACKEND.md
│   ├── PHASE2-ARCHITECTURE.md
│   ├── google-sheets-schema.md
│   └── n8n-workflow-design.md
├── .env.example
├── .env-phase2.example
├── package.json
├── package-backend.json
├── package-backend-phase2.json
├── README.md
└── deployment-guide.md
```

#### .gitignore
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Google Sheets credentials
google-credentials.json

# Database backups
*.sql.backup
*.dump
```

#### GitHub Actions Workflow (Optional)
**File:** `.github/workflows/deploy.yml`
```yaml
name: Deploy to Render

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - name: Deploy to Render
      run: |
        curl -X POST "https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/deploys" \
          -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
          -H "Content-Type: application/json"
```

### B) Render Deployment Setup

#### Step 1: Create Render Account
1. Sign up at [render.com](https://render.com)
2. Choose the "Free" or "Pro" tier based on your needs
3. Connect your GitHub repository

#### Step 2: Create Web Service
1. Click "New" → "Web Service"
2. Select your GitHub repository
3. Configure the service:

**Service Configuration:**
- **Name:** `cervicare-backend`
- **Environment:** `Node`
- **Region:** Choose nearest to your users
- **Branch:** `main`
- **Root Directory:** `.` (leave empty)

**Build Command:**
```bash
npm install --production
```

**Start Command:**
```bash
npm start
```

**Instance Type:**
- **Free:** $0/month (limited to 750 hours/month)
- **Starter:** $7/month (always on)
- **Standard:** $25/month (better performance)

#### Step 3: Environment Variables
Set these in Render Dashboard → Environment:

**Required Variables:**
```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
PORT=3000
NODE_ENV=production
```

**Phase 2 Variables:**
```env
ADMIN_KEY=your-admin-secret-key
ADMIN_EMAILS=admin@cervicare.com,superadmin@cervicare.com
```

**Phase 3 Variables:**
```env
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/cervicare
```

**Optional Variables:**
```env
ALLOWED_ORIGINS=https://your-frontend.com,https://www.your-frontend.com
WEBHOOK_TIMEOUT=10000
GOOGLE_SHEETS_ENABLED=true
N8N_WEBHOOK_ENABLED=true
```

#### Step 4: Database Setup
1. Go to Render Dashboard → "New" → "PostgreSQL"
2. Configure database:
   - **Name:** `cervicare-db`
   - **Database Name:** `cervicare_db`
   - **User:** `cervicare_user`
3. Note the connection string from Render
4. Update `DATABASE_URL` in your web service environment

#### Step 5: Run Database Migrations
1. Connect to your PostgreSQL database using pgAdmin or psql
2. Run the schema files in order:
   ```bash
   # First, Phase 1 schema
   psql -d cervicare_db -f database/schema.sql
   
   # Then, Phase 2 updates
   psql -d cervicare_db -f database/schema-phase2-updates.sql
   ```

#### Step 6: Health Check Configuration
Render automatically uses `/api/health` endpoint. Ensure it returns:
```json
{
  "success": true,
  "message": "CerviCare Backend API is running",
  "timestamp": "2024-01-05T10:00:00Z",
  "environment": "production"
}
```

### C) Production Checklist

#### Pre-Deployment Testing
**Manual Testing Checklist:**
- [ ] User signup works correctly
- [ ] JWT authentication functions
- [ ] Profile creation and updates
- [ ] Diet plan generation
- [ ] Protection plan access
- [ ] Admin content management
- [ ] Webhook triggers fire correctly
- [ ] Google Sheets sync works
- [ ] Error handling is graceful
- [ ] Rate limiting is active

**Automated Testing:**
```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Run security tests
npm audit
```

#### Security Checklist
**Environment Security:**
- [ ] All secrets are in environment variables
- [ ] No hardcoded credentials in code
- [ ] JWT secret is strong (32+ characters)
- [ ] Database password is complex
- [ ] Admin keys are not default values

**API Security:**
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is active
- [ ] SQL injection protection is working
- [ ] XSS protection is enabled

#### Performance Checklist
**Database Performance:**
- [ ] Database indexes are created
- [ ] Connection pooling is configured
- [ ] Slow queries are identified and optimized
- [ ] Database size is monitored

**Application Performance:**
- [ ] Response times are under 2 seconds
- [ ] Memory usage is within limits
- [ ] CPU usage is reasonable
- [ ] Error rates are low (<1%)

#### Monitoring Setup
**Application Monitoring:**
```javascript
// Add to server.js
const monitoring = {
  startTime: new Date(),
  requests: 0,
  errors: 0
};

app.use((req, res, next) => {
  monitoring.requests++;
  next();
});
```

**Health Endpoints:**
- `/api/health` - Basic health check
- `/api/webhook/status` - Webhook and Sheets status
- `/api/admin/stats` - System statistics (admin only)

**Error Logging:**
```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error('Production Error:', {
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});
```

#### Production Optimizations
**Node.js Optimizations:**
```bash
# Set Node environment
export NODE_ENV=production

# Increase memory limit if needed
export NODE_OPTIONS="--max-old-space-size=2048"

# Enable cluster mode for scaling
export PM2_INSTANCES=4
```

**Database Optimizations:**
```sql
-- Add production indexes
CREATE INDEX CONCURRENTLY idx_users_email_fast ON users(email);
CREATE INDEX CONCURRENTLY idx_profiles_user_id_fast ON user_profiles(user_id);
CREATE INDEX CONCURRENTLY idx_actions_timestamp_fast ON webhook_logs(created_at);

-- Set up connection pooling
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
```

#### Disable in Production
**Development Features:**
- [ ] Detailed error messages in responses
- [ ] Debug console logs
- [ ] Development middleware
- [ ] Test endpoints
- [ ] Database query logging

**Unsafe Features:**
- [ ] Admin key authentication (use proper JWT)
- [ ] Direct database access
- [ ] File system access
- [ ] System command execution

#### Enable in Production
**Security Features:**
- [ ] HTTPS enforcement
- [ ] Security headers (Helmet.js)
- [ ] Request rate limiting
- [ ] Input sanitization
- [ ] SQL parameterization

**Monitoring Features:**
- [ ] Application logging
- [ ] Performance monitoring
- [ ] Error tracking
- [ ] Health checks
- [ ] Metrics collection

### D) Post-Deployment Verification

#### API Testing Commands
```bash
# Test health endpoint
curl https://your-app.onrender.com/api/health

# Test user signup
curl -X POST https://your-app.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'

# Test authentication
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'

# Test protected endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-app.onrender.com/api/profile
```

#### Monitoring Setup
**Render Dashboard Monitoring:**
- Check service logs
- Monitor response times
- Watch error rates
- Track resource usage

**External Monitoring (Optional):**
- Uptime monitoring (UptimeRobot, Pingdom)
- Performance monitoring (New Relic, DataDog)
- Error tracking (Sentry)

#### Backup Strategy
**Database Backups:**
```bash
# Daily backups via Render
# Configure in PostgreSQL service settings

# Manual backup command
pg_dump cervicare_db > backup_$(date +%Y%m%d).sql
```

**Code Backups:**
- GitHub repository serves as code backup
- Tag releases for major versions
- Keep documentation up to date

### E) Troubleshooting Common Issues

#### Common Deployment Issues
**1. Database Connection Failed**
```bash
# Check DATABASE_URL format
# Should be: postgresql://user:password@host:5432/database

# Test connection locally
psql $DATABASE_URL
```

**2. Environment Variables Missing**
```bash
# Verify all required variables are set
# Check Render Dashboard → Environment
# Restart service after adding variables
```

**3. Build Failures**
```bash
# Check package.json scripts
# Verify all dependencies are installable
# Check Node.js version compatibility
```

**4. Runtime Errors**
```bash
# Check Render service logs
# Look for database connection issues
# Verify JWT secret is set
```

#### Performance Issues
**1. Slow Response Times**
- Check database indexes
- Monitor resource usage
- Review query performance
- Consider scaling up instance

**2. Memory Leaks**
- Monitor memory usage over time
- Check for unhandled promises
- Review third-party library usage
- Implement proper cleanup

**3. High Error Rates**
- Review error logs
- Check external service dependencies
- Verify input validation
- Test edge cases

This deployment guide ensures a smooth, secure, and scalable production deployment of the CerviCare platform.
