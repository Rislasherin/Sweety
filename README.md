# Sweety – Blood Glucose Tracker

[![Automated Tests](https://img.shields.io/badge/tests-447%20passing-brightgreen)](#13-testing-and-code-quality)
[![Backend Tests](https://img.shields.io/badge/backend-279%20passing-blue)](#13-testing-and-code-quality)
[![Frontend Tests](https://img.shields.io/badge/frontend-168%20passing-blue)](#13-testing-and-code-quality)

Sweety is a full-stack web application designed for patients to track, manage, and review their daily blood glucose levels across standard meal windows.

> [!IMPORTANT]
> **Medical Disclaimer**: Sweety is a personal tracking and reporting tool intended for self-monitoring. Glucose reference ranges, daily averages, and trend charts are provided solely for general informational reference and must not be interpreted as medical advice, clinical diagnoses, or treatment recommendations. Users should always consult a qualified healthcare professional regarding their target glucose levels and personal diabetes management plan.

---

## Table of Contents

1. [Project Introduction](#1-project-introduction)
2. [Key Features](#2-key-features)
3. [Screenshots and Application Preview](#3-screenshots-and-application-preview)
4. [Technology Stack](#4-technology-stack)
5. [Architecture Overview](#5-architecture-overview)
6. [Project Structure](#6-project-structure)
7. [Prerequisites](#7-prerequisites)
8. [Local Installation and Setup](#8-local-installation-and-setup)
9. [Demo Account and Seed Data](#9-demo-account-and-seed-data)
10. [Running the Application](#10-running-the-application)
11. [Docker Compose](#11-docker-compose)
12. [API Overview](#12-api-overview)
13. [Testing and Code Quality](#13-testing-and-code-quality)
14. [Additional Work and Bonus Features](#14-additional-work-and-bonus-features)
15. [Notes and Future Improvements](#15-notes-and-future-improvements)
16. [License](#16-license)

---

## 1. Project Introduction

Managing diabetes and monitoring metabolic health requires consistent blood glucose logging across daily meal windows. When patients rely on physical logbooks or informal spreadsheets, records often suffer from missing meal context, duplicate entries, timezone confusion across calendar days, and difficulty reviewing longer-term trends.

Sweety addresses these challenges by providing a structured four-slot daily tracking workflow, date-only calendar modeling stored at UTC midnight, user-specific data isolation, and database-level aggregate reporting. Patients can review their readings on a daily, month-to-date, or previous-month basis, visualized through accessible custom SVG charts.

The application is built with Node.js, Express, React 19, TypeScript, PostgreSQL via Prisma ORM, and Tailwind CSS. The backend follows Clean Architecture principles with clear separation between domain logic, use cases, and infrastructure, while the frontend is organized using Atomic Design component patterns.

---

## 2. Key Features

### Authentication and User Management
- **Registration and Login**: Validates email format, normalizes email casing, and enforces password requirements.
- **Secure Password Storage**: Uses BCrypt password hashing.
- **Token-Based Authentication**: Short-lived JWT access tokens paired with HttpOnly refresh cookies supporting automatic token rotation and revocation.
- **User Data Isolation**: All database queries, readings, and aggregate reports are strictly scoped to the authenticated user ID.

### Glucose Reading Management
- **Complete Reading CRUD**: Create, view, edit, and delete glucose readings.
- **Four Daily Meal Slots**: Canonical daily slots: `MORNING`, `AFTER_BREAKFAST`, `AFTER_LUNCH`, and `AFTER_DINNER`.
- **Validation Rules**: Restricts glucose values to integers between 40 and 600 mg/dL inclusive; prevents logging future dates.
- **Duplicate Slot Handling**: Enforces one reading per meal slot per day via database constraints, returning HTTP 409 if a duplicate is attempted while allowing in-place edits.
- **Pagination**: Supports page-based navigation with configurable page size limits.

### Reports and Insights
- **Daily Report**: Aggregates highest, lowest, average (rounded to 1 decimal place), reading count, and chronological slot breakdown with an accessible SVG slot curve.
- **Month-to-Date Report**: Calculates aggregate statistics from the 1st of the active month through the selected date.
- **Previous Full-Month Report**: Calculates aggregate metrics across the full preceding calendar month, accounting for varying month lengths, leap years, and year rollovers.
- **Monthly Glucose Trend Chart**: Responsive SVG line chart displaying daily glucose averages across active monthly reporting periods alongside neutral scale reference lines (70, 100, 140 mg/dL).
- **Informational Reference Ranges**: Displays general informational benchmarks (Low: < 70, Normal: 70–99, Elevated: 100–125, High: ≥ 126 mg/dL) visualized with an SVG spread gauge.
- **Contextual Empty States**: Patient-friendly empty states guide users when viewing dates or periods without logged data.

### Developer and Infrastructure Features
- **Dynamic Demo Data Seeding**: Automatically generates relative demo data for the current and previous months without hardcoded dates.
- **Structured Logging**: Uses Pino for structured JSON logging with automatic redaction of sensitive credentials, passwords, and tokens.
- **Health Check Endpoint**: Dedicated `/api/health` endpoint for uptime monitoring and container probes.
- **Docker Compose**: Containerized multi-service configuration for PostgreSQL, backend, and frontend.

---

## 3. Screenshots and Application Preview

The screenshots below illustrate the interface and features captured from the running application.

### Daily Report View
Summary cards (highest, lowest, average, reading count), an accessible SVG meal slot curve, and a chronological breakdown of the day's readings.
![Daily Reports Dashboard](docs/screenshots/daily_report.png)

### Month-to-Date Report View
Aggregated metrics from the 1st of the month through the selected date, featuring the glycemic spread gauge and the monthly daily-average trend chart.
![Month-to-Date Report](docs/screenshots/month_to_date_report.png)

### Previous Month Report View
Aggregated historical metrics and daily trend trajectory for the preceding calendar month.
![Previous Month Report](docs/screenshots/previous_month_report.png)

### Readings Log & Management
Tabular reading history showing recorded values, meal slot badges, informational status pills, date filters, and pagination controls.
![Readings Log](docs/screenshots/readings_log.png)

### Contextual Empty State
Non-blocking empty state presented when navigating to a date without logged readings, guiding the patient to record their first entry.
![Daily Report Empty State](docs/screenshots/daily_report_empty.png)

### Mobile Responsive Layout
Smartphone viewport demonstration showing single-column layout adaptations, accessible touch targets, and mobile navigation.
![Mobile Responsive View](docs/screenshots/mobile_responsive.png)

---

## 4. Technology Stack

| Layer | Technologies & Libraries | Verified Versions |
|---|---|---|
| **Backend** | Express, Node.js, TypeScript, Pino, BCrypt, jsonwebtoken, Zod, class-validator | Express 5.3, TypeScript 5.9, Pino 10.4, BCrypt 6.0 |
| **Frontend** | React, Vite, Tailwind CSS, React Router, Axios | React 19.3, Vite 8.3, Tailwind CSS 4.3, React Router 7.18 |
| **Database & ORM** | PostgreSQL, Prisma ORM | PostgreSQL 16/17, Prisma 6.19 |
| **Testing** | Vitest, Supertest, React Testing Library | Vitest 5.1, Supertest 7.3, RTL 16.3 |
| **Infrastructure** | Docker, Docker Compose, Nginx | Node 22 Alpine, Nginx Alpine, PostgreSQL 17 Alpine |

---

## 5. Architecture Overview

Sweety is organized around Clean Architecture principles on the backend and Atomic Design on the frontend:

```mermaid
flowchart LR
    Client["Frontend Client<br/>(React 19 + Vite 8)"] -->|"REST API / JSON"| Presentation["Presentation Layer<br/>(Routes, Controllers, Middleware)"]
    Presentation --> Application["Application Layer<br/>(Use Cases & DTOs)"]
    Application --> Domain["Domain Layer<br/>(Entities & Value Objects)"]
    Application --> Infrastructure["Infrastructure Layer<br/>(Prisma Repositories & Services)"]
    Infrastructure --> DB[("PostgreSQL Database<br/>(Prisma 6.19)")]
```

### Layer Responsibilities
- **Presentation Layer**: Handles incoming HTTP requests, validates request payloads with class-validator and Zod DTO schemas, manages CORS and cookies, and formats outgoing responses.
- **Application Layer**: Contains use cases that orchestrate application workflows (e.g., logging a reading, computing daily or monthly statistics) and map entities to typed response DTOs.
- **Domain Layer**: Contains core business models (`Reading`, `User`), value objects (`GlucoseValue`, `Email`), and domain repository interfaces. It has zero external dependencies.
- **Infrastructure Layer**: Implements domain repository interfaces using Prisma Client and PostgreSQL, handles BCrypt password hashing, signs and verifies JWT tokens, and formats structured log output.

---

## 6. Project Structure

```text
sweety/
├── client/
│   ├── src/
│   │   ├── components/        # Atomic UI elements (atoms, molecules, organisms, templates)
│   │   ├── features/          # Feature domains: auth, readings, reports, home
│   │   ├── services/          # Axios API client with interceptors
│   │   └── test/              # Vitest & React Testing Library suites (17 test files)
│   ├── Dockerfile             # Multi-stage client build with Nginx
│   ├── nginx.conf             # SPA routing fallback & API reverse proxy
│   └── package.json
├── server/
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma schema and model definitions
│   │   ├── seed.ts            # Dynamic demo data seeding script
│   │   └── migrations/        # Applied SQL migrations
│   ├── src/
│   │   ├── domain/            # Entities, value objects, and repository interfaces
│   │   ├── application/       # Use cases and DTOs
│   │   ├── infrastructure/    # Prisma repositories, security, and logger
│   │   ├── presentation/      # Express controllers, routes, and middleware
│   │   └── main/              # Composition root and server entry point
│   ├── tests/
│   │   ├── unit/              # Isolated domain, use case, and utility tests (19 test files)
│   │   ├── integration/       # Supertest HTTP route tests (5 test files)
│   │   └── e2e/               # Live PostgreSQL integration tests (4 test files)
│   ├── Dockerfile             # Multi-stage server build
│   └── package.json
├── docs/
│   └── screenshots/           # Application preview screenshots
├── docker-compose.yml         # Container orchestration configuration
├── .env.example               # Root Docker Compose environment template
└── README.md
```

---

## 7. Prerequisites

Before installing, ensure the following tools are available on your system:

- **Node.js**: `v20.x` or `v22.x` (`v22.12+` recommended)
- **npm**: `v10.x` or higher
- **PostgreSQL**: `v16` or `v17` (if running locally)
- **Docker & Docker Compose**: Optional, for containerized execution

---

## 8. Local Installation and Setup

Follow these steps to set up the project locally from a fresh clone:

### Step 1: Clone the repository
```bash
git clone https://github.com/Rislasherin/Sweety.git
cd sweety
```

### Step 2: Install backend dependencies
```bash
cd server
npm install
```

### Step 3: Install frontend dependencies
```bash
cd ../client
npm install
cd ..
```

### Step 4: Configure environment files

The repository includes three distinct `.env.example` templates designed for different deployment contexts. Create your local `.env` files from these templates before starting the application:

1. **Backend Local Configuration (`server/.env`):**
   Used by the Express backend server during local native development.
   ```bash
   cp server/.env.example server/.env
   ```
   Configure the following variables in `server/.env`:
   - `PORT`: HTTP port the backend binds to locally (e.g. `5001`).
   - `NODE_ENV`: Runtime environment (`development`, `production`, or `test`).
   - `DATABASE_URL`: PostgreSQL connection string (see database port instructions below).
   - `JWT_SECRET`: Secret key for signing and verifying JWT tokens (minimum 32 characters).
   - `JWT_EXPIRATION`: Token lifetime (e.g. `1d` or `15m`). Note that `server/src/main/config/env.ts` accepts both `JWT_EXPIRATION` and `JWT_EXPIRES_IN`.
   - `JWT_ISSUER`: Token issuer claim (default: `sweety-api`).
   - `JWT_AUDIENCE`: Token audience claim (default: `sweety-client`).
   - `CORS_ORIGIN`: Comma-separated list of allowed browser origins (e.g. `http://localhost:5173,http://127.0.0.1:5173`).
   - `LOG_LEVEL`: Pino logger level (`trace`, `debug`, `info`, `warn`, `error`).
   - `DEMO_USER_EMAIL`: Email for the seeded demo patient (default: `demo@sweety.app`).
   - `DEMO_USER_NAME`: Display name for the demo patient.
   - `DEMO_USER_PASSWORD`: Password for the demo account (minimum 8 characters; never hardcoded in source).

2. **Frontend Local Configuration (`client/.env`):**
   Used by Vite during local client development.
   ```bash
   cp client/.env.example client/.env
   ```
   - `VITE_API_BASE_URL`: Base URL for API requests. For local development against a host backend running on port 5001, set `VITE_API_BASE_URL="http://localhost:5001/api"`.

3. **Root Docker Configuration (`.env`):**
   Used by Docker Compose when running containerized services.
   ```bash
   cp .env.example .env
   ```
   Contains Compose container variables: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` (`5432` or mapped `5433`), `BACKEND_PORT` (`3000` or mapped `5001`), `FRONTEND_PORT` (`80` or mapped `3001`), `JWT_SECRET`, and `JWT_EXPIRES_IN`.

### Database Port Instructions for Local Development

When configuring `DATABASE_URL` in `server/.env`, ensure you connect to the appropriate port:

- **When using Docker PostgreSQL from the local host backend:**
  In Docker Compose, PostgreSQL is mapped to host port **`5433`** by default to prevent port conflicts with any local PostgreSQL instance. Configure your local `server/.env` connection string as:
  ```ini
  DATABASE_URL="postgresql://postgres:postgres@localhost:5433/sweety_db?schema=public"
  ```
- **When using a locally installed PostgreSQL instance:**
  Use your actual native PostgreSQL host port, normally **`5432`**:
  ```ini
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sweety_db?schema=public"
  ```

*(Do not confuse the PostgreSQL internal container port `5432` with its host-accessible published port `5433`.)*

### Step 5: Start or verify PostgreSQL
Ensure your target PostgreSQL database exists:
```bash
# Example using psql
psql -U postgres -c "CREATE DATABASE sweety_db;"
```

### Step 6: Apply Prisma migrations
Run the Prisma migration tool to generate the schema tables:
```bash
cd server
npx prisma migrate deploy
```

### Step 7: Seed demo data
Execute the idempotent seed script:
```bash
npm run seed
```

---

## 9. Demo Account and Seed Data

The project includes an automated demo seed script (`server/prisma/seed.ts`):

- **Execution Command**:
  ```bash
  cd server
  npm run seed
  ```
- **Demo Account**: Creates or updates a patient account using `DEMO_USER_EMAIL` (default `demo@sweety.app`) and the password configured in `DEMO_USER_PASSWORD`.
- **Dynamic Relative Dates**: Calculates reading dates relative to the date of execution:
  - **Current Month**: Seeds up to 8 dates ending on the current date, ensuring no future readings are created.
  - **Previous Month**: Seeds 8 dates distributed across the preceding calendar month, automatically handling leap years and varying month lengths.
- **Meal Slot Coverage**: Seeds readings across all four daily slots (`MORNING`, `AFTER_BREAKFAST`, `AFTER_LUNCH`, `AFTER_DINNER`).
- **Idempotency**: Uses Prisma upserts on the compound unique key `(userId, date, slot)`. Running the script multiple times updates existing entries in place without creating duplicate records.

---

## 10. Running the Application

### Backend Service
```bash
cd server
npm run dev
```
- **Local URL**: `http://localhost:5001` (when `PORT=5001` is configured in `server/.env`)
- **Health Check**: `http://localhost:5001/api/health`

### Frontend Service
```bash
cd client
npm run dev
```
- **Local URL**: `http://localhost:5173`
- **Backend Connection**: The Vite development server automatically proxies requests matching `/api/*` to `http://localhost:5001`.

### Demo Login
Navigate to `http://localhost:5173/login`:
- **Email**: `demo@sweety.app` (or your configured `DEMO_USER_EMAIL`)
- **Password**: The password defined in your `DEMO_USER_PASSWORD` environment variable

---

## 11. Docker Compose

Sweety provides a multi-container Docker Compose configuration (`docker-compose.yml`) orchestrating the PostgreSQL database, backend Express API, and frontend Nginx web server:

### Configuration
Copy the root environment template:
```bash
cp .env.example .env
```

### Start Containers
```bash
# Build and start services in the background
docker compose up -d --build
```

### Included Services & Port Mappings

| Service | Container Image / Build | Container Port | Host Port (Default) |
|---|---|---|---|
| **`postgres`** | `postgres:17-alpine` | `5432` | `5433` (or `POSTGRES_PORT`) |
| **`backend`** | Multi-stage Node 22 Alpine (`./server`) | `3000` | `5001` (or `BACKEND_PORT`) |
| **`frontend`** | Multi-stage Nginx Alpine (`./client`) | `80` | `3001` (or `FRONTEND_PORT`) |

### Common Docker Commands
```bash
# View container status
docker compose ps

# Follow container logs
docker compose logs -f

# Inspect backend logs only
docker compose logs -f backend

# Stop containers (preserves database volume)
docker compose down

# Stop containers and delete database volume
docker compose down -v
```

> [!NOTE]
> **Container Verification Status**: The Docker Compose setup was successfully started and verified locally. The PostgreSQL, backend, and frontend containers were running with healthy status during verification.

---

## 12. API Overview

All API endpoints return JSON envelopes formatted as `{ success: true, message: "...", data: { ... } }`.

| Category | Method | Endpoint | Authentication | Description |
|---|---|---|---|---|
| **Health** | `GET` | `/api/health` | Public | Service health and uptime check |
| **Auth** | `POST` | `/api/auth/register` | Public | Registers a new user account |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticates user; returns access token & sets refresh cookie |
| **Auth** | `POST` | `/api/auth/refresh` | Cookie | Rotates refresh token and issues a new access token |
| **Auth** | `POST` | `/api/auth/logout` | Cookie | Revokes refresh token and clears cookie |
| **Auth** | `GET` | `/api/auth/me` | Bearer Token | Retrieves current user profile |
| **Readings** | `POST` | `/api/readings` | Bearer Token | Creates a reading (40–600 mg/dL, max 4/day) |
| **Readings** | `GET` | `/api/readings` | Bearer Token | Retrieves paginated readings (`?date=YYYY-MM-DD`, `?page=1&limit=10`) |
| **Readings** | `GET` | `/api/readings/:id` | Bearer Token | Retrieves a single reading by ID |
| **Readings** | `PATCH` | `/api/readings/:id` | Bearer Token | Updates an existing reading safely |
| **Readings** | `DELETE` | `/api/readings/:id` | Bearer Token | Deletes a reading belonging to the user |
| **Reports** | `GET` | `/api/reports/daily` | Bearer Token | Returns daily aggregate stats and meal slot reading items |
| **Reports** | `GET` | `/api/reports/month-to-date` | Bearer Token | Returns month-to-date stats and daily trend points |
| **Reports** | `GET` | `/api/reports/previous-month` | Bearer Token | Returns previous calendar month stats and daily trend points |

---

## 13. Testing and Code Quality

The repository maintains an automated test suite across both backend and frontend.

### Verified Test Results
- **Backend**: 28 test files · **279 tests passing** · 0 failed
- **Frontend**: 17 test files · **168 tests passing** · 0 failed
- **Total**: 45 test files · **447 tests passing (100% pass rate)**

### Backend Test Coverage
- **Unit Tests (`server/tests/unit`)**: Domain value objects (`GlucoseValue`, `Email`), date calculations and leap-year math, application use cases with mock repositories, and Pino logger sensitive-key redaction.
- **Integration Tests (`server/tests/integration`)**: Supertest Express middleware pipeline testing covering authentication guards, validation schemas, duplicate slot conflict prevention, and token refresh cookies.
- **Database E2E Tests (`server/tests/e2e`)**: Live PostgreSQL integration tests verifying foreign-key cascade deletions, unique constraint enforcement, and SQL aggregations.

### Frontend Test Coverage
- **Unit & Utility Tests**: Input validation schemas, date formatters, and error response mappers.
- **Component & Integration Tests**: Navigation flows, reading CRUD interactions, pagination controls, report period switching, SVG chart rendering, and custom hooks (`useReports`, `useReadings`, `useAuth`).

### Test & Verification Commands
```bash
# Run all backend tests
npm test --prefix server

# Run backend typecheck
npm run typecheck --prefix server

# Run backend lint
npm run lint --prefix server

# Run all frontend tests
npm test --prefix client

# Run frontend lint
npm run lint --prefix client

# Run frontend production build (typecheck + Vite build)
npm run build --prefix client
```

---

## 14. Additional Work and Bonus Features

Beyond the baseline tracking requirements, several features and architectural additions were implemented:

1. **Backend and Frontend Pagination**
   - **Backend**: Added `page` and `limit` query parameters to `GET /api/readings` with database-level `skip` and `take` support alongside total record count metadata.
   - **Frontend**: Implemented a reusable `ReadingPagination` molecule providing current page indicators, record range summaries, and boundary-safe Previous/Next controls.
   - **Benefit**: Ensures fast query response times and smooth browsing even as patient reading history grows over months.

2. **Monthly Glucose Trend Chart**
   - **Backend**: Extended `GenerateMonthToDateReportUseCase` and `GeneratePreviousMonthReportUseCase` to aggregate and return `dailyTrends` points (date, daily average, count, min, max).
   - **Frontend**: Created an accessible, responsive SVG line chart (`MonthlyTrendChart.tsx`) displaying daily glucose averages across active monthly reporting periods alongside neutral scale reference lines (70, 100, 140 mg/dL).
   - **Benefit**: Enables patients to visualize their glycemic trajectory across weeks without clinical over-interpretation of mixed daily averages.

3. **React Testing Library Tests for the Reading Form**
   - Implemented dedicated component tests in `client/src/test/readingsFlow.spec.tsx` using `@testing-library/react` and `@testing-library/user-event`.
   - **Interactions Covered**: Empty form submission validation, decimal value rejection, physiological bounds enforcement (40–600 mg/dL), form prepopulation during edits, and API conflict error alert banners.

4. **Docker Compose Orchestration**
   - Multi-stage container builds for backend (Node 22 Alpine runner with non-root user `sweety`) and frontend (Nginx Alpine SPA reverse proxy).
   - Automated database migration execution via `docker-entrypoint.sh` prior to server start.
   - Container health checks configured for all three services (`postgres`, `backend`, `frontend`).
   - Verified locally with healthy running status across all three containers.

*(Note: Features such as Redis caching, BullMQ scheduled reminders, and Doctor roles were not implemented as part of this submission and are evaluated as future architectural considerations below.)*

---

## 15. Notes and Future Improvements

### Assumptions

The implementation of Sweety is based on the following verified architectural and domain assumptions:

- **Predefined Daily Meal Slots**: Each calendar date supports four predefined reading slots: Morning fasting (`MORNING`), After breakfast (`AFTER_BREAKFAST`), After lunch (`AFTER_LUNCH`), and After dinner (`AFTER_DINNER`).
- **Slot Uniqueness**: A user can add only one reading for each slot on a particular date. Duplicate slot attempts are rejected with HTTP 409, while existing records can be safely edited in place.
- **Standardized Units**: All glucose readings are stored, calculated, and displayed uniformly in milligrams per deciliter (`mg/dL`).
- **Date Handling**: Reading dates and report periods are handled using calendar dates (stored at UTC midnight via Prisma `@db.Date`), preventing local client timezone conversions from inadvertently shifting readings across calendar days.
- **Tenant Isolation**: Users can access and manage only their own glucose readings and reports. All queries enforce strict user scoping through verified JWT credentials.
- **Informational Reference Ranges**: Glucose reference ranges shown in the application are general informational benchmarks and must not be interpreted as a medical diagnosis or treatment directive.

### Future Improvements

The following improvements represent realistic potential enhancements that build directly on the current architecture:

- **AI-Based Insights**: Generate summaries of historical glucose readings to help users understand trends and recurring patterns.
- **Ask About Your Readings**: Allow users to ask questions about their own reading history, such as comparing weekly averages or understanding changes over time. Responses should be grounded in their actual records.
- **Improved Reports**: Add custom date filters, PDF/CSV exports, and more flexible weekly and monthly summaries.
- **Reading History**: Maintain an audit history so users can review when readings were created, updated, or deleted.
- **Reminders**: Add configurable reminders for regular glucose logging, using background jobs for scheduled notifications.
- **Account Security**: Add email verification and password recovery.
- **Accessibility**: Improve keyboard navigation, screen-reader support, and chart accessibility.

> [!NOTE]
> For AI-related features, numerical calculations would remain within the application, while AI would be used to explain results and summarize patterns. Any generated insights would be informational and would not replace medical advice.

---

## 16. License

This project is licensed under the [ISC License](server/package.json).
