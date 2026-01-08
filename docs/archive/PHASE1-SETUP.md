# CerviCare Phase 1 - Setup Guide

This guide will help you set up the CerviCare backend from scratch.

## Prerequisites

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Neon PostgreSQL** account - Already set up ✓
- **Google Cloud** service account - Already set up ✓
- **Git** (optional, for version control)

---

## Step 1: Environment Setup

### 1.1 Copy Environment Configuration

Run the setup script to create your `.env` file:

```bash
setup-phase1.bat
```

Or manually copy the template:

```bash
copy .env.phase1 .env
```

### 1.2 Verify Environment Variables

Open `.env` and verify these values:

```env
# Database - Your Neon PostgreSQL connection
DATABASE_URL=postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# JWT Secret - Change this in production!
JWT_SECRET=cervicare_super_secure_jwt_secret_key_change_in_production_2026

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS_PATH=C:\Users\Satyam Raj\Downloads\cervicare-483419-7db20b7230c0.json
GOOGLE_SHEETS_SPREADSHEET_ID=1jRprM6lBFldJSUEaoBtDJ6H3r4NXYVaXtXSDgYI_G1Q

# Server
PORT=3000
NODE_ENV=development
```

---

## Step 2: Install Dependencies

Install all required Node.js packages:

```bash
npm install
```

This will install:
- `express` - Web framework
- `pg` - PostgreSQL client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `dotenv` - Environment variables
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers
- `google-spreadsheet` - Google Sheets integration
- And more...

---

## Step 3: Database Setup

### 3.1 Connect to Neon Database

Test your connection using psql:

```bash
psql "postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

You should see:
```
psql (XX.X)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
Type "help" for help.

neondb=>
```

### 3.2 Initialize Database Schema

Run the schema creation script:

```bash
psql "postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f database/schema.sql
```

This creates:
- `users` table
- `user_profiles` table
- `diet_content` table
- `protection_plan_content` table
- Indexes for performance
- Triggers for auto-updating timestamps

### 3.3 Load Sample Content

Add expert-curated content to your database:

```bash
psql "postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f database/sample-content.sql
```

This adds:
- 70+ diet recommendations (veg, nonveg, vegan)
- 60+ protection plan items (low, moderate, higher_attention risk bands)
- Covering multiple regions and budget levels

### 3.4 Verify Database Setup

Check that tables were created:

```sql
\dt
```

You should see:
```
                  List of relations
 Schema |           Name            | Type  |    Owner
--------+---------------------------+-------+-------------
 public | diet_content              | table | neondb_owner
 public | protection_plan_content   | table | neondb_owner
 public | user_profiles             | table | neondb_owner
 public | users                     | table | neondb_owner
```

Check content counts:

```sql
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'Diet Content', COUNT(*) FROM diet_content
UNION ALL
SELECT 'Protection Plans', COUNT(*) FROM protection_plan_content;
```

---

## Step 4: Google Sheets Setup

### 4.1 Verify Credentials File

Make sure your Google Sheets credentials JSON file exists:

```bash
dir "C:\Users\Satyam Raj\Downloads\cervicare-483419-7db20b7230c0.json"
```

### 4.2 Share Spreadsheet with Service Account

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1jRprM6lBFldJSUEaoBtDJ6H3r4NXYVaXtXSDgYI_G1Q/edit

2. Click "Share" button

3. Add the service account email from your JSON file (looks like: `cervicare@cervicare-483419.iam.gserviceaccount.com`)

4. Give it "Editor" permissions

5. Click "Send"

### 4.3 Prepare Sheet Structure

The backend will automatically create these sheets when needed:
- `User Logins` - User signup tracking
- `Profile Updates` - Profile changes
- `Diet Plans` - Diet plan access logs
- `Protection Plans` - Protection plan access logs

You don't need to create them manually!

---

## Step 5: Start the Server

### 5.1 Development Mode (with auto-reload)

```bash
npm run dev
```

You should see:

```
🚀 CerviCare Backend Server is running on port 3000
📊 Health check: http://localhost:3000/api/health
🔐 Auth endpoints: http://localhost:3000/api/auth
👤 Profile endpoints: http://localhost:3000/api/profile
🎯 Personalization endpoints: http://localhost:3000/api
🌍 Environment: development
✅ Connected to PostgreSQL database
✅ Google Sheets service initialized
```

### 5.2 Production Mode

```bash
npm start
```

---

## Step 6: Test the API

### 6.1 Health Check

Test that the server is running:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2026-01-06T17:22:00.000Z"
}
```

### 6.2 Test Signup

Create a test user:

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@cervicare.com\",\"password\":\"Test123!@#\"}"
```

Expected response:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "test@cervicare.com",
      "created_at": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the token!** You'll need it for authenticated requests.

### 6.3 Test Profile Creation

Replace `YOUR_TOKEN` with the token from signup:

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"age\":28,\"gender\":\"female\",\"city\":\"Delhi\",\"diet_type\":\"veg\",\"budget_level\":\"medium\",\"lifestyle\":\"moderately_active\"}"
```

### 6.4 Test Diet Plan

```bash
curl -X GET http://localhost:3000/api/diet-plan \
  -H "Authorization: Bearer YOUR_TOKEN"
```

You should get personalized diet recommendations!

### 6.5 Test Protection Plan

```bash
curl -X GET http://localhost:3000/api/protection-plan \
  -H "Authorization: Bearer YOUR_TOKEN"
```

You should get a personalized protection plan!

### 6.6 Verify Google Sheets Sync

1. Open your Google Sheet
2. Check for new sheets: `User Logins`, `Profile Updates`, `Diet Plans`, `Protection Plans`
3. Verify your test data appears in these sheets

---

## Step 7: Frontend Integration

Your existing frontend should work without changes!

### 7.1 Update Frontend API Calls (if needed)

If your frontend uses different endpoints, update them to:

- Signup: `POST /api/auth/signup`
- Login: `POST /api/auth/login`
- Get Profile: `GET /api/profile`
- Save Profile: `POST /api/profile`
- Diet Plan: `GET /api/diet-plan`
- Protection Plan: `GET /api/protection-plan`

### 7.2 Test Frontend

1. Open `http://localhost:3000` in your browser
2. Test signup/login flow
3. Test profile creation
4. Verify everything works!

---

## Troubleshooting

### Issue: Database Connection Failed

**Error**: `Database is not reachable`

**Solution**:
1. Check your `DATABASE_URL` in `.env`
2. Verify Neon database is active (check Neon dashboard)
3. Test connection with psql command

### Issue: Google Sheets Not Syncing

**Error**: `Failed to initialize Google Sheets service`

**Solution**:
1. Verify credentials file path in `.env`
2. Check that service account has access to the spreadsheet
3. Make sure spreadsheet ID is correct

### Issue: JWT Token Invalid

**Error**: `Invalid token`

**Solution**:
1. Make sure you're including the token in Authorization header
2. Format: `Authorization: Bearer YOUR_TOKEN`
3. Check that `JWT_SECRET` is set in `.env`

### Issue: Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
1. Change `PORT` in `.env` to a different port (e.g., 3001)
2. Or stop the process using port 3000:
   ```bash
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

### Issue: No Diet Recommendations Found

**Solution**:
1. Make sure you ran `database/sample-content.sql`
2. Check that your profile has valid `diet_type`, `budget_level`, and `city`
3. The system will fall back to general recommendations if no exact match

---

## Next Steps

### Add More Curated Content

Edit `database/sample-content.sql` and add more:
- Diet recommendations for different regions
- Protection plan content for different risk bands
- Then reload: `psql "YOUR_DATABASE_URL" -f database/sample-content.sql`

### Monitor Google Sheets

Your Google Sheet will automatically track:
- User signups
- Profile updates
- Diet plan accesses
- Protection plan accesses

This gives you a real-time dashboard without building one!

### Deploy to Render

See [RENDER-DEPLOYMENT.md](RENDER-DEPLOYMENT.md) for deployment instructions.

---

## File Structure

```
cervicare-backend/
├── database/
│   ├── schema.sql              # Database schema
│   └── sample-content.sql      # Curated content
├── src/
│   ├── config/
│   │   ├── database.js         # PostgreSQL connection
│   │   ├── jwt.js              # JWT configuration
│   │   └── googleSheets.js     # Google Sheets config
│   ├── controllers/
│   │   ├── authController.js   # Auth logic
│   │   ├── profileController.js # Profile logic
│   │   └── personalizationController.js # Personalization logic
│   ├── models/
│   │   ├── User.js             # User model
│   │   ├── UserProfile.js      # Profile model
│   │   ├── DietContent.js      # Diet content model
│   │   └── ProtectionPlanContent.js # Protection plan model
│   ├── routes/
│   │   ├── auth.js             # Auth routes
│   │   ├── profile.js          # Profile routes
│   │   └── personalization.js  # Personalization routes
│   ├── middlewares/
│   │   └── auth.js             # JWT verification
│   ├── services/
│   │   └── googleSheetsService.js # Sheets sync service
│   └── server.js               # Main server file
├── .env                        # Environment variables (create this)
├── .env.phase1                 # Environment template
├── package.json                # Dependencies
├── API-DOCUMENTATION.md        # API reference
├── PHASE1-SETUP.md            # This file
└── README.md                   # Project overview
```

---

## Support

Need help? Check:
- [API Documentation](API-DOCUMENTATION.md)
- [README](README.md)
- Your Neon dashboard: https://console.neon.tech/
- Your Google Cloud console: https://console.cloud.google.com/

---

## Security Notes

### Before Production:

1. **Change JWT_SECRET** to a strong random value:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Update ALLOWED_ORIGINS** to your production domain

3. **Never commit `.env`** to version control (already in `.gitignore`)

4. **Use environment variables** in Render for sensitive data

5. **Enable HTTPS** (Render does this automatically)

---

## What's Next?

You now have a fully functional Phase 1 backend! 🎉

**Phase 1 Complete**:
- ✅ Authentication with JWT
- ✅ User profiles
- ✅ Curated content storage
- ✅ Rule-based personalization
- ✅ Google Sheets integration
- ✅ Neon PostgreSQL database

**Future Phases** (already in your codebase):
- Phase 2: WhatsApp integration, n8n automation
- Phase 3: Analytics, admin dashboard
- Phase 4: Production hardening, monitoring

Focus on Phase 1 first, then gradually enable Phase 2+ features when ready!
