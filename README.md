<div align="center">

# 🌸 CerviCare Backend

### *AI-Powered Preventive Healthcare Platform for Cervical Health*

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

> **CerviCare** is a production-ready REST API backend that powers a preventive healthcare web application focused on cervical health awareness, AI-driven risk assessment, and personalized protection planning.

</div>

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Secure signup/login with bcrypt password hashing and role-based access control |
| 👤 **User Profiles** | Comprehensive health profile management (age, lifestyle, diet, location) |
| 🤖 **CerviBOT** | AI-powered cervical health chatbot (Python + FastAPI sub-project) |
| 🎨 **Avatar System** | AI-generated DiceBear avatars, random selection, and custom uploads |
| 📊 **Analytics Dashboard** | Admin analytics: user growth, engagement metrics, risk distribution |
| 🛡️ **Protection Plans** | Personalized cervical health protection plans with progress tracking |
| 🔔 **Webhook Integration** | Bot interaction logging and n8n automation workflow support |
| 🚀 **Production Ready** | Helmet security, rate limiting, CORS, graceful shutdown, and structured logging |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser / App)                       │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────────────────┐
│                    CerviCare Backend API (Express.js)               │
│                                                                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │   Routes   │  │Controllers │  │  Services  │  │  Middleware │  │
│  │  /api/auth │─▶│authCtrl    │─▶│GoogleShts  │  │  JWT auth   │  │
│  │  /api/prof │  │profileCtrl │  │SheetsSync  │  │  Rate limit │  │
│  │  /api/avt  │  │avatarCtrl  │  │Analytics   │  │  CORS/Helmet│  │
│  │  /api/admin│  │adminCtrl   │  │Seeder      │  │  Roles RBAC │  │
│  │  /api/bot  │  │webhookCtrl │  │Automation  │  │  Validation │  │
│  └────────────┘  └────────────┘  └────────────┘  └─────────────┘  │
│                                        │                            │
└────────────────────────────────────────┼────────────────────────────┘
                                         │
           ┌─────────────────────────────┼──────────────────┐
           │                             │                   │
    ┌──────▼──────┐            ┌─────────▼────────┐  ┌─────▼──────┐
    │  PostgreSQL  │            │  Google Sheets   │  │  CerviBOT  │
    │  (Neon DB)   │            │  (Logging/CRM)   │  │  (Python)  │
    └─────────────┘            └──────────────────┘  └────────────┘
```

---

## 📁 Project Structure

```
cervicare-backend/
├── src/
│   ├── config/              # DB, JWT, Google Sheets configuration
│   ├── controllers/         # Route handler logic
│   ├── middleware/          # Auth, roles, security, validation
│   ├── models/              # Database query models
│   ├── routes/              # Express route definitions
│   ├── services/            # Business logic & external integrations
│   └── server.js            # App entry point
├── CerviBOT/                # AI chatbot (Python/FastAPI subproject)
│   ├── app.py               # FastAPI application
│   ├── requirements.txt
│   └── Dockerfile
├── database/
│   ├── schema.sql           # Canonical DB schema
│   └── seed.sql             # Sample data for development
├── docs/
│   └── API.md               # Full API reference
├── .env.example             # Environment variable template
├── render.yaml              # Render.com deployment config
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** (or a [Neon](https://neon.tech) serverless instance)

### 1. Clone & Install

```bash
git clone https://github.com/satyamr814/cervicare-backend.git
cd cervicare-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your actual values (see [Environment Variables](#-environment-variables) below).

### 3. Set Up the Database

```bash
# Run the schema against your PostgreSQL instance
psql $DATABASE_URL -f database/schema.sql

# (Optional) Load sample data
psql $DATABASE_URL -f database/seed.sql
```

### 4. Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`.

### 5. Verify

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "CerviCare API is running",
  "environment": "development",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (e.g. Neon, Supabase, local) |
| `JWT_SECRET` | ✅ | Long random string for signing JWT tokens |
| `PORT` | ❌ | Server port (default: `3000`) |
| `NODE_ENV` | ❌ | `development` or `production` |
| `ADMIN_KEY` | ✅ | Secret key for admin-only API endpoints |
| `GOOGLE_SHEETS_ID` | ❌ | Google Sheets spreadsheet ID for logging |
| `GOOGLE_CLIENT_EMAIL` | ❌ | Google service account email |
| `GOOGLE_PRIVATE_KEY` | ❌ | Google service account private key |
| `CORS_ORIGIN` | ❌ | Allowed origin(s) for CORS (default: `*`) |
| `BCRYPT_ROUNDS` | ❌ | bcrypt salt rounds (default: `12`) |

See `.env.example` for the full template with descriptions.

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login, returns JWT token |

### User Profile
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/profile/:userId` | JWT | Get user profile |
| `POST` | `/api/profile` | JWT | Create or update profile |

### Avatar
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/avatar/current/:userId` | JWT | Get current avatar |
| `GET` | `/api/avatar/random` | JWT | Get a random DiceBear avatar |
| `POST` | `/api/avatar/generate-ai` | JWT | Generate AI-style DiceBear avatar |
| `POST` | `/api/avatar/upload` | JWT | Upload custom avatar (base64) |

### Protection Plans
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/protection/:userId` | JWT | Get user's protection plans & score |
| `POST` | `/api/protection/plans/update` | JWT | Update plan status/notes |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | `X-Admin-Key` | Export user & profile data |
| `GET` | `/api/analytics` | JWT + Admin | Platform analytics |

### System
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Basic health check |
| `POST` | `/api/bot-data/webhook` | Public | CerviBOT interaction logging |

> 📄 See [`docs/API.md`](docs/API.md) for full request/response schemas.

---

## 🤖 CerviBOT

CerviBOT is a separate AI chatbot microservice built with **Python + FastAPI** located in the `CerviBOT/` directory. It provides intelligent responses about cervical health, HPV, screening schedules, and prevention.

```bash
cd CerviBOT
pip install -r requirements.txt
python app.py
```

See [`CerviBOT/README.md`](CerviBOT/README.md) for details.

---

## 🛡️ Security

- **Helmet.js** — Sets security-hardened HTTP headers
- **Rate Limiting** — Per-IP limits on auth (10/min) and API (100/min) endpoints
- **JWT** — All protected routes require `Authorization: Bearer <token>`
- **bcrypt** — Passwords hashed with configurable salt rounds (default 12)
- **CORS** — Configurable allowed origins via `.env`
- **Input Validation** — Joi schema validation on all inputs
- **RBAC** — Role-based access control (`user`, `admin`)

---

## 🧪 Running Tests

```bash
npm test
```

---

## 🌐 Deployment

This project is configured for **Render.com** via `render.yaml`.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

1. Fork this repository
2. Connect to Render
3. Set environment variables in the Render dashboard
4. Deploy — Render will detect `render.yaml` automatically

---

## 📸 Screenshots

| Home Dashboard | Protection Plan | CerviBOT |
|---|---|---|
| *Coming Soon* | *Coming Soon* | *Coming Soon* |

---

## 👨‍💻 Author

**Satyam Raj** · [GitHub](https://github.com/satyamr814)

---

<div align="center">

Made with ❤️ for women's health awareness

⭐ Star this project if you find it useful!

</div>
