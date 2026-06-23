# waPoint — AI-Powered Barber Appointment Platform

Multi-tenant SaaS platform with WhatsApp AI assistant for barber shops. Customers book online or via WhatsApp natural language — AI handles the conversation.

## Architecture

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Next.js 16  │────▶│ PostgreSQL  │     │   Redis 7    │
│  (App Router)│     │   (Prisma)  │     │  (ioredis)   │
└──────┬───────┘     └─────────────┘     └──────┬───────┘
       │                                        │
       ▼                                        ▼
┌──────────────┐     ┌──────────────────────────────┐
│  Super Admin │     │      Evolution API v2         │
│  Panel       │     │  (WhatsApp Baileys Bridge)    │
│  Barber Panel│     └──────────────────────────────┘
│  Customer    │
│  Booking     │
│  AI Webhook  │
└──────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Database** | PostgreSQL 16 + Prisma 6 ORM |
| **Cache** | Redis 7 (ioredis) |
| **Auth** | NextAuth v5 (Credentials + JWT) |
| **UI** | Tailwind CSS + Shadcn UI |
| **LLM** | OpenAI / Google Gemini / OpenRouter / Groq |
| **WhatsApp** | Evolution API v2.2.1 (Baileys) |
| **Deployment** | Docker Compose |

## Features

### 👑 Super Admin Panel (`/super-admin/login`)
- Dashboard with barber stats
- Barber CRUD (create/edit/delete)
- LLM provider settings (OpenAI, Gemini, OpenRouter, Groq)
- API key management (AES-256-CBC encrypted storage)

### ✂️ Barber Panel (`/barber/login`)
- Dashboard with appointment overview
- Service management (name, duration, price)
- Working hours editor (7-day, minute-precision)
- WhatsApp QR code connection
- Appointment list with status management (confirm/complete/cancel)

### 🌐 Customer Booking (`/[slug]`)
- Public booking widget by barber slug
- Service selection with prices
- Date picker with real-time slot availability
- WhatsApp OTP verification (optional)
- Confirmation with appointment details

### 🤖 WhatsApp AI Assistant
- Natural language booking via WhatsApp
- LLM function calling (5 tools: services, slots, book, query, cancel)
- Turkish language system prompt
- Multi-round conversation with tool execution
- `/yardim` command for help

### 🔐 Security
- JWT-based authentication (super admin + barber separation)
- API keys encrypted at rest (AES-256-CBC)
- OTP phone verification via WhatsApp
- Route-level middleware protection

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm

### 1. Clone & Install

```bash
git clone <repo-url> wapoint
cd wapoint
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `EVOLUTION_API_URL` | Evolution API base URL |
| `EVOLUTION_API_KEY` | Evolution API master key |
| `NEXTAUTH_SECRET` | JWT signing secret |
| `NEXTAUTH_URL` | App base URL |
| `SUPER_ADMIN_EMAIL` | Super admin login email |
| `SUPER_ADMIN_PASSWORD` | Super admin login password |
| `ENCRYPTION_KEY` | 32-char hex key for API key encryption |

### 3. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on port 5432
- **Redis 7** on port 6379
- **Evolution API v2.2.1** on port 8080

### 4. Database

```bash
npx prisma migrate dev --name init
```

### 5. Seed Super Admin

```bash
npx prisma db seed
```

Or run via API after starting the app.

### 6. Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── [slug]/              # Customer booking page
│   ├── api/
│   │   ├── appointments/    # Create appointment
│   │   ├── auth/            # NextAuth routes
│   │   ├── barber/          # Barber's appointments API
│   │   ├── otp/             # OTP send/verify
│   │   ├── public/[slug]/   # Public services & slots API
│   │   └── whatsapp/        # Instance, QR, webhook, disconnect
│   ├── barber/              # Barber panel (5 pages)
│   └── super-admin/         # Super admin panel (5 pages)
├── components/
│   └── ui/                  # Shadcn components
│   └── shared/              # WhatsApp connect client component
└── lib/
    ├── llm/                 # LLM factory, providers, booking agent
    ├── whatsapp/            # Evolution API client, OTP
    ├── auth.ts              # NextAuth config
    ├── crypto.ts            # AES-256-CBC encryption
    ├── prisma.ts            # Prisma singleton
    ├── redis.ts             # ioredis singleton
    └── slots.ts             # Slot availability algorithm
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/public/[slug]/services` | List barber services |
| GET | `/api/public/[slug]/slots?date=&serviceId=` | Get available slots |
| POST | `/api/appointments` | Create appointment |
| POST | `/api/otp/send` | Send OTP via WhatsApp |
| POST | `/api/otp/verify` | Verify OTP code |
| GET/POST | `/api/whatsapp/instance` | Create/check instance |
| GET | `/api/whatsapp/qrcode` | Get QR code |
| POST | `/api/whatsapp/disconnect` | Disconnect instance |
| POST | `/api/whatsapp/webhook` | WhatsApp webhook (LLM AI) |
| GET/PATCH | `/api/barber/appointments` | Barber's appointment management |

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker (Production)

```bash
docker compose -f docker-compose.yml up -d
```

### Environment Variables

All required variables are documented in `.env.example`. Never commit `.env` to version control.

## License

MIT
