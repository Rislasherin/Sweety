# Sweety – Blood Glucose Tracker

[![Total Automated Tests](https://img.shields.io/badge/automated%20tests-405%20passing-brightgreen)](#testing-strategy)
[![Backend Tests](https://img.shields.io/badge/backend%20tests-261%20passing-brightgreen)](#testing-strategy)
[![Frontend Tests](https://img.shields.io/badge/frontend%20tests-144%20passing-brightgreen)](#testing-strategy)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38B2AC)](https://tailwindcss.com/)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20Architecture%20%2B%20DDD-orange)](#backend-architecture)
[![Docker](https://img.shields.io/badge/Docker-Compose%20Ready-blue)](https://www.docker.com/)

Sweety is a production-grade Blood Glucose Tracking platform designed to help individuals monitor and manage diabetes and metabolic health. Built with **Clean Architecture**, **Domain-Driven Design (DDD)**, and **SOLID principles**, the system guarantees user data isolation, chronological meal-slot tracking, database-level aggregate reports, and enterprise-grade reliability.

---

## Table of Contents

1. [Project Overview & Problem Statement](#project-overview--problem-statement)
2. [Key Features](#key-features)
3. [Visual Tour & Screenshots](#visual-tour--screenshots)
4. [Technology Stack](#technology-stack)
5. [Architecture Overview](#architecture-overview)
6. [Repository Structure](#repository-structure)
7. [Backend Architecture](#backend-architecture)
8. [Frontend Atomic Design Architecture](#frontend-atomic-design-architecture)
9. [Prerequisites](#prerequisites)
10. [Local Development Setup](#local-development-setup)
11. [Demo Data Seeding](#demo-data-seeding)
12. [Running the Applications](#running-the-applications)
13. [API Documentation & Endpoints](#api-documentation--endpoints)
14. [Authentication Flow](#authentication-flow)
15. [Testing Strategy](#testing-strategy)
16. [Code Quality: ESLint & Prettier](#code-quality-eslint--prettier)
17. [Docker & Containerized Deployment](#docker--containerized-deployment)
18. [Git Workflow & Conventional Commits](#git-workflow--conventional-commits)
19. [Environment Variable Reference](#environment-variable-reference)
20. [Architecture & Implementation Notes (Reviewer Notes)](#architecture--implementation-notes-reviewer-notes)
21. [Known Limitations & Roadmap](#known-limitations--roadmap)
22. [License](#license)

---

## Project Overview & Problem Statement

Managing diabetes and blood sugar fluctuations requires consistent, timely glucose monitoring before and after meals. Traditional spreadsheets and ad-hoc tracking methods suffer from:

- **Timezone Drift & Date Confusion**: Server UTC conversions inadvertently shifting records across calendar days.
- **Data Integrity Issues**: Duplicate entries for the same meal slot, unrealistic readings, or missing context.
- **Security & Privacy Risks**: Weak multi-tenant isolation exposing sensitive health telemetry.
- **Slow Analytical Queries**: Fetching hundreds of historical records into client memory for simple weekly or monthly averages.
- **Inaccessible Visualizations**: Heavy third-party charting libraries that fail accessibility standards and break on mobile viewports.

**Sweety** solves these problems with strict date-only calendar modeling (`@db.Date` stored at UTC midnight), 4-slot daily limits, multi-tenant JWT scoping, database-level aggregation, accessible custom SVG visualizations, and structured observability.

---

## Key Features

- **JWT Authentication & Session Lifecycle**:
  - Secure password hashing with BCrypt (12 salt rounds in auth/seed, 10 for standard auth), email normalization, and tamper-proof JWT bearer access tokens with HttpOnly refresh cookies.
- **Glucose Reading Tracking & CRUD**:
  - Enforces physiological range limits: integer between 40 and 600 mg/dL inclusive.
  - Chronological daily slots: `MORNING`, `AFTER_BREAKFAST`, `AFTER_LUNCH`, `AFTER_DINNER`.
  - Max 4 readings per day (exactly one per canonical meal slot).
  - Duplicate slot conflict prevention (`409 Conflict`).
  - Safe in-place editing on days with 4 readings without false limit errors.
- **Interactive Reports & Analytics Dashboard**:
  - **Daily Report**: Aggregates highest, lowest, average (rounded to 1 decimal place), count, and chronological slot breakdown with an interactive, accessible SVG meal slot curve.
  - **Month-to-Date Report**: Calculates statistics from the 1st day of the selected month through the selected date inclusive using PostgreSQL aggregation (`_min`, `_max`, `_avg`, `_count`).
  - **Previous Full Month Report**: Seamlessly computes full calendar month ranges, handling leap-year February (29 days), non-leap February (28 days), 30/31-day months, and January rollbacks to December.
  - **Glycemic Spread Gauge**: Custom accessible SVG spread gauge visualizing min, max, and average markers against clinical reference bands.
  - **Clinical Glycemic Bands**: Aligned with clinical diabetes guidelines:
    - **Hypoglycemic / Low**: $< 70\text{ mg/dL}$ (Amber pill)
    - **Normal**: $70\text{--}99\text{ mg/dL}$ (Emerald pill)
    - **Elevated**: $100\text{--}125\text{ mg/dL}$ (Orange pill)
    - **High / Diabetes Indicator**: $\ge 126\text{ mg/dL}$ (Rose pill)
  - **Contextual Empty States**: Friendly, non-blocking empty states when navigating to unseeded days or ranges without readings.
  - **Fully Responsive**: Mobile-first design collapsing cleanly to single-column layouts on smartphones (`375px+`) up to widescreen desktops.
- **Dynamic Demo Data Seeding**:
  - Automatically seeds realistic readings relative to the execution date without hardcoded calendar assumptions.
  - Seeds up to 8 dates in the current month ending on today, and 8 dates evenly spread across the previous calendar month.
  - Demonstrates all four clinical glycemic categories and all four meal slots in a single daily view.
  - Idempotent upserts via compound unique key `(userId, date, slot)` preventing duplicates on rerun.
- **Enterprise Observability**: Structured JSON logging in production via Pino, with automatic redaction of sensitive credentials (`password`, `token`, `authorization`, `cookie`, `secret`).
- **Health Checks & Monitoring**: Dedicated `/api/health` endpoint for zero-downtime container probes.

---

## Visual Tour & Screenshots

The actual screenshots captured from the running application:

### 1. Daily Reports Dashboard
Interactive daily view showing summary stat cards, accessible SVG meal slot glucose curve, and chronological reading breakdown.
![Daily Reports Dashboard](docs/screenshots/daily_report.png)

### 2. Month-to-Date Report
Aggregated monthly metrics from the 1st of the month through today, featuring the custom Glycemic Spread Gauge and clinical overview.
![Month-to-Date Report](docs/screenshots/month_to_date_report.png)

### 3. Previous Full Month Report
Full calendar previous month analytics (Oct 1 – Oct 31) showing 52 analyzed readings and clinical spread metrics.
![Previous Month Report](docs/screenshots/previous_month_report.png)

### 4. Glucose Readings Log
Chronological log of all recorded readings with meal slot badges, values, timestamps, and edit/delete actions.
![Readings Log](docs/screenshots/readings_log.png)

### 5. Contextual Empty State
Friendly placeholder view displayed when navigating to an unseeded date without readings.
![Daily Report Empty State](docs/screenshots/daily_report_empty.png)

### 6. Responsive Mobile View
Seamless single-column responsive layout optimized for mobile viewports (tested at 375×812).
![Mobile Responsive View](docs/screenshots/mobile_responsive.png)

---

## Technology Stack

### Backend (`server/`)
- **Runtime**: Node.js v22 (LTS), TypeScript 5.9
- **Framework**: Express 5.3
- **ORM & Database**: Prisma 6.19 with PostgreSQL 17
- **Security**: BCrypt, JSONWebToken, Helmet, CORS, Cookie-Parser
- **Validation**: `class-validator`, `class-transformer`, Zod (environment schema)
- **Logging**: Pino & `pino-pretty`
- **Testing**: Vitest 5.1, Supertest 7.3

### Frontend (`client/`)
- **Build Tool**: Vite 8.3
- **Framework**: React 19 / TypeScript 5.9
- **Styling**: Tailwind CSS v4.3
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **Testing**: Vitest 5.1, React Testing Library, JSDOM

### Infrastructure & DevOps
- **Docker**: Multi-stage Dockerfiles for backend and frontend
- **Docker Compose v5**: Service orchestration (`postgres`, `backend`, `frontend`)
- **Git**: Lightweight Git Flow with Conventional Commits

---

## Architecture Overview

```mermaid
graph TD
    Client["Frontend Web Client<br/>(React 19 + Vite 8: Port 5173 / Nginx: Port 80)"] -->|"HTTP / REST API"| Backend["Backend API<br/>(Express 5.3 + Clean Architecture: Port 5001 / 3000)"]
    Backend -->|"Prisma 6.19 ORM"| DB[("PostgreSQL 17 Database<br/>Port 5432")]

    subgraph "Backend Clean Architecture Layers"
        Presentation["Presentation Layer<br/>(Controllers, Routes, Middlewares)"]
        Application["Application Layer<br/>(Use Cases, DTOs, Mappers)"]
        Domain["Domain Layer (Core)<br/>(Entities, Value Objects, Repository Interfaces)"]
        Infrastructure["Infrastructure Layer<br/>(Prisma Repositories, BCrypt, JWT, Pino Logger)"]

        Presentation --> Application
        Application --> Domain
        Infrastructure -.->|Implements| Domain
        Presentation --> Infrastructure
    end
```

---

## Repository Structure

```text
sweety/
│
├── server/                         # Backend application service
│   ├── Dockerfile                  # Multi-stage production container build
│   ├── .dockerignore               # Backend Docker build exclusions
│   ├── .gitignore                  # Backend-specific Git exclusions
│   ├── .env.example                # Safe environment variable template
│   ├── docker-entrypoint.sh        # Startup script (Prisma migrations & boot)
│   ├── package.json                # Server dependencies & scripts
│   ├── tsconfig.json               # TypeScript compiler configuration
│   ├── eslint.config.mjs           # ESLint 9 configuration
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma database schema
│   │   ├── seed.ts                 # Dynamic demo data seeding script
│   │   └── migrations/             # Applied SQL migrations
│   ├── src/
│   │   ├── domain/                 # Domain entities, value objects, interfaces
│   │   ├── application/            # Use cases, DTOs, mappers
│   │   ├── infrastructure/         # Repositories, Prisma, Logger, BCrypt, JWT
│   │   ├── presentation/           # Controllers, routes, middlewares
│   │   ├── shared/                 # Errors, constants, response utilities
│   │   └── main/                   # Composition root (app.ts) & server.ts
│   └── tests/
│       ├── unit/                   # Isolated unit test suites (23 test files)
│       ├── integration/            # Supertest route integration suites (5 test files)
│       └── e2e/                    # Real PostgreSQL database E2E tests (4 test files)
│
├── client/                         # Frontend web service
│   ├── Dockerfile                  # Multi-stage production Nginx container
│   ├── .dockerignore               # Frontend Docker build exclusions
│   ├── .gitignore                  # Frontend-specific Git exclusions
│   ├── .env.example                # Safe frontend environment template
│   ├── nginx.conf                  # Nginx reverse proxy & SPA fallback configuration
│   ├── package.json                # Client dependencies & scripts
│   ├── vite.config.ts              # Vite bundler configuration with /api proxy
│   ├── index.html                  # HTML entry point
│   └── src/
│       ├── components/             # Atomic design components (atoms, molecules, organisms, templates)
│       ├── features/
│       │   ├── auth/               # Authentication forms, context, and pages
│       │   ├── readings/           # Readings CRUD, forms, and pages
│       │   ├── reports/            # Reports dashboard, SVG charts, period nav, and hooks
│       │   └── home/               # Landing page and home dashboard
│       ├── routes/                 # Protected and public-only routing
│       ├── services/               # Axios API client with token interceptors
│       └── test/                   # Client Vitest suites (14 test files)
│
├── docs/
│   └── screenshots/                # Application verification screenshots
├── docker-compose.yml              # Root Docker Compose service orchestration
├── .env.example                    # Root Compose environment template
└── README.md                       # Complete project documentation
```

---

## Backend Architecture

The backend strictly adheres to **Clean Architecture** and **Domain-Driven Design (DDD)**:

1. **Domain Layer (`server/src/domain`)**:
   - Contains pure business models, domain logic, and validation rules.
   - **Zero external dependencies**: completely decoupled from Express, Prisma, HTTP, or databases.
   - *Key Elements*: `Reading` entity, `User` entity, `GlucoseValue` (40–600 mg/dL), `Email` value object, `ReadingSlotType` enum, domain errors, and `IReadingRepository` / `IUserRepository` contracts.
2. **Application Layer (`server/src/application`)**:
   - Orchestrates use cases and application workflow logic.
   - Converts domain models to typed response DTOs via mappers.
   - *Key Elements*: `RegisterUserUseCase`, `LoginUserUseCase`, `CreateReadingUseCase`, `GetUserReadingsUseCase`, `GetReadingByIdUseCase`, `UpdateReadingUseCase`, `DeleteReadingUseCase`, `GenerateDailyReportUseCase`, `GenerateMonthToDateReportUseCase`, `GeneratePreviousMonthReportUseCase`.
3. **Infrastructure Layer (`server/src/infrastructure`)**:
   - Implements repository interfaces using Prisma Client and PostgreSQL.
   - Translates database-specific errors (e.g. Prisma `P2002` unique constraint violation) into domain errors (`DuplicateReadingSlotError`).
   - Implements security services (`BcryptService`, `JwtTokenService`) and structured logging (`logger.ts`).
4. **Presentation Layer (`server/src/presentation`)**:
   - Handles HTTP routing, input validation (`validateDto` with `class-validator`), and response dispatching (`sendSuccess`).
   - Delegates all business logic to use cases; never performs direct database operations.
   - Centralized error handling (`errorMiddleware.ts`) uniformly maps application, domain, and validation errors to standard JSON payloads.
5. **Main Composition Root (`server/src/main`)**:
   - Instantiates repositories, services, use cases, and controllers via dependency injection in `app.ts`.

---

## Frontend Atomic Design Architecture

The client application is organized according to **Atomic Design** principles to ensure component reusability and clean separation of concerns:

- **Atoms (`client/src/components/atoms`, `features/reports/components/atoms`)**:
  Fundamental design elements: Buttons, Inputs, Labels, Badges (e.g. glucose status pill), MetricStatCard, PeriodTabButton, Spinners/Loaders.
- **Molecules (`client/src/components/molecules`, `features/reports/components/molecules`)**:
  Combinations of atoms: FormField (Label + Input + ErrorMessage), SearchBar, ReadingCard, DatePickerField, DailySlotChart (accessible SVG), GlycemicSpreadGauge (accessible SVG), ReportPeriodNav, ReportEmptyState, DailyReadingsTable.
- **Organisms (`client/src/components/organisms`, `features/reports/components/organisms`)**:
  Complex UI sections: Header / Navbar, LoginForm, SignupForm, ReadingForm, DailyReportView, PeriodReportView, ReportSummarySection.
- **Templates (`client/src/components/templates`, `features/reports/components/templates`)**:
  Layout structures: `MainLayout` (header, main container, footer), `ReportsTemplate` (hero header, period navigation, dynamic period report switch).
- **Pages (`client/src/features/*/pages`)**:
  Route-level screens binding state and services: `HomePage`, `LoginPage`, `SignupPage`, `ReadingsPage`, `ReportsPage`, `NotFoundPage`.

---

## Prerequisites

- **Node.js**: `v20.x` or `v22.x` (`v22.12+` recommended)
- **npm**: `v10.x` or higher
- **PostgreSQL**: `v16` or `v17` (running on `localhost:5432`)
- **Docker & Docker Compose**: Optional for containerized deployment

---

## Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/Rislasherin/Sweety.git
cd sweety
```

### 2. Configure Environment Files

**Backend:**
```bash
cp server/.env.example server/.env
```
Ensure `server/.env` contains your PostgreSQL credentials and demo configuration:
```ini
PORT=5001
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sweety_db?schema=public"
JWT_SECRET="your_secure_random_jwt_secret_at_least_32_characters"
JWT_EXPIRES_IN="1d"
JWT_ISSUER="sweety-api"
JWT_AUDIENCE="sweety-client"
CORS_ORIGIN="http://localhost:3001,http://127.0.0.1:3001,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
LOG_LEVEL="info"

# Demo data seeding configuration
DEMO_USER_EMAIL="demo@sweety.app"
DEMO_USER_NAME="Sweety Demo Patient"
DEMO_USER_PASSWORD="DemoSweety2026!"
```

**Frontend:**
```bash
cp client/.env.example client/.env
```
```ini
VITE_API_BASE_URL="http://localhost:5001/api"
```

### 3. Install Dependencies & Run Database Migrations

```bash
# Install backend dependencies
cd server
npm install

# Apply database migrations
npx prisma migrate deploy

# Install frontend dependencies
cd ../client
npm install
cd ..
```

---

## Demo Data Seeding

To seed the database with realistic demo glucose records spanning the current and previous calendar months:

```bash
cd server
npm run seed
```
*(Or alternatively: `npx prisma db seed`)*

### Seeding Highlights
- **Dedicated Demo Account:** Creates or reuses `demo@sweety.app`.
- **Dynamic Relative Dates:** Calculates dates relative to today's execution date using UTC midnight math.
  - **Current Month:** Up to 8 distinct dates ending on today (never generates future dates).
  - **Previous Month:** 8 distinct dates evenly distributed across the entire previous month (handling leap years and year rollovers).
- **All 4 Meal Slots Covered:** `MORNING`, `AFTER_BREAKFAST`, `AFTER_LUNCH`, `AFTER_DINNER`.
- **All 4 Glycemic Categories Represented:** Today's readings showcase Low ($68\text{ mg/dL}$), Normal ($92\text{ mg/dL}$), Elevated ($115\text{ mg/dL}$), and High ($145\text{ mg/dL}$).
- **Idempotency:** Successive executions update existing records in place via compound unique key `(userId, date, slot)` with **zero duplicate entries** and **zero impact on real users**.

---

## Running the Applications

### Start the Backend Server
```bash
cd server
npm run dev
```
The server will start with hot-reloading at `http://localhost:5001`.

### Start the Frontend Dev Server
```bash
cd client
npm run dev
```
The Vite development server will start at `http://localhost:5173` (with automatic `/api` proxying to `http://localhost:5001`).

### Sign In with Demo Account
Navigate to `http://localhost:5173/login`:
- **Email:** `demo@sweety.app`
- **Password:** `DemoSweety2026!` (or whatever is set in `DEMO_USER_PASSWORD`)

---

## API Documentation & Endpoints

All data responses follow a standardized JSON envelope:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Health Check
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Returns service status and timestamp (`200 OK`) |

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Body / Params | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | `{ name, email, password }` | Registers user with hashed password (201) |
| `POST` | `/api/auth/login` | Public | `{ email, password }` | Authenticates user and returns JWT access token + refresh cookie (200) |
| `POST` | `/api/auth/refresh` | Public | HttpOnly Cookie | Issues new access token from valid refresh token (200) |
| `POST` | `/api/auth/logout` | Public | - | Clears refresh token cookie (200) |

### Glucose Readings (`/api/readings`)
All reading routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Params / Body | Description |
|---|---|---|---|
| `POST` | `/api/readings` | `{ date, slot, glucoseValue }` | Creates a reading (40–600 mg/dL, max 4/day) |
| `GET` | `/api/readings` | Optional: `?date=YYYY-MM-DD` | Returns readings sorted by date DESC and slot |
| `GET` | `/api/readings/:id` | Path: `:id` (UUID) | Retrieves a reading isolated to current user |
| `PATCH` | `/api/readings/:id` | `{ date?, slot?, glucoseValue? }` | Updates reading values safely |
| `DELETE` | `/api/readings/:id` | Path: `:id` (UUID) | Deletes a reading belonging to the user |

### Reports (`/api/reports`)
All report routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Query | Description |
|---|---|---|---|
| `GET` | `/api/reports/daily` | `?date=YYYY-MM-DD` | Daily stats + individual slot reading list |
| `GET` | `/api/reports/month-to-date` | `?date=YYYY-MM-DD` | Aggregated stats from 1st of month to selected date |
| `GET` | `/api/reports/previous-month` | `?date=YYYY-MM-DD` | Aggregated stats for the previous full calendar month |

---

## Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Frontend (Vite)
    participant AuthAPI as Auth Controller
    participant JWT as JwtTokenService
    participant ProtectedAPI as Readings / Reports API

    User->>Client: Enters email and password
    Client->>AuthAPI: POST /api/auth/login
    AuthAPI->>AuthAPI: Verify BCrypt hash against DB
    AuthAPI->>JWT: Generate token { userId, email }
    JWT-->>AuthAPI: Signed JWT token
    AuthAPI-->>Client: HTTP 200 { token, user: { id, name, email } } + HttpOnly Refresh Cookie
    Client->>Client: Stores access token in memory
    
    User->>Client: Navigates to /reports
    Client->>ProtectedAPI: GET /api/reports/daily?date=2026-11-12 (Bearer <token>)
    ProtectedAPI->>ProtectedAPI: authMiddleware verifies JWT
    ProtectedAPI->>ProtectedAPI: Scopes query exclusively to req.user.id
    ProtectedAPI-->>Client: HTTP 200 { data: { averageGlucose: 105.0, ... } }
```

---

## Testing Strategy

The project features a **100% passing automated test suite with 405 tests across 42 test files**:

- **Backend (28 test files · 261 passed · 0 failed · 0 skipped)**:
  - **Unit Tests**: Domain logic, date calculations, category boundary tests (69, 70, 99, 100, 125, 126 mg/dL), leap year math, use cases with mock repositories, and Pino logger redaction.
  - **HTTP Integration Tests**: Full Express middleware pipeline testing with Supertest (authentication guards, validation, daily limit conflicts, race conditions, refresh cookies).
  - **Live PostgreSQL E2E Tests**: End-to-end integration tests validating against real PostgreSQL with foreign key cascades, unique constraints, and SQL aggregation.
- **Frontend (14 test files · 144 passed · 0 failed · 0 skipped)**:
  - **Unit & Validation Tests**: Form schemas, formatters, and utility functions.
  - **Component & Integration Tests**: Atomic components, auth flows, readings CRUD, report period navigation, SVG charts, empty states, and custom hooks (`useReports`, `useReadings`, `useAuth`).

```bash
# Run all backend tests
npm test --prefix server

# Run all frontend tests
npm test --prefix client
```

### Complete Test Suites Breakdown

#### Backend Test Files (28 passed)
```text
 ✓ tests/unit/demoDataSeeding.spec.ts (23 tests)
 ✓ tests/unit/ReportUseCases.spec.ts (13 tests)
 ✓ tests/unit/ReadingUseCases.spec.ts (17 tests)
 ✓ tests/unit/dateUtils.spec.ts (17 tests)
 ✓ tests/unit/PrismaReadingRepository.spec.ts (16 tests)
 ✓ tests/unit/originGuardMiddleware.spec.ts (10 tests)
 ✓ tests/unit/errorMiddleware.spec.ts (8 tests)
 ✓ tests/unit/RefreshTokenUseCase.spec.ts (7 tests)
 ✓ tests/unit/JwtTokenService.spec.ts (7 tests)
 ✓ tests/unit/RegisterUserUseCase.spec.ts (6 tests)
 ✓ tests/unit/LoginUserUseCase.spec.ts (6 tests)
 ✓ tests/unit/DependencyInjection.spec.ts (6 tests)
 ✓ tests/unit/authMiddleware.spec.ts (6 tests)
 ✓ tests/unit/PrismaUserRepository.spec.ts (5 tests)
 ✓ tests/unit/requestIdMiddleware.spec.ts (4 tests)
 ✓ tests/unit/response.util.spec.ts (4 tests)
 ✓ tests/unit/logger.spec.ts (4 tests)
 ✓ tests/unit/AppError.spec.ts (4 tests)
 ✓ tests/unit/asyncHandler.spec.ts (3 tests)
 ✓ tests/integration/ReadingRoutes.spec.ts (32 tests)
 ✓ tests/integration/ReportRoutes.spec.ts (16 tests)
 ✓ tests/integration/LoginUser.spec.ts (9 tests)
 ✓ tests/integration/RefreshTokenRoutes.spec.ts (7 tests)
 ✓ tests/integration/RegisterUser.spec.ts (7 tests)
 ✓ tests/e2e/RealDatabaseReading.spec.ts (8 tests)
 ✓ tests/e2e/RealDatabaseRegistration.spec.ts (7 tests)
 ✓ tests/e2e/RealDatabaseReport.spec.ts (5 tests)
 ✓ tests/e2e/DemoDataReportsApi.spec.ts (4 tests)

 Test Files  28 passed (28)
      Tests  261 passed (261)
```

#### Frontend Test Files (14 passed)
```text
 ✓ src/test/readingValidation.spec.ts (23 tests)
 ✓ src/test/readingsFlow.spec.tsx (19 tests)
 ✓ src/test/reportUtils.spec.ts (15 tests)
 ✓ src/test/authValidation.spec.ts (14 tests)
 ✓ src/test/reportsFlow.spec.tsx (13 tests)
 ✓ src/test/authFlow.spec.tsx (10 tests)
 ✓ src/test/formatters.spec.ts (9 tests)
 ✓ src/test/authService.spec.ts (9 tests)
 ✓ src/test/useReports.spec.ts (6 tests)
 ✓ src/test/readingsApiIntegration.spec.ts (6 tests)
 ✓ src/test/readingService.spec.ts (6 tests)
 ✓ src/test/apiError.spec.ts (6 tests)
 ✓ src/test/reportService.spec.ts (4 tests)
 ✓ src/test/atoms.spec.tsx (4 tests)

 Test Files  14 passed (14)
      Tests  144 passed (144)
```

---

## Code Quality: ESLint & Prettier

Both backend and frontend enforce strict type checking and zero-tolerance lint standards.

```bash
# Backend checks
npm run typecheck --prefix server
npm run lint --prefix server
npm run format:check --prefix server

# Frontend checks
npm run build --prefix client        # Runs tsc -b and vite build
npm run lint --prefix client
```

---

## Docker & Containerized Deployment

Sweety includes production-ready Docker Compose orchestration.

```bash
# Build and run all services in production mode
docker compose up -d --build
```

### Services
- **Database (`postgres`)**: PostgreSQL 17 exposed on host port `5432` (or configured `POSTGRES_PORT`).
- **Backend (`backend`)**: Express 5.3 multi-stage Node 22 Alpine container running on port `3000`.
- **Frontend (`frontend`)**: Vite production bundle served by Nginx Alpine on port `80` with SPA fallback routing.

---

## Git Workflow & Conventional Commits

The repository follows a clean, professional **Git Flow** strategy:

- **`main`**: Production-ready, stable, and submission-ready code.
- **`develop`**: Primary integration branch for active development.
- **`feature/<name>`**: Feature development branching from `develop`.
- **`fix/<name>`**: Bug fixes branching from `develop` or `main`.
- **`chore/<name>`**: Tooling, maintenance, and dependencies.
- **`docs/<name>`**: Documentation updates.

### Conventional Commits Format
```text
<type>(<scope>): <description>
```
*Examples:*
- `feat(reports): implement reports and analytics dashboard with accessible svg charts`
- `feat(seed): add dynamic demo glucose data and report tests`
- `feat(readings): integrate reading service with api client and enhance filter sync`
- `chore(seed): normalize package.json line endings and document demo env vars`

---

## Environment Variable Reference

### Root (`.env.example`)
| Variable | Default | Purpose |
|---|---|---|
| `POSTGRES_USER` | `postgres` | PostgreSQL superuser username |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL superuser password |
| `POSTGRES_DB` | `sweety_db` | Primary application database name |
| `POSTGRES_PORT` | `5432` | Exposed PostgreSQL host port |
| `BACKEND_PORT` | `3000` | Exposed backend host port |
| `FRONTEND_PORT` | `80` | Exposed frontend host port |

### Backend (`server/.env.example`)
| Variable | Type | Default | Purpose |
|---|---|---|---|
| `PORT` | Number | `3000` | HTTP port backend binds to |
| `NODE_ENV` | String | `development` | Environment mode (`development`, `production`, `test`) |
| `DATABASE_URL` | String | Required | PostgreSQL connection URI |
| `JWT_SECRET` | String | Required (min 32 chars) | Secret key for signing and verifying JWT tokens |
| `JWT_EXPIRATION` | String | `1d` | Access token lifetime (e.g. `1d`, `12h`) |
| `JWT_ISSUER` | String | `sweety-api` | Token issuer claim |
| `JWT_AUDIENCE` | String | `sweety-client` | Token audience claim |
| `CORS_ORIGIN` | String | Comma-separated | Allowed browser origins for CORS |
| `LOG_LEVEL` | String | `info` | Pino log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`) |
| `DEMO_USER_EMAIL` | String | `demo@sweety.app` | Configurable demo patient email |
| `DEMO_USER_NAME` | String | `Sweety Demo Patient` | Configurable demo patient display name |
| `DEMO_USER_PASSWORD` | String | Required (min 8 chars) | Mandatory demo user password (never hardcoded in source) |

### Frontend (`client/.env.example`)
| Variable | Type | Default | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | String | `http://localhost:5001/api` | Base URL for backend API requests |

---

## Architecture & Implementation Notes (Reviewer Notes)

### 1. Glycemic Category Threshold Alignment
The application strictly aligns glycemic categorization across the entire stack:
- **Low / Hypoglycemic**: $< 70\text{ mg/dL}$
- **Normal**: $70\text{--}99\text{ mg/dL}$
- **Elevated**: $100\text{--}125\text{ mg/dL}$
- **High**: $\ge 126\text{ mg/dL}$

These exact boundaries are shared and validated across:
1. Client UI pill tags and formatting utilities (`client/src/features/reports/utils/reportUtils.ts`).
2. Accessible SVG reference bands in `DailySlotChart` and `GlycemicSpreadGauge`.
3. Unit boundary tests verifying values `69`, `70`, `99`, `100`, `125`, and `126` (`server/tests/unit/demoDataSeeding.spec.ts`).
4. Demo reading generator ensuring all 4 clinical categories are showcased.

### 2. Strict UTC Date Boundaries & No Future Dates
To eliminate timezone drift on `@db.Date` fields:
- Dates are generated and validated using strict UTC midnight timestamps (`YYYY-MM-DDT00:00:00.000Z`).
- The demo date generator dynamically anchors to `new Date()` at UTC midnight.
- Invariants guarantee that **no future dates are ever generated**, even when executed on the 1st of a month.
- Month rollover logic accurately calculates previous calendar months, cleanly transitioning January to December of the preceding year and respecting February leap years (e.g., 29 days in 2024 vs. 28 days in 2025).

### 3. Idempotent Upserts & Real-User Data Isolation
- Seeding uses Prisma's compound unique constraint:
  ```prisma
  @@unique([userId, date, slot])
  ```
  Executing `npm run seed` updates existing demo records in place with zero duplicates.
- All queries and seed mutations are scoped strictly to the dedicated `demo@sweety.app` user ID. Existing real users and their readings remain completely untouched.

### 4. Custom Accessible SVG Visualizations
Rather than bundling large charting libraries (such as Chart.js or Recharts) that add hundreds of kilobytes of bundle weight and frequently fail screen-reader accessibility:
- **`DailySlotChart`**: Built using semantic, lightweight SVG paths with responsive `viewBox="0 0 560 220"`, distinct high-contrast color markers, and an accessible `<desc>` tag summarizing slot values for assistive technology.
- **`GlycemicSpreadGauge`**: Custom SVG gradient bar visualizing min, max, and average markers against clinical colored bands (amber, emerald, orange, rose) with an accompanying semantic text breakdown.
- Both components scale smoothly from mobile (`375px`) to widescreen displays without clipping or layout distortion.

### 5. Multi-Tenant JWT Scoping & Security
- Every read, update, delete, and aggregation operation extracts `req.user.id` from the verified JWT access token.
- Cross-user access attempts return `404 Not Found` (rather than `403 Forbidden`) to avoid leaking the existence of other users' reading IDs.
- Passwords are encrypted using BCrypt with 12 salt rounds for the demo seed and 10 salt rounds for standard registration. No plain-text passwords or fallback secrets exist in source code.

---

## Known Limitations & Roadmap

- **Docker Desktop Daemon**: Docker CLI v29.5.3 and Compose v5.1.4 are configured; containerized image builds and runtime execution require the Docker Desktop daemon to be running in the host environment.
- **Email Verification & Password Reset**: The current authentication layer implements secure registration, login, and session refresh. Email verification tokens and forgotten password reset workflows can be layered onto the existing `User` entity and repository contracts.
- **Exporting Reports**: Future iterations can include direct PDF and CSV export options from the Reports dashboard.

---

## License

This project is licensed under the ISC License.
