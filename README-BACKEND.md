# CerviCare Backend API

Phase 1 of a preventive healthcare platform providing personalized guidance without medical diagnosis.

## 🏗️ Architecture

```
/src
  /config          # Database and JWT configuration
  /controllers     # Business logic handlers
  /middlewares     # Authentication, validation, error handling
  /models          # Database interaction layer
  /routes          # API route definitions
  server.js        # Express server setup
```

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and JWT secret
   ```

3. **Set Up Database**
   ```bash
   # Run the SQL schema in your PostgreSQL database
   psql -d your_database_name -f database/schema.sql
   ```

4. **Start Server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Authenticate user

### User Profile (Protected)
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Create/update user profile

### Personalization (Protected)
- `GET /api/diet-plan` - Get personalized diet recommendations
- `GET /api/protection-plan` - Get personalized protection plan

### Health Check
- `GET /api/health` - Server health status

## 🔐 Authentication

All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `created_at`, `updated_at` (TIMESTAMP)

### User Profiles Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `age` (INTEGER, 18-120)
- `gender` (ENUM: male, female, other)
- `city` (VARCHAR)
- `diet_type` (ENUM: veg, nonveg, vegan)
- `budget_level` (ENUM: low, medium, high)
- `lifestyle` (ENUM: sedentary, moderately_active, active)

### Diet Content Table
- `id` (UUID, Primary Key)
- `diet_type` (ENUM)
- `budget_level` (ENUM)
- `region` (VARCHAR)
- `food_name` (VARCHAR)
- `reason` (TEXT)
- `frequency` (VARCHAR)

### Protection Plan Content Table
- `id` (UUID, Primary Key)
- `risk_band` (ENUM: low, moderate, higher_attention)
- `plan_type` (ENUM: basic, complete, premium)
- `section` (ENUM: diet, lifestyle, screening)
- `content_text` (TEXT)

## 🎯 Rule-Based Personalization

### Diet Plan Logic
1. Match user's `diet_type`, `budget_level`, and `city`
2. Fallback to broader search if no exact match
3. Return general recommendations for diet type if needed

### Protection Plan Logic
1. Assign risk band based on age and lifestyle:
   - Age < 40: `low`
   - Age 40-49: `moderate`
   - Age ≥ 50 OR sedentary lifestyle: `higher_attention`
2. Return content matching assigned risk band
3. Organize by sections: diet, lifestyle, screening

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Request rate limiting
- Input validation with Joi
- CORS protection
- Security headers with Helmet

## 🚀 Deployment on Render

1. Connect your GitHub repository
2. Set environment variables in Render dashboard
3. Use the following build command:
   ```bash
   npm install
   ```
4. Use the following start command:
   ```bash
   npm start
   ```

## 📝 Environment Variables

```env
DATABASE_URL=postgresql://username:password@localhost:5432/cervicare_db
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
```

## 🔄 Data Flow

1. **User Registration** → User created → JWT token issued
2. **Profile Creation** → Lifestyle data stored → Personalization enabled
3. **Diet Plan Request** → Profile read → Content matched → Recommendations returned
4. **Protection Plan Request** → Risk band assigned → Content filtered → Plan returned

## ⚠️ Important Notes

- This platform provides **preventive guidance only**
- **No medical diagnosis or disease prediction**
- **No AI decision-making** - all content is expert-curated
- All personalization is **rule-based and deterministic**
- Users should consult healthcare professionals for medical concerns
