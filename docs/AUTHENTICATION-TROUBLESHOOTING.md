# 🔐 Authentication Troubleshooting Guide

If you are experiencing the "Invalid credentials" error, follow these steps to diagnose and fix the issue.

## 1. Verify Database Connection
Check the debug endpoint to ensure your database is seeded:
- **URL:** `https://your-app-name.onrender.com/api/debug/users`
- **Success:** Returns a JSON list of users (e.g., `satyamr814@gmail.com`).
- **Failure:** Returns 404, 500, or empty list.

### Fixes:
- **404:** Your new code hasn't deployed. Manually deploy in Render.
- **500:** Check `DATABASE_URL` in Render Environment variables.
- **Empty List:** Database connected but empty. Run migration script locally or restart server to trigger seeding.

## 2. Verify Password Hashing
The system now uses `bcrypt` (hashed passwords).
- Old JSON passwords were plain text (e.g., "password").
- New Database passwords look like `$2b$10$...`.

**If you migrated manually:** Ensure you didn't just copy plain text passwords into the database. Use `migrate-to-postgres.js` or `fix-user-passwords.js`.

## 3. Deployment Issues
Render free tier spins down after inactivity.
- **Symptom:** First login fails or takes 30s+.
- **Solution:** Wait 1 minute and try again.

## 4. Debugging Commands
Run these locally to check your production database (requires External Database URL).

```bash
# Check user count
node scripts/check-db.js

# List all users (careful with PII)
psql "$DATABASE_URL" -c "SELECT email, role, created_at FROM users;"
```

## 5. Common Error Messages

| Error | Cause | Solution |
| :--- | :--- | :--- |
| `Invalid credentials` | Wrong password OR User not found | Check debug endpoint; Use `fix-user-passwords.js` |
| `Database not reachable` | Bad `DATABASE_URL` | Check Render Environment Variables |
| `Internal Server Error` | Server crashed | Check Render Logs |
