# Instant Deployment on Render - Quick Guide

## 🚀 One-Click Deployment

Your repository now includes `render.yaml` for instant deployment on Render!

### Step 1: Deploy from Blueprint

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account if not already connected
4. Select repository: `satyamr814/cervicare-backend`
5. Click **"Apply"**

Render will automatically:
- ✅ Create PostgreSQL database
- ✅ Create web service
- ✅ Link DATABASE_URL automatically
- ✅ Set up build and start commands

### Step 2: Set JWT_SECRET

After deployment starts:

1. Go to your **Web Service** (cervicare-backend)
2. Click **"Environment"** tab
3. Find `JWT_SECRET` variable
4. Click **"Generate"** or set manually:
   ```bash
   # Generate a secure secret:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
5. Paste the generated value
6. Click **"Save Changes"**

### Step 3: Apply Database Schema

The schema will be automatically applied on first server start via `seederService`.

**OR** manually apply it:

1. Go to your **PostgreSQL** service (cervicare-database)
2. Click **"Connect"** → **"Shell"**
3. Run:
   ```bash
   psql < database/schema.sql
   ```

### Step 4: Verify Deployment

1. Check **Logs** tab in your web service
2. Look for:
   ```
   ✅ Connected to PostgreSQL database
   🚀 CerviCare Backend Server is running on port 10000
   🌍 Environment: production
   ```

3. Test the API:
   ```bash
   curl https://your-app.onrender.com/api/health
   ```

### Step 5: Test Authentication

**Signup:**
```bash
curl -X POST https://your-app.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

**Login:**
```bash
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

## 📋 Post-Deployment Checklist

- [ ] Web service deployed successfully
- [ ] PostgreSQL database created
- [ ] JWT_SECRET set (32+ characters)
- [ ] Database schema applied (or auto-applied)
- [ ] Health check endpoint responds
- [ ] Signup works
- [ ] Login works
- [ ] Login persists after redeploy

## 🔧 Manual Deployment (Alternative)

If you prefer manual setup:

1. **Create PostgreSQL Database:**
   - New → PostgreSQL
   - Name: `cervicare-database`
   - Plan: Free (or paid for production)

2. **Create Web Service:**
   - New → Web Service
   - Connect GitHub repo: `satyamr814/cervicare-backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `DATABASE_URL`: (Copy from PostgreSQL Internal Database URL)
     - `JWT_SECRET`: (Generate 32+ character string)
     - `NODE_ENV`: `production`

3. **Deploy**

## 🐛 Troubleshooting

### "Database is not reachable"
- Check `DATABASE_URL` uses **Internal Database URL** (not External)
- Verify PostgreSQL service is running

### "JWT_SECRET is too weak"
- Generate new secret with 32+ characters
- Update in Environment tab

### "Invalid credentials" after deployment
- Verify database schema is applied
- Check users exist: `SELECT email FROM users;`
- Ensure password hashes are correct (start with `$2a$` or `$2b$`)

## 📚 Additional Documentation

- `RENDER-DEPLOYMENT-FIX.md` - Detailed deployment guide
- `ENVIRONMENT-VARIABLES.md` - Environment variable reference
- `AUTHENTICATION-FIX-SUMMARY.md` - Complete fix documentation

## 🎉 Success!

Once deployed, your authentication system will:
- ✅ Work consistently across redeploys
- ✅ Store data in persistent PostgreSQL
- ✅ Use proper bcrypt password hashing
- ✅ Generate secure JWT tokens

Your app URL will be: `https://cervicare-backend.onrender.com` (or your custom domain)
