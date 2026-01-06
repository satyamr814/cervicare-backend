# 🚀 CerviCare Phase 1 - Quick Start Checklist

Follow these steps in order to get your backend up and running!

## ✅ Step 1: Environment Setup (2 minutes)

### Option A: Use Setup Script (Recommended)
```bash
setup-phase1.bat
```

### Option B: Manual Setup
```bash
copy .env.phase1 .env
```

Then verify `.env` has these values:
- ✅ DATABASE_URL (your Neon connection string)
- ✅ JWT_SECRET
- ✅ GOOGLE_SHEETS_CREDENTIALS_PATH
- ✅ GOOGLE_SHEETS_SPREADSHEET_ID

---

## ✅ Step 2: Install Dependencies (1 minute)

```bash
npm install
```

Wait for installation to complete...

---

## ✅ Step 3: Initialize Database (2 minutes)

### Create Tables
```bash
psql "postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f database/schema.sql
```

### Load Sample Content (70+ diet items, 60+ protection plans)
```bash
psql "postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f database/sample-content.sql
```

---

## ✅ Step 4: Verify Setup (30 seconds)

```bash
npm run test:setup
```

You should see:
```
✅ Database connected successfully
✅ Found 4 tables
✅ Diet Content: 70+
✅ Protection Plans: 60+
✅ Phase 1 Setup Complete!
```

If you see errors, check [PHASE1-SETUP.md](PHASE1-SETUP.md) for troubleshooting.

---

## ✅ Step 5: Start Server (10 seconds)

```bash
npm run dev
```

You should see:
```
🚀 CerviCare Backend Server is running on port 3000
✅ Connected to PostgreSQL database
✅ Google Sheets service initialized
```

---

## ✅ Step 6: Test API (2 minutes)

### Test 1: Health Check
```bash
curl http://localhost:3000/api/health
```

Expected: `{"success":true,"message":"Server is healthy",...}`

### Test 2: Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d "{\"email\":\"test@cervicare.com\",\"password\":\"Test123!@#\"}"
```

Expected: You get a token back

**SAVE THE TOKEN!** Copy the token value from the response.

### Test 3: Create Profile
Replace `YOUR_TOKEN` with the token from Test 2:

```bash
curl -X POST http://localhost:3000/api/profile -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"age\":28,\"gender\":\"female\",\"city\":\"Delhi\",\"diet_type\":\"veg\",\"budget_level\":\"medium\",\"lifestyle\":\"moderately_active\"}"
```

Expected: Profile created successfully

### Test 4: Get Diet Plan
```bash
curl -X GET http://localhost:3000/api/diet-plan -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: You get personalized diet recommendations! 🎉

### Test 5: Get Protection Plan
```bash
curl -X GET http://localhost:3000/api/protection-plan -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: You get a personalized protection plan! 🎉

---

## ✅ Step 7: Verify Google Sheets (1 minute)

1. Open your Google Sheet:
   https://docs.google.com/spreadsheets/d/1jRprM6lBFldJSUEaoBtDJ6H3r4NXYVaXtXSDgYI_G1Q/edit

2. Check for new sheets:
   - `User Logins`
   - `Profile Updates`
   - `Diet Plans`
   - `Protection Plans`

3. Verify your test data appears!

---

## ✅ Step 8: Test Frontend Integration (5 minutes)

1. Open your frontend: `http://localhost:3000`
2. Test signup/login flow
3. Test profile creation
4. Verify everything works!

---

## 🎉 Success!

Your Phase 1 backend is now running!

### What You Have:
- ✅ Secure authentication
- ✅ User profiles
- ✅ 130+ curated content items
- ✅ Rule-based personalization
- ✅ Google Sheets analytics
- ✅ Production-ready code

### Next Steps:

**Today**:
- [ ] Test all features thoroughly
- [ ] Try different user profiles
- [ ] Verify Google Sheets sync

**This Week**:
- [ ] Deploy to Render (see [RENDER-DEPLOYMENT.md](RENDER-DEPLOYMENT.md))
- [ ] Connect production frontend
- [ ] Add more curated content

**This Month**:
- [ ] Get user feedback
- [ ] Monitor performance
- [ ] Plan Phase 2 features

---

## 📚 Documentation

- **API Reference**: [API-DOCUMENTATION.md](API-DOCUMENTATION.md)
- **Setup Guide**: [PHASE1-SETUP.md](PHASE1-SETUP.md)
- **Deployment**: [RENDER-DEPLOYMENT.md](RENDER-DEPLOYMENT.md)
- **Overview**: [README-PHASE1.md](README-PHASE1.md)

---

## 🆘 Troubleshooting

### Issue: Database connection failed
**Fix**: Check DATABASE_URL in .env, verify Neon database is active

### Issue: Google Sheets not syncing
**Fix**: Verify credentials path and spreadsheet ID in .env

### Issue: No recommendations found
**Fix**: Run `database/sample-content.sql` to load content

### Issue: Token invalid
**Fix**: Make sure to include `Authorization: Bearer YOUR_TOKEN` header

**More help**: See [PHASE1-SETUP.md](PHASE1-SETUP.md) troubleshooting section

---

## ⏱️ Total Time: ~10 minutes

You're now ready to build amazing preventive healthcare features! 🚀

**Questions?** Check the documentation or run `npm run test:setup` to verify your setup.
