# CerviCare Phase 3 - Demo Readiness Checklist

Use this checklist to verify that all systems are wired correctly and ready for demonstration.

## 1. Environment Verification
- [ ] `.env` file contains `DATABASE_URL` (Neon PostgreSQL).
- [ ] `.env` file contains `GOOGLE_SHEETS_SPREADSHEET_ID`.
- [ ] `.env` file contains `GOOGLE_SHEETS_CREDENTIALS` (JSON or Path).
- [ ] `.env` file contains `N8N_WEBHOOK_URL`.
- [ ] Server starts without errors: `npm run dev`.

## 2. Google Sheets Integration (Dashboard)
- [ ] **Tab: users** exists with headers: `user_id, email, phone, city, created_at`.
- [ ] **Tab: profiles** exists with headers: `user_id, diet_type, budget_level, lifestyle, updated_at`.
- [ ] **Tab: actions** exists with headers: `user_id, action_type, source, timestamp`.

## 3. Core Flow Testing
- [ ] **Signup**: Perform a signup.
  - [ ] Verify HTTP 201 response.
  - [ ] Verify new row in `users` sheet on Google Sheets.
  - [ ] Verify `user_signup` action in `actions` sheet.
- [ ] **Profile**: Complete a user profile.
  - [ ] Verify HTTP 200 response.
  - [ ] Verify new/updated row in `profiles` sheet.
  - [ ] Verify `profile_completed` action in `actions` sheet.
  - [ ] Verify n8n webhook hit (check n8n execution log).
- [ ] **Diet Plan**: View a diet plan.
  - [ ] Verify recommendations are returned.
  - [ ] Verify `diet_plan_viewed` action in `actions` sheet.
- [ ] **Protection Plan**: View a protection plan.
  - [ ] Verify risk band logic works.
  - [ ] Verify `protection_plan_viewed` action in `actions` sheet.
  - [ ] Verify n8n webhook hit (check n8n execution log).

## 4. Automation & Consent
- [ ] **Consent Check**: Update profile with `whatsapp_consent = false`.
  - [ ] View protection plan.
  - [ ] Verify NO n8n webhook is triggered (check execution logs).
- [ ] **WhatsApp Sync**: (If n8n is connected) Verify test WhatsApp number receives the "Welcome" or "Plan Viewed" message.

## 5. Deployment (Render)
- [ ] Health Check: `https://your-app.onrender.com/api/health` returns success.
- [ ] Database Connection: Render logs show `✅ Connected to PostgreSQL database`.
- [ ] Sheets Connection: Render logs show `✅ Google Sheets service initialized`.

## 6. Safety & Cleanup
- [ ] Ensure no PII (Passowrds) are logged in console or n8n.
- [ ] Verify admin endpoints (`/admin/*`) require `X-Admin-Key` or correct role.
- [ ] Verify no breaking changes to Phase 1 APIs.

---

### End-to-End Test Command (Signup)
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@cervicare.com","password":"DemoPassword123","phone":"+919876543210","city":"Delhi"}'
```
*Expected: SUCCESS + Row in Google Sheets 'users' tab.*
