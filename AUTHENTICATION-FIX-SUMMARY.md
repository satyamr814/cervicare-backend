# Authentication System Fix - Complete Summary

## Executive Summary

**Problem**: Login works locally but fails after deployment on Render with "invalid credentials"

**Root Cause**: File-based storage (`users.json`) is ephemeral on Render, causing user data to be lost on each redeploy. Additionally, the legacy `server.js` has broken password hashing.

**Solution**: The codebase already has a correct PostgreSQL-based implementation in `src/server.js`. The fix requires setting environment variables and ensuring the database schema is applied.

---

## Root Cause Explanation

### 1. File-Based Storage (Primary Issue)
- **Location**: `server.js` (root directory) uses `users.json` for user storage
- **Problem**: On Render, the filesystem is ephemeral - all files are wiped on each redeploy
- **Impact**: Users created locally or in previous deployments are lost, causing "invalid credentials" errors
- **Evidence**: 
  - Line 50-52: Loads users from `users.json`
  - Line 71: Saves users to `users.json`
  - Line 277: Writes new users to `users.json`

### 2. Broken Password Hashing in Legacy Code
- **Location**: `server.js` line 271
- **Problem**: Signup endpoint hardcodes a password hash instead of hashing the actual password
- **Code**: 
  ```javascript
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  ```
- **Impact**: All new signups get the same hardcoded hash, making passwords unusable

### 3. Correct Implementation Exists
- **Location**: `src/server.js` and related files
- **Status**: ✅ Already correctly implemented
- **Features**:
  - PostgreSQL database (persistent)
  - Proper bcrypt password hashing
  - Environment variable usage
  - Proper JWT token generation

---

## Fixed Backend Code

### ✅ No Code Changes Required

The backend code in `src/` is **already correct**:

#### 1. User Model (`src/models/User.js`)
```javascript
static async create(email, password) {
  const passwordHash = await bcrypt.hash(password, 10); // ✅ Proper hashing
  // ... inserts into PostgreSQL
}

static async validatePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword); // ✅ Proper comparison
}
```

#### 2. Auth Controller (`src/controllers/authController.js`)
```javascript
static async signup(req, res) {
  const user = await User.create(email, password); // ✅ Uses proper hashing
  const token = generateToken({ userId: user.id, email: user.email }); // ✅ Uses JWT_SECRET
}

static async login(req, res) {
  const user = await User.findByEmail(email);
  const isValidPassword = await User.validatePassword(password, user.password_hash); // ✅ Proper comparison
  const token = generateToken({ userId: user.id, email: user.email }); // ✅ Uses JWT_SECRET
}
```

#### 3. Database Config (`src/config/database.js`)
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ✅ Uses environment variable
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

#### 4. JWT Config (`src/config/jwt.js`)
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'; // ✅ Uses environment variable
```

### ⚠️ Legacy Code (Should Not Be Used)
- `server.js` (root) - File-based storage, broken password hashing
- This file should be deprecated but kept for reference

---

## Database Schema

### PostgreSQL Schema (`database/schema.sql`)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for email lookups
CREATE INDEX idx_users_email ON users(email);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### How to Apply Schema

**On Render:**
1. Go to PostgreSQL database service
2. Click "Connect" → "Shell"
3. Run: `psql < database/schema.sql`

**Or using psql:**
```bash
psql "$DATABASE_URL" -f database/schema.sql
```

**Or automatically:**
The schema is automatically applied on first server start via `seederService`.

---

## Exact Environment Variables Required for Render

### Required Variables

| Variable | Description | Example Value | How to Get |
|----------|-------------|---------------|------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` | Copy **Internal Database URL** from Render PostgreSQL service |
| `JWT_SECRET` | Secret for JWT tokens (32+ chars) | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6` | Generate using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | Environment (optional) | `production` | Set to `production` for production |

### Setting on Render

1. Go to Render Dashboard → Your Web Service
2. Click **Environment** tab
3. Add variables:
   - **Key**: `DATABASE_URL`
   - **Value**: (Internal Database URL from PostgreSQL service)
   - **Key**: `JWT_SECRET`
   - **Value**: (Generated 32+ character string)
   - **Key**: `NODE_ENV`
   - **Value**: `production`
4. Click **Save Changes**
5. Redeploy service

### Generating JWT_SECRET

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## Migration Script

A migration script is provided: `migrate-users-to-postgres.js`

**Usage:**
```bash
DATABASE_URL=your_postgres_url node migrate-users-to-postgres.js
```

**What it does:**
- Reads users from `users.json`
- Properly hashes passwords (if plain text)
- Migrates users to PostgreSQL
- Skips users that already exist

---

## Verification Steps

### 1. Check Environment Variables
```bash
# In Render logs, you should see:
✅ Connected to PostgreSQL database
🚀 CerviCare Backend Server is running on port 10000
🌍 Environment: production
```

### 2. Test Signup
```bash
curl -X POST https://your-app.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "created_at": "2026-01-07T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Test Login
```bash
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "created_at": "2026-01-07T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Verify Persistence
1. Create a user via signup
2. Redeploy the service
3. Login with the same credentials
4. ✅ Should work (data persisted in PostgreSQL)

---

## Files Reference

### ✅ Correct Implementation (No Changes Needed)
- `src/server.js` - Main server (PostgreSQL-based)
- `src/models/User.js` - User model with proper bcrypt
- `src/controllers/authController.js` - Auth logic
- `src/config/database.js` - Database config (uses DATABASE_URL)
- `src/config/jwt.js` - JWT config (uses JWT_SECRET)
- `database/schema.sql` - Database schema

### ⚠️ Legacy Files (Deprecated)
- `server.js` - File-based storage (should not be used)
- `users.json` - Ephemeral file storage

### 📝 New Files Created
- `AUTHENTICATION-AUDIT-REPORT.md` - Detailed audit report
- `RENDER-DEPLOYMENT-FIX.md` - Step-by-step deployment guide
- `ENVIRONMENT-VARIABLES.md` - Environment variable documentation
- `migrate-users-to-postgres.js` - User migration script
- `AUTHENTICATION-FIX-SUMMARY.md` - This file

---

## Quick Fix Checklist

- [ ] Create PostgreSQL database on Render
- [ ] Copy Internal Database URL
- [ ] Generate JWT_SECRET (32+ characters)
- [ ] Set `DATABASE_URL` in web service environment
- [ ] Set `JWT_SECRET` in web service environment
- [ ] Set `NODE_ENV=production` (optional)
- [ ] Run database schema (or let seederService do it)
- [ ] Redeploy web service
- [ ] Verify database connection in logs
- [ ] Test signup endpoint
- [ ] Test login endpoint
- [ ] Verify login works after redeploy

---

## Summary

**The backend code is already correct.** The issue is:
1. Environment variables not set on Render
2. Database schema not applied
3. Possibly using wrong server file (though package.json is correct)

**Fix**: Set environment variables and apply database schema as documented above.

**Result**: Login will work consistently across redeploys because data is stored in persistent PostgreSQL database instead of ephemeral files.
