# Render Deployment Fix - Authentication System

## Problem Summary
Login works locally but fails after deployment on Render with "invalid credentials" error.

## Root Causes

### 1. File-Based Storage (CRITICAL)
- **Issue**: `server.js` (root) uses `users.json` which is **ephemeral on Render**
- **Impact**: All user data is lost on each redeploy
- **Solution**: Use `src/server.js` which uses PostgreSQL (already configured in package.json)

### 2. Broken Password Hashing
- **Issue**: `server.js` signup hardcodes password hash instead of hashing actual password
- **Impact**: New signups cannot log in
- **Solution**: `src/server.js` already has correct bcrypt implementation

### 3. Environment Variables Missing
- **Issue**: `DATABASE_URL` and `JWT_SECRET` may not be set on Render
- **Impact**: Database connection fails or JWT tokens are invalid
- **Solution**: Set environment variables as documented below

## Solution Implementation

### ✅ Correct Implementation Already Exists
The codebase already has a **correct PostgreSQL-based implementation** in `src/server.js`:
- ✅ Proper bcrypt password hashing (`src/models/User.js`)
- ✅ PostgreSQL database storage (persistent)
- ✅ Environment variable usage (`DATABASE_URL`, `JWT_SECRET`)
- ✅ Proper JWT token generation

### Required Actions

#### Step 1: Verify Server Entry Point
The `package.json` already correctly points to `src/server.js`:
```json
{
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js"
  }
}
```

#### Step 2: Set Environment Variables on Render

1. Go to your Render dashboard
2. Select your **Web Service**
3. Go to **Environment** tab
4. Add/Update the following variables:

| Variable | Value | How to Get |
|----------|-------|------------|
| `DATABASE_URL` | PostgreSQL connection string | Copy from your PostgreSQL database service (use **Internal Database URL**) |
| `JWT_SECRET` | Strong random string (32+ chars) | Generate using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | `production` | Set to `production` for production environment |

**Example DATABASE_URL format:**
```
postgresql://user:password@hostname:5432/database?sslmode=require
```

**Example JWT_SECRET:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

#### Step 3: Create PostgreSQL Database on Render

1. In Render dashboard, create a new **PostgreSQL** database
2. Note the **Internal Database URL** (use this for `DATABASE_URL`)
3. The database will be automatically available to your web service

#### Step 4: Run Database Schema

After creating the database, run the schema:

**Option A: Using Render Shell**
1. Go to your PostgreSQL database service
2. Click "Connect" → "Shell"
3. Run:
```bash
psql < database/schema.sql
```

**Option B: Using Local psql**
```bash
psql "$DATABASE_URL" -f database/schema.sql
```

**Option C: Using Migration Script**
The schema will be automatically created on first server start via `seederService`.

#### Step 5: Migrate Existing Users (if any)

If you have users in `users.json` that need to be migrated:

```bash
DATABASE_URL=your_postgres_url node migrate-users-to-postgres.js
```

#### Step 6: Redeploy

1. Commit all changes
2. Push to your repository
3. Render will automatically redeploy
4. Check logs to ensure:
   - ✅ Database connection successful
   - ✅ Environment variables loaded
   - ✅ Server started successfully

## Verification Checklist

After deployment, verify:

- [ ] Environment variables are set (`DATABASE_URL`, `JWT_SECRET`)
- [ ] Database schema is applied (check logs or query database)
- [ ] Server starts without errors
- [ ] Signup creates user with proper password hash
- [ ] Login validates password correctly
- [ ] JWT token is generated and valid
- [ ] Login works after redeploy (data persists)

## Testing

### Test Signup
```bash
curl -X POST https://your-app.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

### Test Login
```bash
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "created_at": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Troubleshooting

### Error: "Database is not reachable"
- Check `DATABASE_URL` is set correctly
- Verify PostgreSQL database is running
- Ensure you're using **Internal Database URL** (not External)

### Error: "Invalid credentials"
- Verify user exists in database: `SELECT email FROM users;`
- Check password hash is correct (should start with `$2a$` or `$2b$`)
- Ensure bcrypt comparison is working

### Error: "JWT_SECRET is too weak"
- Generate a new JWT_SECRET with at least 32 characters
- Update environment variable on Render
- Redeploy

### Users Lost After Redeploy
- This means you're still using `server.js` (file-based)
- Ensure `package.json` points to `src/server.js`
- Verify PostgreSQL is being used (check logs for "Connected to PostgreSQL database")

## Database Schema

The PostgreSQL schema is in `database/schema.sql`. Key table:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Files Changed/Fixed

### ✅ Already Correct (No Changes Needed)
- `src/server.js` - Main server (uses PostgreSQL)
- `src/models/User.js` - Proper bcrypt hashing
- `src/controllers/authController.js` - Correct login/signup logic
- `src/config/database.js` - Uses `DATABASE_URL` from env
- `src/config/jwt.js` - Uses `JWT_SECRET` from env

### ⚠️ Legacy Files (Should Not Be Used)
- `server.js` - File-based storage (deprecated)
- `users.json` - Ephemeral file storage

## Summary

The authentication system is **already correctly implemented** in `src/server.js`. The issue is:
1. Environment variables not set on Render
2. Database schema not applied
3. Possibly using wrong server file (though package.json is correct)

Follow the steps above to fix the deployment.
