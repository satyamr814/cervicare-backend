# 🚀 CerviCare Render Deployment Guide

Follow these steps to deploy your application with a persistent database on Render.

## 1. Create a PostgreSQL Database
1.  Go to your Render Dashboard.
2.  Click **"New +"** and select **"PostgreSQL"**.
3.  **Name:** `cervicare-db`
4.  **Database:** `cervicare_db`
5.  **User:** `cervicare_user`
6.  **Region:** Choose the same region as your Web Service (e.g., Singapore, Frankfurt).
7.  **Instance Type:** **Free**
8.  Click **"Create Database"**.

## 2. Get the Connection String
1.  Once the database is created, look for the **"Internal Database URL"**. 
2.  Click the **Copy** button to copy the URL. It looks like:
    `postgres://cervicare_user:password@hostname/cervicare_db`

## 3. Configure Your Web Service
1.  Go to your existing **Web Service** (`cervicare-rddu`).
2.  Go to **"Environment"**.
3.  Add the following Environment Variables:

| Key | Value |
| :--- | :--- |
| `DATABASE_URL` | Paste the **Internal Database URL** you copied in Step 2. |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `enter-a-long-random-secret-key-here` |

4.  Click **"Save Changes"**.

## 4. Verification
Render will automatically redeploy your service. Watch the logs for:
-   `✅ Connected to PostgreSQL database`
-   `🌱 Starting database seeding...`
-   `✅ Created test account: satyamr814@gmail.com`

**Login Credentials:**
-   **Email:** `satyamr814@gmail.com`
-   **Password:** `Satyam@123`
