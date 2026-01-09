# Environment Variables for Render Deployment

## Required Variables

### 1. DATABASE_URL
**Description**: PostgreSQL database connection string  
**Required**: Yes  
**Format**: `postgresql://user:password@host:5432/database?sslmode=require`

**How to Get:**
1. In Render dashboard, go to your PostgreSQL database service
2. Click on the database
3. Copy the **Internal Database URL** (not External)
4. Use this as the value for `DATABASE_URL`

**Example:**
```
postgresql://cervicare_user:abc123@dpg-xxxxx-a.oregon-postgres.render.com:5432/cervicare_db?sslmode=require
```

**Validation:**
- Must start with `postgresql://`
- Must include `?sslmode=require` for Render PostgreSQL
- Use **Internal Database URL** (works within Render network)

---

### 2. JWT_SECRET
**Description**: Secret key for signing and verifying JWT tokens  
**Required**: Yes  
**Minimum Length**: 32 characters  
**Recommended**: 64+ characters

**How to Generate:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

**Example:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**Security Notes:**
- Never commit this to version control
- Use a different secret for each environment (dev/staging/prod)
- Rotate periodically in production
- Must be at least 32 characters (enforced by ProductionMiddleware)

---

### 3. NODE_ENV
**Description**: Application environment  
**Required**: No (defaults to 'development')  
**Values**: `development` | `production` | `staging`

**For Production:**
```
NODE_ENV=production
```

**Effects:**
- Enables SSL for database connections
- Enforces environment variable validation
- Enables production error handling
- Disables detailed error messages in responses

---

## Optional Variables

### ADMIN_KEY
**Description**: Admin API key for protected endpoints  
**Required**: No  
**Usage**: Set custom admin key for `/api/admin/users` endpoint

---

## Setting Variables on Render

### Method 1: Via Dashboard (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your **Web Service**
3. Click on **Environment** tab
4. Click **Add Environment Variable**
5. Enter:
   - **Key**: `DATABASE_URL`
   - **Value**: (paste your Internal Database URL)
6. Click **Save Changes**
7. Repeat for `JWT_SECRET` and `NODE_ENV`

### Method 2: Via render.yaml

Create/update `render.yaml`:
```yaml
services:
  - type: web
    name: cervicare-backend
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: NODE_ENV
        value: production
```

**Note**: `sync: false` means you'll set the value manually in the dashboard.

---

## Verification

### Check Variables Are Set

After setting variables, verify in Render logs:
```
✅ Connected to PostgreSQL database
🚀 CerviCare Backend Server is running on port 10000
🌍 Environment: production
```

### Test Database Connection

The server will automatically test the database connection on startup. Check logs for:
- ✅ `Connected to PostgreSQL database` - Success
- ❌ `Database connection error` - Check DATABASE_URL

### Test JWT Generation

After login, verify JWT token is generated:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

If token is missing or invalid, check `JWT_SECRET` is set.

---

## Troubleshooting

### "Missing environment variables: DATABASE_URL, JWT_SECRET"
- **Cause**: Variables not set in Render dashboard
- **Fix**: Add variables in Environment tab and redeploy

### "Database connection error"
- **Cause**: Invalid `DATABASE_URL` or database not accessible
- **Fix**: 
  - Verify `DATABASE_URL` uses Internal Database URL
  - Check PostgreSQL service is running
  - Ensure `?sslmode=require` is included

### "JWT_SECRET is too weak"
- **Cause**: JWT_SECRET is less than 32 characters
- **Fix**: Generate new secret with 32+ characters

### "Database is not reachable"
- **Cause**: Database service not running or wrong URL
- **Fix**: 
  - Check PostgreSQL service status
  - Verify Internal Database URL is correct
  - Ensure database is in same region as web service

---

## Security Best Practices

1. ✅ Never commit secrets to version control
2. ✅ Use different secrets for each environment
3. ✅ Rotate secrets periodically
4. ✅ Use Internal Database URL (not External) for Render
5. ✅ Set `NODE_ENV=production` in production
6. ✅ Use strong JWT_SECRET (64+ characters recommended)
7. ✅ Enable SSL for database (`sslmode=require`)

---

## Quick Setup Checklist

- [ ] Create PostgreSQL database on Render
- [ ] Copy Internal Database URL
- [ ] Generate JWT_SECRET (32+ characters)
- [ ] Set `DATABASE_URL` in web service environment
- [ ] Set `JWT_SECRET` in web service environment
- [ ] Set `NODE_ENV=production` (optional but recommended)
- [ ] Redeploy web service
- [ ] Verify database connection in logs
- [ ] Test signup and login endpoints
