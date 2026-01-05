# CerviCare Backend Architecture & Data Flow Explanation

## 🏗️ System Architecture Overview

CerviCare Phase 1 is built on a clean, production-ready Node.js/Express backend with PostgreSQL database. The architecture follows MVC (Model-View-Controller) pattern with clear separation of concerns.

## 📊 Data Flow Architecture

### 1. User Registration & Authentication Flow
```
User Request → Validation → User Model → Database → JWT Token → Response
```

**Detailed Flow:**
1. **Request**: User submits email/password to `/api/auth/signup`
2. **Validation**: Joi middleware validates input format
3. **Model**: User model checks for existing email, hashes password
4. **Database**: Creates user record with UUID primary key
5. **JWT**: Generates 24-hour token with user ID
6. **Response**: Returns user data and authentication token

### 2. Profile Management Flow
```
Authenticated Request → Auth Middleware → Profile Model → Database → Response
```

**Detailed Flow:**
1. **Authentication**: JWT token verified in auth middleware
2. **Profile Data**: User submits lifestyle/demographic information
3. **Storage**: Profile model upserts (creates or updates) user profile
4. **Relationship**: Profile linked to user via foreign key constraint
5. **Response**: Returns complete profile data

### 3. Personalization Engine Flow
```
Authenticated Request → Profile Lookup → Rule Engine → Content Matching → Response
```

**Diet Plan Personalization:**
1. **Profile Retrieval**: Fetch user's diet_type, budget_level, city
2. **Content Matching**: Query diet_content table with exact filters
3. **Fallback Logic**: If no exact match, broaden search criteria
4. **Response**: Return personalized food recommendations

**Protection Plan Personalization:**
1. **Risk Assignment**: Rule-based risk band calculation (age + lifestyle)
2. **Content Filtering**: Query protection_plan_content by risk band
3. **Organization**: Group content by sections (diet, lifestyle, screening)
4. **Response**: Return structured protection plan with disclaimer

## 🛡️ Safety Architecture: Preventing Medical Logic

### 1. Data-Driven Content Only
- **No AI/ML**: All content is expert-curated and manually entered
- **Static Content**: Diet and protection content stored in database tables
- **No Predictions**: System provides guidance, not diagnosis

### 2. Rule-Based Personalization
```javascript
// Example: Risk band assignment (NOT medical diagnosis)
let riskBand = 'low';
if (profile.age >= 40) riskBand = 'moderate';
if (profile.age >= 50 || profile.lifestyle === 'sedentary') {
  riskBand = 'higher_attention';
}
```

### 3. Explicit Disclaimers
- All responses include preventive guidance disclaimers
- Users directed to healthcare professionals for medical concerns
- No medical claims or diagnostic language used

### 4. Input Validation & Sanitization
- Joi schema validation for all inputs
- Enum constraints in database for critical fields
- SQL parameterization prevents injection attacks

## 🔄 Integration-Ready Architecture

### 1. RESTful API Design
- Clean HTTP methods (GET, POST)
- Consistent response format
- Standard HTTP status codes
- JWT-based stateless authentication

### 2. Future Automation Integration
The architecture is designed for easy integration with:
- **WhatsApp Business API**: Webhook endpoints can consume the same API
- **n8n Workflows**: HTTP request nodes can call existing endpoints
- **Third-party services**: JWT authentication allows secure integration

### 3. Scalability Considerations
- **Stateless Design**: JWT tokens enable horizontal scaling
- **Connection Pooling**: PostgreSQL connection pool for performance
- **Rate Limiting**: Built-in protection against abuse
- **Environment Variables**: Easy deployment across environments

## 📡 API Endpoint Design Philosophy

### Authentication Endpoints
- `POST /api/auth/signup`: User creation with validation
- `POST /api/auth/login`: Token-based authentication

### Profile Endpoints (Protected)
- `GET /api/profile`: Retrieve user's lifestyle data
- `POST /api/profile`: Create/update profile with validation

### Personalization Endpoints (Protected)
- `GET /api/diet-plan`: Rule-based diet recommendations
- `GET /api/protection-plan`: Risk-stratified protection guidance

### Health Check
- `GET /api/health`: Service status monitoring

## 🗄️ Database Design Principles

### 1. Normalization & Relationships
- **Users**: Core authentication data
- **User Profiles**: One-to-one relationship with users
- **Content Tables**: Expert-curated, no user-generated content
- **Foreign Keys**: Data integrity enforced at database level

### 2. Indexing Strategy
- Composite indexes for common query patterns
- Unique constraints on critical fields (email, user_id)
- Performance optimization for personalization queries

### 3. Data Types & Constraints
- UUID primary keys for security and scalability
- ENUM types for controlled vocabularies
- CHECK constraints for data validation
- Timestamps for audit trails

## 🔐 Security Architecture

### 1. Authentication Layer
- JWT tokens with 24-hour expiration
- Bcrypt password hashing (10 rounds)
- Secure token generation and verification

### 2. Authorization Layer
- Route-level authentication middleware
- User context injection into requests
- Protected endpoint enforcement

### 3. Input Validation
- Joi schema validation for all inputs
- SQL parameterization
- Request size limits
- Rate limiting per IP

### 4. Infrastructure Security
- Helmet.js for security headers
- CORS configuration
- Environment variable management
- Graceful error handling without information leakage

## 🚀 Deployment Architecture

### Render.com Compatibility
- **Build Process**: `npm install`
- **Start Command**: `npm start`
- **Port Configuration**: Environment variable driven
- **Database**: Managed PostgreSQL service
- **Environment Variables**: Secure configuration management

### Production Considerations
- **Graceful Shutdown**: SIGTERM/SIGINT handling
- **Health Monitoring**: `/api/health` endpoint
- **Error Logging**: Structured error reporting
- **Performance Monitoring**: Request timing and response tracking

## 📈 Future Extensibility

### 1. Content Management
- Easy addition of new diet recommendations
- Scalable protection plan content
- Regional content variations

### 2. Personalization Enhancement
- Additional lifestyle factors
- More sophisticated rule engines
- A/B testing framework

### 3. Integration Points
- Webhook endpoints for real-time notifications
- Scheduled content delivery
- Analytics and reporting endpoints

This architecture ensures CerviCare remains a safe, scalable, and maintainable preventive healthcare platform while strictly adhering to the no-diagnosis, no-AI decision-making requirements.
