# Authentication System Audit Report

## Root Cause Analysis

### Problem Summary
Login works locally but fails after deployment on Render with "invalid credentials" error.

### Root Causes Identified

#### 1. **File-Based Storage (CRITICAL)**
- **Location**: `server.js` (root directory)
- **Issue**: Uses `users.json` for user storage, which is **ephemeral on Render**
- **Impact**: All user data is lost on each redeploy, causing login failures
- **Evidence**: 
  - Line 50-52: Loads users from `users.json`
  - Line 71: Saves users to `users.json`
  - Line 277: Writes new users to `users.json`

#### 2. **Broken Password Hashing in Signup (CRITICAL)**
- **Location**: `server.js` line 271
- **Issue**: Signup endpoint **hardcodes** a password hash instead of hashing the actual password
- **Code**: 
  ```javascript
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  ```
- **Impact**: All new signups get the same hardcoded hash, making passwords unusable
- **Login Attempt**: Line 222 tries to use `bcrypt.compare()` but password was never properly hashed

#### 3. **Dual Server Implementation**
- **Proper Implementation**: `src/server.js` uses PostgreSQL correctly
- **Legacy Implementation**: `server.js` (root) uses file-based storage
- **Current State**: `package.json` correctly points to `src/server.js`, but `server.js` may still be referenced

#### 4. **Environment Variables**
- **DATABASE_URL**: Required but may not be set correctly on Render
- **JWT_SECRET**: Required but may be missing or weak
- **Current Implementation**: `src/config/database.js` and `src/config/jwt.js` correctly use environment variables

## Solution Summary

### ✅ Correct Implementation Already Exists
The `src/server.js` implementation is **correct** and uses:
- PostgreSQL database (persistent)
- Proper bcrypt hashing in `src/models/User.js`
- Environment variables for `DATABASE_URL` and `JWT_SECRET`
- Proper JWT token generation

### Required Actions

1. **Ensure `src/server.js` is used** (already configured in package.json)
2. **Set environment variables on Render**:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Strong random secret (32+ characters)
3. **Run database schema** on PostgreSQL instance
4. **Migrate existing users** from `users.json` to PostgreSQL (if any)
5. **Remove or deprecate** `server.js` to prevent confusion

## Database Schema

The PostgreSQL schema is defined in `database/schema.sql`:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables for Render

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | `your-super-secret-jwt-key-min-32-characters-long` |
| `NODE_ENV` | Environment (optional, defaults to development) | `production` |

### How to Set on Render

1. Go to your Render dashboard
2. Select your web service
3. Go to "Environment" tab
4. Add/Update:
   - `DATABASE_URL`: Copy from your PostgreSQL database service (Internal Database URL)
   - `JWT_SECRET`: Generate using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `NODE_ENV`: Set to `production`

## Migration Path

### Step 1: Verify Database Connection
```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT version();"
```

### Step 2: Run Schema
```bash
psql "$DATABASE_URL" -f database/schema.sql
```

### Step 3: Migrate Users (if needed)
Run the migration script provided: `migrate-users-to-postgres.js`

## Testing Checklist

- [ ] Database connection works
- [ ] Schema is applied
- [ ] Signup creates user with proper password hash
- [ ] Login validates password correctly
- [ ] JWT token is generated and valid
- [ ] Login works after redeploy (data persists)
