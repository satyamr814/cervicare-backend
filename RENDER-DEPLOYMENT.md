# Deploying CerviCare to Render

This guide explains how to deploy your CerviCare Phase 1 backend to Render.

## Prerequisites

- Render account (free tier works!) - [Sign up](https://render.com/)
- GitHub account (to connect your repository)
- Neon PostgreSQL database (already set up ✓)
- Google Sheets credentials JSON

---

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit - Phase 1 backend"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `cervicare-backend`)
3. Don't initialize with README (you already have one)

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/cervicare-backend.git
git branch -M main
git push -u origin main
```

---

## Step 2: Create Web Service on Render

### 2.1 Connect to Render

1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub account if not already connected
4. Select your `cervicare-backend` repository

### 2.2 Configure Web Service

Fill in these settings:

**Basic Settings**:
- **Name**: `cervicare-backend` (or your preferred name)
- **Region**: Choose closest to your users (e.g., Singapore for India)
- **Branch**: `main`
- **Root Directory**: Leave empty
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type**:
- Select **Free** (for testing) or **Starter** (for production)

---

## Step 3: Set Environment Variables

Click "Advanced" → "Add Environment Variable" and add these:

### Required Variables

```env
DATABASE_URL
postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

JWT_SECRET
<generate a strong random secret - see below>

PORT
3000

NODE_ENV
production

ALLOWED_ORIGINS
https://your-app.onrender.com,https://your-frontend-domain.com
```

### Generate Strong JWT Secret

Run this locally to generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as `JWT_SECRET`.

### Google Sheets Variables

**Option 1: File Upload (Recommended for Render)**

Since Render doesn't have persistent file storage, use inline JSON:

```env
GOOGLE_SHEETS_CREDENTIALS
{"type":"service_account","project_id":"cervicare-483419",...}
```

To get the inline JSON:
1. Open your credentials JSON file
2. Copy the entire contents
3. Paste as a single line in the environment variable

**Option 2: Secret File (Alternative)**

Render supports secret files:
1. Click "Add Secret File"
2. Filename: `google-credentials.json`
3. Contents: Paste your entire JSON file
4. Add environment variable:
   ```env
   GOOGLE_SHEETS_CREDENTIALS_PATH
   /etc/secrets/google-credentials.json
   ```

**Spreadsheet ID**:
```env
GOOGLE_SHEETS_SPREADSHEET_ID
1jRprM6lBFldJSUEaoBtDJ6H3r4NXYVaXtXSDgYI_G1Q
```

### Optional Variables (Phase 2+)

```env
ADMIN_KEY
<generate another random secret>

RATE_LIMIT_WINDOW_MS
900000

RATE_LIMIT_MAX_REQUESTS
100
```

---

## Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Run `npm install`
   - Start your server with `npm start`
3. Wait for deployment to complete (usually 2-3 minutes)

You'll see logs like:
```
==> Starting service with 'npm start'
🚀 CerviCare Backend Server is running on port 3000
✅ Connected to PostgreSQL database
✅ Google Sheets service initialized
```

---

## Step 5: Initialize Database

Your Neon database needs the schema and sample content.

### 5.1 Connect to Neon

```bash
psql "postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 5.2 Run Schema

```bash
psql "postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f database/schema.sql
```

### 5.3 Load Sample Content

```bash
psql "postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f database/sample-content.sql
```

**Note**: You only need to do this once! The database persists across deployments.

---

## Step 6: Test Your Deployment

### 6.1 Get Your URL

Render will give you a URL like: `https://cervicare-backend.onrender.com`

### 6.2 Health Check

```bash
curl https://cervicare-backend.onrender.com/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2026-01-06T17:22:00.000Z"
}
```

### 6.3 Test Signup

```bash
curl -X POST https://cervicare-backend.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@cervicare.com","password":"Test123!@#"}'
```

### 6.4 Test Full Flow

1. Signup → Get token
2. Create profile with token
3. Get diet plan
4. Get protection plan
5. Check Google Sheets for synced data

---

## Step 7: Update Frontend

Update your frontend to use the Render URL:

### In your frontend code:

```javascript
// Old (local development)
const API_URL = 'http://localhost:3000';

// New (production)
const API_URL = 'https://cervicare-backend.onrender.com';

// Better (environment-based)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
```

### Update CORS

Make sure your frontend domain is in `ALLOWED_ORIGINS`:

```env
ALLOWED_ORIGINS=https://cervicare-backend.onrender.com,https://your-frontend.com
```

---

## Step 8: Custom Domain (Optional)

### 8.1 Add Custom Domain in Render

1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain (e.g., `api.cervicare.com`)

### 8.2 Update DNS

Add a CNAME record in your DNS provider:

```
Type: CNAME
Name: api
Value: cervicare-backend.onrender.com
```

### 8.3 Update Environment Variables

Update `ALLOWED_ORIGINS` to include your custom domain:

```env
ALLOWED_ORIGINS=https://api.cervicare.com,https://cervicare.com
```

---

## Monitoring & Maintenance

### View Logs

1. Go to your service in Render dashboard
2. Click "Logs" tab
3. See real-time server logs

### Auto-Deploy on Git Push

Render automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "Update backend"
git push
```

Render will detect the push and redeploy automatically!

### Health Monitoring

Render automatically monitors your service:
- Restarts if it crashes
- Shows uptime statistics
- Sends alerts (configure in settings)

### Database Backups

Neon automatically backs up your database:
- Point-in-time recovery
- Manage in Neon dashboard

---

## Troubleshooting

### Issue: Build Failed

**Check**:
1. `package.json` has correct dependencies
2. `npm install` works locally
3. Check build logs in Render

### Issue: Service Won't Start

**Check**:
1. `npm start` works locally
2. `PORT` environment variable is set
3. Check runtime logs in Render

### Issue: Database Connection Failed

**Check**:
1. `DATABASE_URL` is correct
2. Neon database is active
3. SSL mode is set to `require`

### Issue: Google Sheets Not Syncing

**Check**:
1. Credentials are correctly set (inline JSON or secret file)
2. Service account has access to spreadsheet
3. Spreadsheet ID is correct
4. Check logs for specific errors

### Issue: CORS Errors

**Check**:
1. Frontend domain is in `ALLOWED_ORIGINS`
2. Format: `https://domain.com` (no trailing slash)
3. Redeploy after changing environment variables

---

## Performance Optimization

### Free Tier Limitations

Render free tier:
- Spins down after 15 minutes of inactivity
- Takes ~30 seconds to wake up on first request
- 750 hours/month free

### Upgrade to Starter ($7/month)

Benefits:
- Always on (no spin down)
- Faster performance
- More memory and CPU

### Database Optimization

1. **Indexes**: Already added in `schema.sql`
2. **Connection Pooling**: Already configured in `database.js`
3. **Query Optimization**: Use EXPLAIN ANALYZE for slow queries

---

## Security Checklist

Before going live:

- [ ] Strong `JWT_SECRET` (32+ random characters)
- [ ] Strong `ADMIN_KEY` (32+ random characters)
- [ ] `NODE_ENV=production`
- [ ] `ALLOWED_ORIGINS` set to your domains only
- [ ] Database credentials not in code
- [ ] Google Sheets credentials secure
- [ ] HTTPS enabled (Render does this automatically)
- [ ] Rate limiting enabled (already configured)
- [ ] Helmet security headers enabled (already configured)

---

## Cost Breakdown

### Free Tier (Good for Testing)

- **Render Web Service**: Free (with limitations)
- **Neon PostgreSQL**: Free tier (0.5 GB storage, 1 compute hour)
- **Google Sheets**: Free
- **Total**: $0/month

### Production Tier (Recommended)

- **Render Starter**: $7/month (always on, better performance)
- **Neon Scale**: $19/month (more storage, better performance)
- **Google Sheets**: Free
- **Total**: $26/month

### Enterprise Tier

- **Render Pro**: $25/month
- **Neon Pro**: $69/month
- **Total**: $94/month

---

## Scaling Considerations

### When to Scale

Scale when you have:
- 1000+ active users
- Slow response times
- Database connection issues
- Frequent service restarts

### How to Scale

1. **Vertical Scaling**: Upgrade Render instance type
2. **Database Scaling**: Upgrade Neon plan
3. **Horizontal Scaling**: Add more Render instances (Pro plan)
4. **Caching**: Add Redis for frequently accessed data
5. **CDN**: Use Cloudflare for static assets

---

## Backup & Recovery

### Database Backups

Neon provides automatic backups:
1. Go to Neon dashboard
2. Select your database
3. Click "Backups"
4. Restore to any point in time

### Code Backups

Your code is backed up in GitHub:
- Commit regularly
- Use branches for features
- Tag releases

### Environment Variables

Keep a secure backup of your `.env` file:
- Store in password manager
- Don't commit to Git
- Document all variables

---

## Next Steps

After successful deployment:

1. **Test thoroughly** - All endpoints, edge cases
2. **Monitor logs** - Watch for errors
3. **Set up alerts** - Render can email you on failures
4. **Update frontend** - Point to production API
5. **Test with real users** - Get feedback
6. **Monitor Google Sheets** - Verify data sync
7. **Plan Phase 2** - When ready for advanced features

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Google Sheets API**: https://developers.google.com/sheets/api
- **Your API Docs**: [API-DOCUMENTATION.md](API-DOCUMENTATION.md)
- **Setup Guide**: [PHASE1-SETUP.md](PHASE1-SETUP.md)

---

## Deployment Checklist

Before deploying:

- [ ] Code tested locally
- [ ] Database schema applied
- [ ] Sample content loaded
- [ ] Environment variables documented
- [ ] `.gitignore` includes `.env`
- [ ] README updated
- [ ] API documentation complete

After deploying:

- [ ] Health check passes
- [ ] Signup/login works
- [ ] Profile creation works
- [ ] Diet plan returns data
- [ ] Protection plan returns data
- [ ] Google Sheets syncs
- [ ] Frontend connects successfully
- [ ] CORS configured correctly
- [ ] SSL certificate active
- [ ] Monitoring set up

---

## Congratulations! 🎉

Your CerviCare backend is now live on Render!

**Your Production URLs**:
- API: `https://cervicare-backend.onrender.com`
- Health: `https://cervicare-backend.onrender.com/api/health`
- Docs: `https://cervicare-backend.onrender.com/api/docs` (if you add Swagger)

**Next**: Connect your frontend and start serving users!
