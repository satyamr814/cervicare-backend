# Fix Login Issue - Complete Guide

## Problem
"Invalid email or password" error when trying to log in.

## Root Cause
1. Database not properly set up
2. Users not created in database
3. Password hashes incorrect or missing
4. DATABASE_URL not configured

## Solution

### Step 1: Get Your Neon Database Connection String

1. Go to [Neon Console](https://console.neon.tech/)
2. Sign in
3. Select your project
4. Click on your database
5. Go to **"Connection Details"** or **"Connection String"**
6. Copy the connection string

It should look like:
```
postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Step 2: Set Environment Variables

**For Local Development:**

Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-generate-this
NODE_ENV=development
```

**For Render Deployment:**

1. Go to your Render web service
2. Go to **Environment** tab
3. Add/Update:
   - `DATABASE_URL`: Your Neon connection string
   - `JWT_SECRET`: Generate using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `NODE_ENV`: `production`

### Step 3: Run Database Setup

```bash
node setup-neon-database.js
```

This will:
- ✅ Test database connection
- ✅ Create all required tables
- ✅ Create test users with proper password hashes
- ✅ Verify everything is working

### Step 4: Test Login

After setup, test login with:

**Email:** `satyamr814@gmail.com`  
**Password:** `Satyam@123`

Or via API:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"satyamr814@gmail.com","password":"Satyam@123"}'
```

## Test Users Created

After running setup, these users will be available:

| Email | Password | Role |
|-------|----------|------|
| satyamr814@gmail.com | Satyam@123 | user |
| admin@cervicare.com | password | admin |
| user@cervicare.com | password | user |
| doffyism1@gmail.com | Satyam@123 | user |
| weebmafia1@gmail.com | Satyam@123 | user |

## Troubleshooting

### "Database connection failed"
- ✅ Check DATABASE_URL is correct
- ✅ Verify Neon database is active (not paused)
- ✅ Ensure connection string includes `?sslmode=require`
- ✅ Check your Neon project is not suspended

### "Invalid email or password"
- ✅ Run `node setup-neon-database.js` to recreate users
- ✅ Verify users exist: Check Neon console or run `SELECT email FROM users;`
- ✅ Check password hashes are correct (should start with `$2a$` or `$2b$`)

### "Table does not exist"
- ✅ Run the setup script: `node setup-neon-database.js`
- ✅ Or manually apply schema: `psql "$DATABASE_URL" -f database/schema.sql`

### Users Not Persisting After Redeploy
- ✅ Ensure you're using Neon PostgreSQL (not file-based storage)
- ✅ Verify DATABASE_URL is set correctly in Render
- ✅ Check that `src/server.js` is being used (not `server.js`)

## For Render Deployment

1. **Set Environment Variables:**
   - `DATABASE_URL`: Your Neon connection string
   - `JWT_SECRET`: 32+ character random string
   - `NODE_ENV`: `production`

2. **Deploy:**
   - The seederService will automatically create tables and users on first start
   - Check logs for: `✅ Created test account: satyamr814@gmail.com`

3. **Verify:**
   - Test login endpoint
   - Check database has users

## Quick Fix Command

If you just want to quickly fix the login issue:

```bash
# 1. Set DATABASE_URL
export DATABASE_URL="your-neon-connection-string"

# 2. Run setup
node setup-neon-database.js

# 3. Start server
npm start

# 4. Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"satyamr814@gmail.com","password":"Satyam@123"}'
```

## Verification Checklist

- [ ] DATABASE_URL is set correctly
- [ ] Database connection works
- [ ] Tables are created (users, user_profiles, etc.)
- [ ] Test users are created
- [ ] Password hashes are correct (bcrypt format)
- [ ] Login endpoint responds correctly
- [ ] JWT tokens are generated

## Still Having Issues?

1. Check server logs for errors
2. Verify DATABASE_URL format
3. Test database connection manually
4. Check that users table has data
5. Verify password hashing is working
