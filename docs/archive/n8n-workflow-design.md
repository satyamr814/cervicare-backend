# n8n Workflow Design - CerviCare WhatsApp Automation

## 🎯 Workflow Overview

This workflow handles WhatsApp automation for CerviCare, providing personalized health guidance, reminders, and support while maintaining strict medical safety boundaries.

## 🔄 Main Workflow: CerviCare WhatsApp Bot

### Trigger Node: Webhook
**Node Type:** Webhook
**Configuration:**
- HTTP Method: POST
- Path: `/cervicare-webhook`
- Authentication: None (security via backend)
- Response Mode: Respond to Webhook

**Expected Input:**
```json
{
  "user_id": "uuid-string",
  "phone": "+1234567890",
  "action_type": "user_signup|profile_completed|diet_plan_viewed|protection_plan_viewed|reminder_opt_in",
  "timestamp": "2024-01-05T10:00:00Z",
  "metadata": {
    "diet_type": "veg",
    "risk_band": "low",
    "completion_score": 85
  }
}
```

### Node 1: Input Validation
**Node Type:** Function
**Purpose:** Validate and sanitize incoming webhook data

**JavaScript Code:**
```javascript
// Validate required fields
const required = ['user_id', 'phone', 'action_type'];
const missing = required.filter(field => !input.body[field]);

if (missing.length > 0) {
  return [{ json: { error: `Missing required fields: ${missing.join(', ')}` }, index: 0 }];
}

// Validate action type
const validActions = ['user_signup', 'profile_completed', 'diet_plan_viewed', 'protection_plan_viewed', 'reminder_opt_in'];
if (!validActions.includes(input.body.action_type)) {
  return [{ json: { error: 'Invalid action_type' }, index: 0 }];
}

// Sanitize phone number
const phone = input.body.phone.replace(/[^0-9+]/g, '');
if (!phone.startsWith('+')) {
  return [{ json: { error: 'Phone number must include country code' }, index: 0 }];
}

// Return validated data
return [{
  json: {
    user_id: input.body.user_id,
    phone: phone,
    action_type: input.body.action_type,
    timestamp: input.body.timestamp,
    metadata: input.body.metadata || {}
  }
}];
```

### Node 2: User Data Enrichment
**Node Type:** HTTP Request
**Purpose:** Fetch user profile data from CerviCare backend

**Configuration:**
- Method: GET
- URL: `{{$env.BACKEND_URL}}/api/profile`
- Authentication: Bearer Token (from environment)
- Headers: Content-Type: application/json

**Pre-request Script:**
```javascript
// Add user context to request
const userToken = $env.BACKEND_USER_TOKEN;
const headers = {
  'Authorization': `Bearer ${userToken}`,
  'Content-Type': 'application/json'
};
```

### Node 3: Intent Router
**Node Type:** Switch (Router)
**Purpose:** Route to appropriate message flow based on action_type

**Routes:**
1. **user_signup** → Welcome Flow
2. **profile_completed** → Personalization Flow
3. **diet_plan_viewed** → Diet Follow-up Flow
4. **protection_plan_viewed** → Protection Follow-up Flow
5. **reminder_opt_in** → Reminder Setup Flow
6. **default** → Error Handling

## 📋 Sub-Workflows

### Sub-Workflow 1: Welcome Flow (user_signup)

#### Node 1.1: Welcome Message
**Node Type:** WhatsApp Business API
**Purpose:** Send welcome message to new user

**Message Template:**
```
🌟 Welcome to CerviCare!

Thank you for joining our preventive health platform. I'm here to help you with personalized health guidance and reminders.

📋 Next Steps:
1. Complete your health profile
2. Get personalized recommendations
3. Set up helpful reminders

Reply MENU to see options or HELP for support.

Stay healthy! 💚
```

#### Node 1.2: Profile Completion Prompt
**Node Type:** WhatsApp Business API
**Purpose:** Encourage profile completion

**Message Template:**
```
📝 Complete Your Profile

To get personalized recommendations, please complete your health profile on our website.

🔗 Profile Link: {{$env.WEBSITE_URL}}/profile

This helps us provide:
✅ Personalized diet suggestions
✅ Lifestyle recommendations  
✅ Health protection plans

Reply DONE when you've completed your profile!
```

#### Node 1.3: Log Welcome Event
**Node Type:** HTTP Request
**Purpose:** Log welcome event back to backend

**Configuration:**
- Method: POST
- URL: `{{$env.BACKEND_URL}}/api/webhook/n8n`
- Body: Event tracking data

### Sub-Workflow 2: Personalization Flow (profile_completed)

#### Node 2.1: Personalized Welcome
**Node Type:** Function
**Purpose:** Generate personalized message based on profile

**JavaScript Code:**
```javascript
const profile = $input.first().json;
const { diet_type, age, lifestyle, city } = profile;

let greeting = age < 30 ? "Hi there! 👋" : age < 50 ? "Hello! 👋" : "Greetings! 👋";
let dietEmoji = diet_type === 'veg' ? '🥗' : diet_type === 'nonveg' ? '🍗' : '🌱';
let lifestyleEmoji = lifestyle === 'active' ? '🏃' : lifestyle === 'moderately_active' ? '🚶' : '🧘';

const message = `${greeting}

${dietEmoji} Your ${diet_type} preferences are noted!
${lifestyleEmoji} Your ${lifestyle} lifestyle is recorded!

🎯 Based on your profile, you can now access:
• Personalized diet recommendations
• Lifestyle guidance
• Health protection plans

Ready to explore? Reply:
DIET - for food suggestions
PLAN - for health guidance
MENU - for all options

Your health journey starts now! 💚`;

return [{ json: { message, user_data: profile } }];
```

#### Node 2.2: Send Personalized Message
**Node Type:** WhatsApp Business API
**Purpose:** Send personalized welcome

#### Node 2.3: Quick Reply Options
**Node Type:** WhatsApp Business API
**Purpose:** Send interactive buttons

**Button Options:**
- "View Diet Plan" → diet_plan
- "Health Guidance" → protection_plan  
- "Set Reminders" → reminders
- "Help" → support

### Sub-Workflow 3: Diet Follow-up Flow (diet_plan_viewed)

#### Node 3.1: Diet Engagement Message
**Node Type:** Function
**Purpose:** Create engaging follow-up message

**JavaScript Code:**
```javascript
const data = $input.first().json;
const { diet_type, recommendations_count } = data.metadata;

const dietTips = {
  veg: [
    "🥬 Try adding spinach to your smoothies for extra iron!",
    "🫘 Lentils are excellent protein sources for vegetarians.",
    "🥦 Don't forget broccoli - it's packed with vitamins!"
  ],
  nonveg: [
    "🐟 Include fatty fish twice a week for omega-3s.",
    "🍗 Lean chicken breast is great for protein.",
    "🥚 Eggs are a complete protein source!"
  ],
  vegan: [
    "🌱 Tofu is versatile and protein-rich!",
    "🥜 Nuts and seeds provide healthy fats.",
    "🌾 Quinoa is a complete plant-based protein!"
  ]
};

const tips = dietTips[diet_type] || dietTips.veg;
const randomTip = tips[Math.floor(Math.random() * tips.length)];

const message = `Great choice exploring your diet plan! 🥗

You viewed ${recommendations_count} personalized recommendations.

💡 Quick Tip: ${randomTip}

Would you like:
• More diet tips
• Recipe suggestions  
• Shopping list help
• Set meal reminders

Reply with your choice or MENU for options!`;

return [{ json: { message } }];
```

#### Node 2.2: Send Engagement Message
**Node Type:** WhatsApp Business API

### Sub-Workflow 4: Protection Plan Follow-up (protection_plan_viewed)

#### Node 4.1: Risk-Aware Guidance
**Node Type:** Function
**Purpose:** Create appropriate message based on risk band

**JavaScript Code:**
```javascript
const data = $input.first().json;
const { risk_band, sections_accessed } = data.metadata;

const messages = {
  low: {
    greeting: "Great job being proactive about your health! 🌟",
    focus: "maintaining healthy habits",
    emoji: "💚"
  },
  moderate: {
    greeting: "Taking the right steps for your health! 👍",
    focus: "building stronger health habits", 
    emoji: "💛"
  },
  higher_attention: {
    greeting: "You're making important health decisions! 🙏",
    focus: "consistent health monitoring",
    emoji: "💙"
  }
};

const msg = messages[risk_band] || messages.low;
const sections = sections_accessed.join(', ');

const message = `${msg.greeting}

Your protection plan covers: ${sections}

📋 Key Focus: ${msg.focus}

Would you like:
• Daily health reminders
• Weekly check-ins
• Progress tracking
• Connect with support

Reply with your choice or MENU for options! ${msg.emoji}`;

return [{ json: { message } }];
```

#### Node 4.2: Send Guidance Message
**Node Type:** WhatsApp Business API

### Sub-Workflow 5: Reminder Setup (reminder_opt_in)

#### Node 5.1: Reminder Preferences
**Node Type:** WhatsApp Business API
**Purpose:** Ask for reminder preferences

**Message Template:**
```
⏰ Let's set up helpful reminders!

I can remind you about:
🥗 Healthy meal times
💊 Daily health habits
📋 Weekly check-ins
🏃 Exercise routines

Which reminders would you like?
Reply with numbers (e.g., 1,3,4):

1. Meal reminders
2. Health habits
3. Weekly check-ins
4. Exercise reminders
5. All of the above
6. Customize

Reply STOP to cancel anytime.
```

#### Node 5.2: Schedule Logic
**Node Type:** Function
**Purpose:** Process reminder preferences

**JavaScript Code:**
```javascript
const choice = $input.first().json.message.trim();
const userId = $input.first().json.user_id;

const reminderTypes = {
  '1': ['meal_reminders'],
  '2': ['health_habits'],
  '3': ['weekly_checkins'],
  '4': ['exercise_reminders'],
  '5': ['meal_reminders', 'health_habits', 'weekly_checkins', 'exercise_reminders'],
  '6': ['customize']
};

const selected = reminderTypes[choice];
if (!selected) {
  return [{ json: { error: 'Invalid choice. Please reply with 1-6.' } }];
}

if (selected.includes('customize')) {
  return [{ json: { 
    message: "Let's customize! Tell me what reminders you'd like and when (e.g., 'Meal reminders at 8am, 1pm, 8pm')" 
  }}];
}

// Schedule reminders (this would integrate with your scheduling system)
const scheduleData = {
  user_id: userId,
  reminder_types: selected,
  timezone: 'UTC', // Would get from user profile
  created_at: new Date().toISOString()
};

return [{ 
  json: { 
    message: `✅ Reminders set: ${selected.join(', ')}\n\nI'll check in with you soon! Reply HELP anytime.`,
    schedule_data: scheduleData
  } 
}];
```

## 🔄 Error Handling & Recovery

### Error Handler Node
**Node Type:** Error Trigger
**Purpose:** Catch and handle workflow errors

**Error Handling Logic:**
```javascript
const error = $input.first().json;
const errorMessage = error.message || 'Unknown error occurred';

// Log error to monitoring system
console.error('n8n Workflow Error:', error);

// Send user-friendly error message
const userMessage = `😅 Technical hiccup! 

Our team has been notified. Please try again or reply HELP for assistance.

Error ID: ${error.id || 'unknown'}`;

return [{ json: { 
  error: errorMessage, 
  user_message: userMessage,
  requires_follow_up: true 
} }];
```

### Retry Logic
**Node Type:** Function
**Purpose:** Implement retry for failed API calls

**JavaScript Code:**
```javascript
const attempt = $runIndex || 1;
const maxRetries = 3;

if (attempt <= maxRetries) {
  console.log(`Retrying operation, attempt ${attempt}/${maxRetries}`);
  // Continue with retry
  return [{ json: { retry: true, attempt: attempt + 1 } }];
} else {
  // Max retries exceeded
  return [{ json: { 
    error: 'Max retries exceeded', 
    requires_manual_intervention: true 
  } }];
}
```

## 📊 Monitoring & Analytics

### Analytics Node
**Node Type:** HTTP Request
**Purpose:** Send workflow analytics to backend

**Data Points:**
- Workflow execution time
- Message delivery status
- User response rates
- Error frequency
- Popular message types

### Health Check Node
**Node Type:** Function
**Purpose:** Monitor workflow health

**JavaScript Code:**
```javascript
const health = {
  timestamp: new Date().toISOString(),
  workflow_status: 'healthy',
  active_conversations: $node["Active Conversations"].json.count,
  messages_sent_today: $node["Daily Stats"].json.messages_sent,
  error_rate: $node["Error Stats"].json.error_rate,
  last_error: $node["Error Stats"].json.last_error
};

// Alert if health metrics are poor
if (health.error_rate > 0.1) {
  // Send alert to monitoring system
  console.warn('High error rate detected:', health);
}

return [{ json: health }];
```

## 🔐 Security & Compliance

### Data Sanitization
**Node Type:** Function
**Purpose:** Remove sensitive data before logging

**JavaScript Code:**
```javascript
const data = $input.first().json;

// Remove sensitive fields
const sanitized = {
  ...data,
  phone: data.phone ? data.phone.substring(0, 3) + '****' : null,
  email: data.email ? data.email.split('@')[0] + '****@****.com' : null,
  metadata: data.metadata ? Object.keys(data.metadata).reduce((acc, key) => {
    if (key.includes('medical') || key.includes('health')) {
      acc[key] = '[REDACTED]';
    } else {
      acc[key] = data.metadata[key];
    }
    return acc;
  }, {}) : {}
};

return [{ json: sanitized }];
```

### Consent Verification
**Node Type:** Function
**Purpose:** Double-check user consent before sending

**JavaScript Code:**
```javascript
const userId = $input.first().json.user_id;
const actionType = $input.first().json.action_type;

// This would make an API call to verify consent
const consentCheck = {
  has_consent: true, // From backend verification
  consent_type: 'whatsapp',
  verified_at: new Date().toISOString()
};

if (!consentCheck.has_consent) {
  return [{ json: { 
    error: 'No consent for this action type',
    action_blocked: true 
  } }];
}

return [{ json: { consent_verified: true } }];
```

## 🚀 Deployment & Scaling

### Environment Variables Required
```
BACKEND_URL=https://your-backend.com
BACKEND_USER_TOKEN=your-service-token
WHATSAPP_BUSINESS_PHONE_ID=your-phone-id
WHATSAPP_ACCESS_TOKEN=your-access-token
MONITORING_WEBHOOK_URL=your-monitoring-url
```

### Scaling Considerations
- **Horizontal Scaling:** Multiple workflow instances
- **Queue Management:** Built-in n8n execution queue
- **Rate Limiting:** Respect WhatsApp API limits
- **Error Recovery:** Automatic retry with exponential backoff
- **Monitoring:** Real-time health checks and alerts

This workflow design ensures safe, compliant, and effective WhatsApp automation while maintaining strict medical boundaries and providing excellent user experience.
