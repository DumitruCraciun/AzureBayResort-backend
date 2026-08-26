# 🏨 Azure Bay Resort - Backend API

> Full-stack hotel booking system backend built with Node.js, Express, and PostgreSQL.

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Express](https://img.shields.io/badge/Express-4.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-orange)
![JWT](https://img.shields.io/badge/JWT-Authentication-purple)
![Stripe](https://img.shields.io/badge/Stripe-Payments-blueviolet)

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Technologies](#-technologies)
- [API Endpoints](#-api-endpoints)
- [Setup Instructions](#-setup-instructions)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 📖 Overview

Azure Bay Resort is a complete hotel booking system. This backend API handles:

- 👤 **User authentication** with JWT
- 🏨 **Room management** with images and filters
- 📅 **Booking system** with availability checking
- 💳 **Payment processing** with Stripe
- 📧 **Email notifications** with Nodemailer
- 🖼️ **Image optimization** with Sharp

---

## 🛠️ Technologies

### Core
- **Node.js** (v18+) - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** (Supabase) - Database

### Security & Authentication
- **JSON Web Tokens (JWT)** - Authentication
- **bcrypt** - Password hashing
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **CORS** - Cross-origin resource sharing

### Payment & Email
- **Stripe** - Payment processing
- **Nodemailer** - Email sending
- **Brevo (Sendinblue)** - SMTP service

### Utilities
- **Joi** - Request validation
- **Sharp** - Image optimization
- **multer** - File upload handling

---

## 📡 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/auth/profile` | Get user profile |
| `PUT` | `/api/auth/profile` | Update profile |
| `POST` | `/api/auth/change-password` | Change password |

### 🏨 Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rooms` | Get all rooms (with filters) |
| `GET` | `/api/rooms/types` | Get room types |
| `GET` | `/api/rooms/:id` | Get room details |
| `GET` | `/api/rooms/:id/availability` | Check availability |

**Room Filters:**
- `?minPrice=50&maxPrice=150`
- `?maxOccupancy=2`
- `?roomType=Double`
- `?features=WiFi,TV`

### 📅 Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/bookings` | Create booking |
| `GET` | `/api/bookings` | Get user bookings |
| `GET` | `/api/bookings/:id` | Get booking details |
| `PUT` | `/api/bookings/:id/cancel` | Cancel booking |

### 💳 Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/create-intent` | Create Stripe payment intent |
| `PUT` | `/api/payments/confirm/:id` | Confirm booking after payment |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (or Supabase account)
- Stripe account
- Gmail or Brevo account for emails

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DumitruCraciun/AzureBayResort-backend.git
   cd AzureBayResort-backend