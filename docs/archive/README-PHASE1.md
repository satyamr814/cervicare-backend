# CerviCare Backend - Phase 1

A production-ready backend for CerviCare's preventive healthcare platform, built with Node.js, Express, PostgreSQL (Neon), and Google Sheets integration.

## 🎯 Phase 1 Features

### ✅ Core Functionality
- **Authentication**: Secure signup/login with JWT tokens
- **User Profiles**: Demographic and lifestyle data (age, gender, city, diet, budget, lifestyle)
- **Curated Content**: Expert-curated diet recommendations and protection plans
- **Rule-Based Personalization**: Deterministic, explainable recommendations (NO AI)
- **Google Sheets Integration**: Real-time data sync to spreadsheet (secondary database)
- **Neon PostgreSQL**: Cloud-hosted, scalable database

### 🔒 Security
- Password hashing with bcryptjs
- JWT authentication
- Rate limiting
- CORS protection
- Helmet security headers
- Environment-based configuration

### 📊 Data Management
- 70+ curated diet recommendations (veg, nonveg, vegan)
- 60+ protection plan items (low, moderate, higher_attention risk bands)
- Automatic Google Sheets sync for analytics
- PostgreSQL for primary data storage

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ ([Download](https://nodejs.org/))
- Neon PostgreSQL account (free tier works)
- Google Cloud service account (for Sheets integration)

### 1. Clone & Install

```bash
cd "c:\Users\Satyam Raj\Desktop\samarth web\cervicare final website 2 latest\cervicare final website 2"
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
copy .env.phase1 .env

# Or run setup script
setup-phase1.bat
```

Edit `.env` with your credentials (already configured for your Neon database).

### 3. Initialize Database

```bash
# Connect to Neon and run schema
psql "postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f database/schema.sql

# Load sample content
psql "postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f database/sample-content.sql
```

### 4. Test Setup

```bash
npm run test:setup
```

You should see:
```
✅ Database connected successfully
✅ Found 4 tables
✅ Phase 1 Setup Complete!
```

### 5. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`

---

## 📚 Documentation

- **[API Documentation](API-DOCUMENTATION.md)** - Complete API reference with examples
- **[Setup Guide](PHASE1-SETUP.md)** - Detailed setup instructions
- **[Render Deployment](RENDER-DEPLOYMENT.md)** - Deploy to production

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login

### User Profile
- `GET /api/profile` - Get profile (requires auth)
- `POST /api/profile` - Create/update profile (requires auth)

### Personalization
- `GET /api/diet-plan` - Get personalized diet plan (requires auth)
- `GET /api/protection-plan` - Get personalized protection plan (requires auth)

### Health Check
- `GET /api/health` - Server health status

---

## 🧪 Testing

### Test Setup
```bash
npm run test:setup
```

### Test API with cURL

**Signup**:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123!@#\"}"
```

**Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123!@#\"}"
```

**Create Profile** (replace YOUR_TOKEN):
```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"age\":28,\"gender\":\"female\",\"city\":\"Delhi\",\"diet_type\":\"veg\",\"budget_level\":\"medium\",\"lifestyle\":\"moderately_active\"}"
```

**Get Diet Plan**:
```bash
curl -X GET http://localhost:3000/api/diet-plan \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🗂️ Project Structure

```
cervicare-backend/
├── database/
│   ├── schema.sql              # Database schema
│   └── sample-content.sql      # Curated content (70+ items)
├── src/
│   ├── config/
│   │   ├── database.js         # PostgreSQL connection
│   │   ├── jwt.js              # JWT configuration
│   │   └── googleSheets.js     # Google Sheets config
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── profileController.js # Profile management
│   │   └── personalizationController.js # Personalization
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
│   │   ├── auth.js             # JWT verification
│   │   ├── security.js         # Security middleware
│   │   └── ...                 # Other middleware
│   ├── services/
│   │   └── googleSheetsService.js # Sheets sync service
│   └── server.js               # Main server file
├── .env                        # Environment variables (create this)
├── .env.phase1                 # Environment template
├── package.json                # Dependencies
├── test-setup.js               # Setup verification script
├── API-DOCUMENTATION.md        # API reference
├── PHASE1-SETUP.md            # Setup guide
├── RENDER-DEPLOYMENT.md       # Deployment guide
└── README.md                   # This file
```

---

## 🌐 Environment Variables

### Required

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
NODE_ENV=development
```

### Optional (Google Sheets)

```env
GOOGLE_SHEETS_CREDENTIALS_PATH=path/to/credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
```

### Optional (Phase 2+)

```env
ADMIN_KEY=your-admin-key
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📊 Database Schema

### Tables

1. **users** - User accounts (email, password_hash)
2. **user_profiles** - User profiles (age, gender, city, diet, budget, lifestyle)
3. **diet_content** - Curated diet recommendations
4. **protection_plan_content** - Curated protection plans

### Relationships

- `user_profiles.user_id` → `users.id` (one-to-one)
- All tables have UUID primary keys
- Automatic timestamp tracking (created_at, updated_at)

---

## 🎯 Rule-Based Personalization

### Diet Plan Logic

1. Match user's `diet_type`, `budget_level`, and `city`
2. If no match, try `diet_type` + `budget_level` + region='general'
3. If still no match, return general recommendations for `diet_type`
4. All content is pre-curated, NOT AI-generated

### Protection Plan Logic

Risk band assignment (lifestyle-based, NOT medical diagnosis):
- **Low**: Age < 40 and active lifestyle
- **Moderate**: Age >= 40
- **Higher Attention**: Age >= 50 OR sedentary lifestyle

Returns curated content for assigned risk band.

**Disclaimer**: This is preventive guidance only, not medical advice.

---

## 🔐 Security Best Practices

### Before Production

1. **Generate strong JWT_SECRET**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Update ALLOWED_ORIGINS** to your production domain

3. **Never commit .env** (already in .gitignore)

4. **Use HTTPS** (Render provides this automatically)

5. **Enable rate limiting** (already configured)

---

## 🚀 Deployment

### Deploy to Render

See [RENDER-DEPLOYMENT.md](RENDER-DEPLOYMENT.md) for complete instructions.

**Quick Steps**:
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables
4. Deploy!

Your API will be live at: `https://your-app.onrender.com`

---

## 📈 Monitoring

### Google Sheets Dashboard

Your Google Sheet automatically tracks:
- User signups
- Profile updates
- Diet plan accesses
- Protection plan accesses

This gives you real-time analytics without building a dashboard!

### Logs

**Local**: Check console output

**Render**: View logs in Render dashboard

---

## 🔄 Future Phases

Your codebase already includes Phase 2+ features (preserved for future use):

### Phase 2 (Coming Soon)
- WhatsApp integration
- n8n automation workflows
- Webhook notifications

### Phase 3 (Coming Soon)
- Analytics dashboard
- Admin panel
- User management

### Phase 4 (Coming Soon)
- Production monitoring
- Performance optimization
- Advanced security

**Current Focus**: Phase 1 foundation must work perfectly first!

---

## 🐛 Troubleshooting

### Database Connection Failed

```
❌ Database is not reachable
```

**Fix**:
1. Check `DATABASE_URL` in `.env`
2. Verify Neon database is active
3. Run: `psql "YOUR_DB_URL" -f database/schema.sql`

### Google Sheets Not Syncing

```
⚠️ Google Sheets not configured
```

**Fix**:
1. Set `GOOGLE_SHEETS_CREDENTIALS_PATH` in `.env`
2. Set `GOOGLE_SHEETS_SPREADSHEET_ID` in `.env`
3. Share spreadsheet with service account email

### Port Already in Use

```
❌ Port 3000 is already in use
```

**Fix**:
```bash
# Change port in .env
PORT=3001

# Or kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### No Recommendations Found

**Fix**:
1. Run: `psql "YOUR_DB_URL" -f database/sample-content.sql`
2. Verify profile has valid values
3. Check database: `SELECT COUNT(*) FROM diet_content;`

---

## 📞 Support

- **Documentation**: See `API-DOCUMENTATION.md` and `PHASE1-SETUP.md`
- **Issues**: Check troubleshooting section above
- **Database**: Neon dashboard at https://console.neon.tech/
- **Deployment**: Render dashboard at https://dashboard.render.com/

---

## 📝 License

ISC

---

## 👥 Team

CerviCare Team - Preventive Healthcare Platform

---

## ✅ Phase 1 Checklist

- [x] Authentication with JWT
- [x] User profile system
- [x] Curated content storage (70+ diet items, 60+ protection plans)
- [x] Rule-based personalization
- [x] Google Sheets integration
- [x] Neon PostgreSQL database
- [x] Security (bcrypt, helmet, CORS, rate limiting)
- [x] API documentation
- [x] Setup guide
- [x] Deployment guide
- [x] Test scripts

**Status**: ✅ Phase 1 Complete and Ready for Production!

---

## 🎉 Getting Started

1. **Read**: [PHASE1-SETUP.md](PHASE1-SETUP.md)
2. **Setup**: Run `npm run test:setup`
3. **Start**: Run `npm run dev`
4. **Test**: Check [API-DOCUMENTATION.md](API-DOCUMENTATION.md)
5. **Deploy**: Follow [RENDER-DEPLOYMENT.md](RENDER-DEPLOYMENT.md)

**Questions?** Check the documentation or run `npm run test:setup` to verify your setup.
