# CerviCare API Reference

This document provides a summary of the available API endpoints for the CerviCare Backend.

## Authentication
| Endpoint | Method | Description | Payload |
| :--- | :--- | :--- | :--- |
| `/api/auth/signup` | `POST` | Register a new user | `{ email, password }` |
| `/api/auth/login` | `POST` | Authenticate and get token | `{ email, password }` |

## Profiles
| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/profile/:userId` | `GET` | Bearer JWT | Retrieve health profile |
| `/api/profile` | `POST` | Bearer JWT | Update or create health profile |

## Avatars
| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/avatar/current/:userId` | `GET` | Bearer JWT | Get user's current avatar |
| `/api/avatar/random` | `GET` | Bearer JWT | Fetch a random DiceBear avatar |
| `/api/avatar/generate-ai` | `POST` | Bearer JWT | Generate AI-styled avatar |
| `/api/avatar/upload` | `POST` | Bearer JWT | Upload a custom base64 image |

## Protection Plans
| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/protection/:userId` | `GET` | Bearer JWT | Get protection plan & score |
| `/api/protection/plans/update` | `POST` | Bearer JWT | Update status of a specific plan |

## System & Bot
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Simple health check |
| `/api/bot-data/webhook` | `POST` | Log bot interactions |

---

> [!NOTE]
> All protected routes require a `Authorization: Bearer <TOKEN>` header.
