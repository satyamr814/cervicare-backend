# CerviCare Phase 1 API Documentation

## Base URL
- **Local Development**: `http://localhost:3000`
- **Production**: `https://your-app.onrender.com`

## Table of Contents
1. [Authentication](#authentication)
2. [User Profile](#user-profile)
3. [Personalization](#personalization)
4. [Error Handling](#error-handling)

---

## Authentication

### 1. Sign Up

Create a new user account.

**Endpoint**: `POST /api/auth/signup`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "created_at": "2026-01-06T17:22:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

---

### 2. Login

Authenticate an existing user.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "created_at": "2026-01-06T17:22:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

---

## User Profile

All profile endpoints require authentication. Include the JWT token in the Authorization header.

### 3. Get Profile

Retrieve the current user's profile.

**Endpoint**: `GET /api/profile`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com"
    },
    "profile": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "age": 28,
      "gender": "female",
      "city": "Delhi",
      "diet_type": "veg",
      "budget_level": "medium",
      "lifestyle": "moderately_active",
      "created_at": "2026-01-06T17:25:00.000Z",
      "updated_at": "2026-01-06T17:25:00.000Z"
    }
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "Profile not found. Please create a profile first."
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Create/Update Profile

Create a new profile or update an existing one.

**Endpoint**: `POST /api/profile`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**:
```json
{
  "age": 28,
  "gender": "female",
  "city": "Delhi",
  "diet_type": "veg",
  "budget_level": "medium",
  "lifestyle": "moderately_active"
}
```

**Field Constraints**:
- `age`: Integer, 18-120
- `gender`: One of: `male`, `female`, `other`
- `city`: String, max 100 characters
- `diet_type`: One of: `veg`, `nonveg`, `vegan`
- `budget_level`: One of: `low`, `medium`, `high`
- `lifestyle`: One of: `sedentary`, `moderately_active`, `active`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile saved successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com"
    },
    "profile": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "age": 28,
      "gender": "female",
      "city": "Delhi",
      "diet_type": "veg",
      "budget_level": "medium",
      "lifestyle": "moderately_active",
      "created_at": "2026-01-06T17:25:00.000Z",
      "updated_at": "2026-01-06T17:30:00.000Z"
    }
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 28,
    "gender": "female",
    "city": "Delhi",
    "diet_type": "veg",
    "budget_level": "medium",
    "lifestyle": "moderately_active"
  }'
```

---

## Personalization

All personalization endpoints require authentication and a completed profile.

### 5. Get Diet Plan

Retrieve personalized diet recommendations based on user profile.

**Endpoint**: `GET /api/diet-plan`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Diet plan retrieved successfully",
  "data": {
    "profile": {
      "diet_type": "veg",
      "budget_level": "medium",
      "city": "Delhi"
    },
    "recommendations": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "diet_type": "veg",
        "budget_level": "medium",
        "region": "delhi_ncr",
        "food_name": "Broccoli",
        "reason": "Contains sulforaphane and antioxidants. Powerful for cellular health.",
        "frequency": "2-3 times per week",
        "created_at": "2026-01-06T10:00:00.000Z"
      },
      {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "diet_type": "veg",
        "budget_level": "medium",
        "region": "delhi_ncr",
        "food_name": "Bell Peppers (Shimla Mirch)",
        "reason": "High in vitamin C and antioxidants. Supports immune function.",
        "frequency": "3-4 times per week",
        "created_at": "2026-01-06T10:00:00.000Z"
      }
    ],
    "total_recommendations": 5
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "Profile not found. Please complete your profile first."
}
```

**How It Works** (Rule-Based Logic):
1. Matches user's `diet_type`, `budget_level`, and `city` (normalized)
2. If no exact match, searches by `diet_type` and `budget_level` with region='general'
3. If still no match, returns general recommendations for the `diet_type`
4. All content is pre-curated by experts, not AI-generated

**cURL Example**:
```bash
curl -X GET http://localhost:3000/api/diet-plan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 6. Get Protection Plan

Retrieve personalized protection plan based on user profile.

**Endpoint**: `GET /api/protection-plan`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Protection plan retrieved successfully",
  "data": {
    "profile": {
      "age": 28,
      "lifestyle": "moderately_active",
      "assigned_risk_band": "low"
    },
    "protection_plan": {
      "diet": [
        {
          "id": "990e8400-e29b-41d4-a716-446655440000",
          "risk_band": "low",
          "plan_type": "basic",
          "section": "diet",
          "content_text": "Focus on a balanced diet rich in fruits and vegetables. Include at least 5 servings of colorful fruits and vegetables daily.",
          "created_at": "2026-01-06T10:00:00.000Z"
        }
      ],
      "lifestyle": [
        {
          "id": "aa0e8400-e29b-41d4-a716-446655440000",
          "risk_band": "low",
          "plan_type": "basic",
          "section": "lifestyle",
          "content_text": "Engage in at least 30 minutes of moderate physical activity 5 days a week.",
          "created_at": "2026-01-06T10:00:00.000Z"
        }
      ],
      "screening": [
        {
          "id": "bb0e8400-e29b-41d4-a716-446655440000",
          "risk_band": "low",
          "plan_type": "basic",
          "section": "screening",
          "content_text": "Schedule regular health check-ups as recommended by your healthcare provider.",
          "created_at": "2026-01-06T10:00:00.000Z"
        }
      ]
    },
    "disclaimer": "This is preventive guidance only and not medical advice. Please consult healthcare professionals for medical concerns."
  }
}
```

**Risk Band Assignment** (Rule-Based Logic):
- **Low**: Age < 40 and active lifestyle
- **Moderate**: Age >= 40
- **Higher Attention**: Age >= 50 OR sedentary lifestyle

**Note**: This is NOT medical diagnosis. It's lifestyle-based risk categorization for preventive guidance only.

**cURL Example**:
```bash
curl -X GET http://localhost:3000/api/protection-plan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Error Handling

### Standard Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### HTTP Status Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created (signup successful) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Internal Server Error |
| 503 | Service Unavailable (database connection issue) |

### Common Error Scenarios

#### 1. Missing Authentication Token
**Status**: 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

#### 2. Invalid Token
**Status**: 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid token"
}
```

#### 3. Database Connection Error
**Status**: 503 Service Unavailable
```json
{
  "success": false,
  "message": "Database is not reachable. Start PostgreSQL and set DATABASE_URL, then run database/schema.sql.",
  "code": "DB_UNAVAILABLE"
}
```

#### 4. Validation Error
**Status**: 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error: age must be between 18 and 120"
}
```

---

## Authentication Flow

### Complete User Journey

```
1. Sign Up
   POST /api/auth/signup
   → Receive JWT token

2. Create Profile
   POST /api/profile
   (with Authorization header)
   → Profile created

3. Get Diet Plan
   GET /api/diet-plan
   (with Authorization header)
   → Receive personalized diet recommendations

4. Get Protection Plan
   GET /api/protection-plan
   (with Authorization header)
   → Receive personalized protection plan
```

### Token Usage

Include the JWT token in all authenticated requests:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Token Expiry**: 7 days (configurable via JWT_EXPIRES_IN environment variable)

---

## Rate Limiting

To prevent abuse, the API implements rate limiting:

- **General API**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP
- **Admin endpoints**: 10 requests per 15 minutes per IP

When rate limit is exceeded:

**Status**: 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

---

## Testing with Postman

### 1. Import Collection

Create a new Postman collection with these requests:

1. **Signup** - POST `{{baseUrl}}/api/auth/signup`
2. **Login** - POST `{{baseUrl}}/api/auth/login`
3. **Get Profile** - GET `{{baseUrl}}/api/profile`
4. **Create Profile** - POST `{{baseUrl}}/api/profile`
5. **Get Diet Plan** - GET `{{baseUrl}}/api/diet-plan`
6. **Get Protection Plan** - GET `{{baseUrl}}/api/protection-plan`

### 2. Environment Variables

Set up environment variables:
- `baseUrl`: `http://localhost:3000`
- `token`: (will be set automatically after login)

### 3. Auto-Set Token

In the "Tests" tab of Login request, add:

```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.data.token);
}
```

---

## Database Schema Reference

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### User Profiles Table
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER NOT NULL CHECK (age >= 18 AND age <= 120),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    city VARCHAR(100) NOT NULL,
    diet_type VARCHAR(20) NOT NULL CHECK (diet_type IN ('veg', 'nonveg', 'vegan')),
    budget_level VARCHAR(20) NOT NULL CHECK (budget_level IN ('low', 'medium', 'high')),
    lifestyle VARCHAR(30) NOT NULL CHECK (lifestyle IN ('sedentary', 'moderately_active', 'active')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
```

### Diet Content Table
```sql
CREATE TABLE diet_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diet_type VARCHAR(20) NOT NULL CHECK (diet_type IN ('veg', 'nonveg', 'vegan')),
    budget_level VARCHAR(20) NOT NULL CHECK (budget_level IN ('low', 'medium', 'high')),
    region VARCHAR(100) NOT NULL,
    food_name VARCHAR(200) NOT NULL,
    reason TEXT NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Protection Plan Content Table
```sql
CREATE TABLE protection_plan_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_band VARCHAR(30) NOT NULL CHECK (risk_band IN ('low', 'moderate', 'higher_attention')),
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('basic', 'complete', 'premium')),
    section VARCHAR(30) NOT NULL CHECK (section IN ('diet', 'lifestyle', 'screening')),
    content_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## Support

For issues or questions:
- Check the [Setup Guide](PHASE1-SETUP.md)
- Review [README.md](README.md)
- Contact: support@cervicare.com
