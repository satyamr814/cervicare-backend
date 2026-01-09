# Neon PostgreSQL Setup Guide

## Quick Setup

### Step 1: Get Your Neon Database Connection String

1. Go to [Neon Console](https://console.neon.tech/)
2. Select your project (or create a new one)
3. Click on your database
4. Go to **"Connection Details"** or **"Connection String"**
5. Copy the connection string

It should look like:
```
postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Step 2: Set Environment Variable

**For Local Development:**
Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
NODE_ENV=development
NEON_API_KEY=napi_qwhvr48ifdjn89z4gi7mponc546ufiq3evuw0qqdyjdbg6r57381ijjz9bzlrl39
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
- ✅ Create test users with known passwords
- ✅ Verify everything is working

### Step 4: Verify Setup

Check that users were created:
```bash
# Using psql
psql "$DATABASE_URL" -c "SELECT email, role FROM users;"
```

Or test login via API:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"satyamr814@gmail.com","password":"Satyam@123"}'
```

## Test Login Credentials

After running the setup script, you can use:

| Email | Password | Role |
|-------|----------|------|
| satyamr814@gmail.com | Satyam@123 | user |
| admin@cervicare.com | password | admin |
| user@cervicare.com | password | user |
| doffyism1@gmail.com | Satyam@123 | user |
| weebmafia1@gmail.com | Satyam@123 | user |

## Troubleshooting

### "Database connection failed"
- Check DATABASE_URL is correct
- Verify Neon database is active (not paused)
- Ensure connection string includes `?sslmode=require`

### "Invalid email or password"
- Run `node setup-neon-database.js` to recreate users
- Verify users exist: `SELECT email FROM users;`
- Check password hashes are correct (should start with `$2a$` or `$2b$`)

### "Table does not exist"
- Run the setup script: `node setup-neon-database.js`
- Or manually apply schema: `psql "$DATABASE_URL" -f database/schema.sql`

## For Render Deployment

1. Set `DATABASE_URL` in Render environment variables (use your Neon connection string)
2. Set `JWT_SECRET` (32+ characters)
3. Set `NODE_ENV=production`
4. Deploy
5. The seederService will automatically create tables and users on first start

## Neon API Key

Your Neon API key is stored in the setup script. It's used for:
- Managing Neon resources programmatically
- Creating databases (if needed)

**Note**: The API key alone is not enough - you still need the database connection string.
