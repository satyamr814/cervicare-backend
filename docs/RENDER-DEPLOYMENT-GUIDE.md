# 🚀 CerviCare Render Deployment Guide

This guide details exactly how to deploy the CerviCare backend to Render with a persistent PostgreSQL database.

## 1. Prerequisites
- A [Render](https://render.com) account.
- This repository pushed to GitHub.

## 2. Create PostgreSQL Database
1.  Go to your **Render Dashboard**.
2.  Click **"New +"** -> **"PostgreSQL"**.
3.  **Name:** `cervicare-db`
4.  **Database:** `cervicare_db` (or default)
5.  **User:** `cervicare_user` (or default)
6.  **Region:** Select your preferred region (e.g., Singapore).
7.  **Version:** 16 (or latest stable).
8.  **Instance Type:** **Free**
9.  Click **"Create Database"**.
10. **Wait for it to initialize.**
11. **Copy the "Internal Database URL".** (It starts with `postgres://...`)

## 3. Create Web Service
1.  Go to **Render Dashboard**.
2.  Click **"New +"** -> **"Web Service"**.
3.  Connect your GitHub repository.
4.  **Name:** `cervicare-backend`
5.  **Region:** **MUST match your Database region**.
6.  **Branch:** `main`
7.  **Root Directory:** `.` (leave empty)
8.  **Runtime:** `Node`
9.  **Build Command:** `npm install`
10. **Start Command:** `npm start`
11. **Instance Type:** **Free**

## 4. Configure Environment Variables
In the Web Service creation page (or "Environment" tab later), add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgres://...` | Paste the **Internal Database URL** from Step 2. |
| `JWT_SECRET` | `(random string)` | A long, secure random string for tokens. |
| `NODE_ENV` | `production` | Enables production optimizations & security. |

Click **"Create Web Service"**.

## 5. Verification
1.  Wait for the deployment logs to finish.
2.  Look for: `✅ Connected to PostgreSQL database` and `✅ Database seeding completed successfully`.
3.  Visit your URL: `https://your-app-name.onrender.com/api/health`
    - Should return: `{"success": true, ...}`

## 6. Accessing the App
**Default Credentials (Auto-Seeded):**
-   **Email:** `satyamr814@gmail.com`
-   **Password:** `Satyam@123`

-   **Email:** `doffyism1@gmail.com`
-   **Password:** `Satyam@123`

## 7. Automated Backups (Cron Job)
Render Free Tier does not support Crons directly. However, you can run the `backup-database.js` script manually locally:
```bash
# In your local terminal
node backup-database.js
```
*Note: To run this against the production DB, you need to use the "External Database URL" in your local .env file.*
