# n8n Workflows Design for CerviCare Phase 3

This document outlines the logic and structure of the n8n workflows required to wire CerviCare to WhatsApp and Google Sheets.

## 1. WhatsApp Entry Workflow (User Interaction)

This workflow handles incoming messages from users via WhatsApp and routes them based on intent.

**Nodes**:
1. **WhatsApp Node (Trigger)**: Listens for incoming messages.
2. **User Identification**: Query the CerviCare database (via Postgres node) using the sender's phone number to find the `user_id`.
3. **Intent Routing (Switch Node)**:
   - If message is "Menu": Send a list of options (Get Diet Plan, Get Protection Plan, Support).
   - If message is "Diet": Trigger the `/api/diet-plan` logic (or provide a link).
   - If message is "Support": Route to the Support Workflow.
4. **WhatsApp Node (Output)**: Send the appropriate reply to the user.

---

## 2. Google Sheets Logging Workflow (Backend Data Sync)

This workflow receives data from the backend webhooks and appends it to Google Sheets. (Note: Many syncs are direct from backend, but n8n can handle complex logic for support or external triggers).

**Nodes**:
1. **Webhook Node (Trigger)**: Receives `POST /automation/n8n` calls from the backend.
2. **Data Transformation**: Map the JSON payload to header-friendly formats.
3. **Google Sheets Node**:
   - Tab: `actions`
   - Action: Append Row
   - Fields: `user_id`, `action_type`, `source`, `timestamp`.
4. **Error Handling**: If Sheets fails, send a notification to a Slack/Discord channel for admins.

---

## 3. Reminder Workflow (Proactive Engagement)

This workflow proactively sends reminders to users based on a schedule.

**Nodes**:
1. **Cron/Schedule Node**: Triggers daily at a specific time (e.g., 9:00 AM).
2. **User Fetch**: Query Postgres for users who have:
   - `whatsapp_consent = true`
   - A profile completed in the last 7 days.
3. **Message Personalization**: Customize the message based on `diet_type` or `risk_band`.
4. **WhatsApp Node**: Send the reminder message.
5. **Log Action**: Append a row to the `actions` sheet with `action_type = "reminder_sent"`.

---

## 4. Failure Handling & Best Practices

- **Retry Logic**: Use n8n's built-in "Retry" settings for HTTP/Sheets nodes.
- **De-duplication**: Use a "Wait" node or a database check to ensure users don't receive duplicate reminders.
- **Privacy**: Never log raw medical data in n8n logs. Use `user_id` as the primary identifier.

## 5. Webhook Payload Reference

The backend sends the following structure to `POST /automation/n8n`:

```json
{
  "user_id": "uuid",
  "phone": "+91XXXXXXXXXX",
  "action_type": "profile_completed",
  "consent_flags": {
    "whatsapp": true,
    "marketing": false
  },
  "timestamp": "2026-01-06T17:30:00.000Z",
  "metadata": {}
}
```
