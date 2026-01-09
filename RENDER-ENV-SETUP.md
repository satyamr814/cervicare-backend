# Render Environment Setup - Copy These Values

## Required Environment Variables

Copy these EXACT values to your Render web service:

### 1. DATABASE_URL
```
postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. JWT_SECRET
Generate a new one or use this (change it for security):
```
cervicare_jwt_secret_key_2026_production_min_32_chars
```

### 3. NODE_ENV
```
production
```

## How to Set on Render

1. Go to **Render Dashboard** → Your Web Service
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"** for each:

   **Variable 1:**
   - Key: `DATABASE_URL`
   - Value: `postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   
   **Variable 2:**
   - Key: `JWT_SECRET`
   - Value: `cervicare_jwt_secret_key_2026_production_min_32_chars` (or generate your own)
   
   **Variable 3:**
   - Key: `NODE_ENV`
   - Value: `production`

4. Click **"Save Changes"**
5. Render will automatically redeploy

## After Deployment

The server will automatically:
- ✅ Connect to Neon database
- ✅ Create all tables
- ✅ Create test users with proper passwords

## Test Login

After deployment, use:
- **Email**: `satyamr814@gmail.com`
- **Password**: `Satyam@123`

## Database Already Fixed

The database has been fixed with:
- ✅ All tables created
- ✅ Users created with proper password hashes
- ✅ Password validation verified

You just need to set the environment variables above and redeploy!
