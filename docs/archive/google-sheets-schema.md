# Google Sheets Admin Visibility Layer - Schema Design

## 📊 Sheet Structure Overview

Google Sheets serves as the **admin visibility layer** - not a database. It provides real-time insights for non-technical team members, demo purposes, and operational monitoring.

## 🗂️ Sheet Naming Conventions

All sheets follow the pattern: `[Environment]_[Purpose]_[Data]`

**Examples:**
- `PROD_Users_Active` - Production user data
- `PROD_Profiles_Lifestyle` - Production profile data  
- `PROD_Actions_Engagement` - Production user actions
- `STAGING_Users_Test` - Staging environment data

## 📋 Sheet 1: Users Sheet

**Sheet Name:** `PROD_Users_Active`

### Column Definitions

| Column | Data Type | Format | Description | Example |
|--------|-----------|--------|-------------|---------|
| A | user_id | Text | UUID | `123e4567-e89b-12d3-a456-426614174000` |
| B | email | Text | Email address | `user@example.com` |
| C | phone | Text | Phone with country code | `+1234567890` |
| D | city | Text | City name | `New Delhi` |
| E | created_at | DateTime | ISO 8601 | `2024-01-05T10:30:00Z` |
| F | last_seen | DateTime | ISO 8601 | `2024-01-05T15:45:00Z` |
| G | status | Text | User status | `active` |
| H | whatsapp_consent | Boolean | TRUE/FALSE | `TRUE` |
| I | marketing_consent | Boolean | TRUE/FALSE | `FALSE` |

### Data Consistency Rules
- **user_id**: Must be valid UUID, unique across sheet
- **email**: Must be valid email format, lowercase
- **phone**: Optional, must start with '+' if present
- **city**: Title case, no special characters
- **created_at**: Never changes after creation
- **last_seen**: Updated on each user action
- **status**: One of: `active`, `inactive`, `suspended`
- **consent fields**: Boolean values only

### Sorting & Filtering
- **Primary Sort**: `created_at` (newest first)
- **Secondary Sort**: `last_seen` (most recent first)
- **Auto-filter**: Enabled on `status` and `city` columns

## 📋 Sheet 2: Profiles Sheet

**Sheet Name:** `PROD_Profiles_Lifestyle`

### Column Definitions

| Column | Data Type | Format | Description | Example |
|--------|-----------|--------|-------------|---------|
| A | user_id | Text | UUID (foreign key) | `123e4567-e89b-12d3-a456-426614174000` |
| B | age | Number | Integer (18-120) | `32` |
| C | gender | Text | Gender identity | `female` |
| D | city | Text | City name | `Mumbai` |
| E | diet_type | Text | Dietary preference | `veg` |
| F | budget_level | Text | Spending category | `medium` |
| G | lifestyle | Text | Activity level | `moderately_active` |
| H | updated_at | DateTime | ISO 8601 | `2024-01-05T14:20:00Z` |
| I | completion_score | Number | 0-100 percentage | `85` |
| J | risk_band | Text | Calculated risk | `low` |

### Data Consistency Rules
- **user_id**: Must exist in Users sheet
- **age**: Integer between 18-120
- **gender**: One of: `male`, `female`, `other`
- **diet_type**: One of: `veg`, `nonveg`, `vegan`
- **budget_level**: One of: `low`, `medium`, `high`
- **lifestyle**: One of: `sedentary`, `moderately_active`, `active`
- **completion_score**: Calculated field, 0-100
- **risk_band**: One of: `low`, `moderate`, `higher_attention`

### Sorting & Filtering
- **Primary Sort**: `updated_at` (most recent first)
- **Secondary Sort**: `completion_score` (highest first)
- **Auto-filter**: Enabled on `diet_type`, `budget_level`, `lifestyle`

## 📋 Sheet 3: Actions Sheet

**Sheet Name:** `PROD_Actions_Engagement`

### Column Definitions

| Column | Data Type | Format | Description | Example |
|--------|-----------|--------|-------------|---------|
| A | action_id | Text | UUID | `456e7890-e89b-12d3-a456-426614174111` |
| B | user_id | Text | UUID (foreign key) | `123e4567-e89b-12d3-a456-426614174000` |
| C | action_type | Text | Action category | `diet_plan_viewed` |
| D | source | Text | Where action occurred | `website` |
| E | timestamp | DateTime | ISO 8601 | `2024-01-05T16:00:00Z` |
| F | metadata | Text | JSON string | `{"risk_band":"low"}` |
| G | session_id | Text | Session identifier | `sess_abc123` |
| H | device_type | Text | Device category | `mobile` |

### Data Consistency Rules
- **action_id**: Unique UUID for each action
- **user_id**: Must exist in Users sheet
- **action_type**: One of predefined types
- **source**: One of: `website`, `whatsapp`, `api`
- **timestamp**: Action occurrence time
- **metadata**: Valid JSON string, max 500 chars
- **session_id**: Optional, for tracking user sessions
- **device_type**: One of: `mobile`, `desktop`, `tablet`, `unknown`

### Action Types (Valid Values)
- `user_signup` - New user registration
- `profile_completed` - Profile fully filled
- `diet_plan_viewed` - Diet recommendations accessed
- `protection_plan_viewed` - Protection plan accessed
- `reminder_opt_in` - User consented to reminders
- `reminder_opt_out` - User declined reminders
- `content_shared` - User shared content
- `support_requested` - User asked for help

### Sorting & Filtering
- **Primary Sort**: `timestamp` (most recent first)
- **Secondary Sort**: `user_id` (grouped by user)
- **Auto-filter**: Enabled on `action_type` and `source`

## 📋 Sheet 4: Content Performance Sheet

**Sheet Name:** `PROD_Content_Performance`

### Column Definitions

| Column | Data Type | Format | Description | Example |
|--------|-----------|--------|-------------|---------|
| A | content_id | Text | UUID | `789e0123-e89b-12d3-a456-426614174222` |
| B | content_type | Text | Content category | `diet_recommendation` |
| C | content_title | Text | Brief description | `Spinach for Iron` |
| D | view_count | Number | Total views | `145` |
| E | unique_users | Number | Distinct users | `89` |
| E | conversion_rate | Number | Percentage | `12.5` |
| F | last_viewed | DateTime | ISO 8601 | `2024-01-05T17:30:00Z` |
| G | effectiveness_score | Number | 0-100 rating | `78` |

## 📋 Sheet 5: System Health Sheet

**Sheet Name:** `PROD_System_Health`

### Column Definitions

| Column | Data Type | Format | Description | Example |
|--------|-----------|--------|-------------|---------|
| A | metric_name | Text | Metric identifier | `webhook_success_rate` |
| B | metric_value | Number | Numeric value | `98.5` |
| C | metric_unit | Text | Unit of measure | `percent` |
| D | timestamp | DateTime | ISO 8601 | `2024-01-05T18:00:00Z` |
| E | status | Text | Health status | `healthy` |
| F | alert_threshold | Number | Warning level | `95.0` |

## 🔧 Sheet Configuration

### Protected Ranges
- **Headers (Row 1)**: Locked to prevent accidental deletion
- **Formulas**: Protected where applicable
- **Data validation**: Applied to dropdown columns

### Conditional Formatting
- **Users Sheet**: 
  - Green for active users with recent activity
  - Yellow for inactive users (>7 days)
  - Red for suspended users
- **Profiles Sheet**:
  - Green for completion_score > 80
  - Yellow for 50-80
  - Red for <50
- **Actions Sheet**:
  - Color coding by action_type
  - Highlight recent actions (last 24 hours)

### Data Validation Rules
- **Dropdown columns**: Predefined value lists
- **Email columns**: Email format validation
- **Phone columns**: Phone number format validation
- **Date columns**: Date format validation

## 📊 Dashboard Views

### Summary Dashboard (First Sheet)
**Sheet Name:** `PROD_Dashboard_Summary`

Key metrics displayed:
- Total Users (from Users sheet)
- Active Profiles (from Profiles sheet)
- Today's Actions (from Actions sheet)
- System Health (from System Health sheet)

### Charts & Visualizations
- **User Growth**: Line chart of new users over time
- **Profile Completion**: Pie chart of completion scores
- **Action Types**: Bar chart of action frequency
- **Geographic Distribution**: Map of user cities

## 🔄 Data Sync Strategy

### Real-time Sync Events
1. **User Creation** → Add to Users sheet
2. **Profile Update** → Update Profiles sheet
3. **User Action** → Add to Actions sheet
4. **Content View** → Update Content Performance sheet
5. **System Metrics** → Update System Health sheet

### Batch Sync Events
- **Hourly**: Aggregate metrics calculation
- **Daily**: Data cleanup and archiving
- **Weekly**: Performance report generation

### Error Handling
- **Sync Failures**: Log to backend, retry with exponential backoff
- **Data Validation**: Reject invalid data, log errors
- **Sheet Limits**: Monitor row limits, archive old data

## 🚨 Monitoring & Alerts

### Automated Alerts
- **New User Spike**: >100 users/hour
- **Sync Failures**: >5 consecutive failures
- **Data Anomalies**: Unusual patterns in action types
- **System Health**: Metrics below thresholds

### Manual Review Points
- **Daily**: User growth and engagement metrics
- **Weekly**: Content performance analysis
- **Monthly**: System health and capacity planning

This Google Sheets schema provides comprehensive visibility into platform operations while maintaining data integrity and supporting scalable growth.
