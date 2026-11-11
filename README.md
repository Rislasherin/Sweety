# Sweety – Blood Glucose Tracker

[![Backend Tests](https://img.shields.io/badge/backend%20tests-201%20passing-brightgreen)](#testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue)](https://www.postgresql.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20Architecture-orange)](#backend-architecture)
[![Docker](https://img.shields.io/badge/Docker-Compose%20Ready-blue)](https://www.docker.com/)

Sweety is a production-grade Blood Glucose Tracking platform designed to help individuals monitor and manage diabetes and metabolic health. Built with **Clean Architecture**, **Domain-Driven Design (DDD)**, and **SOLID principles**, the system guarantees user data isolation, chronological slot tracking, database-level aggregate reports, and enterprise-grade reliability.

---

## Table of Contents

1. [Project Overview & Problem Statement](#project-overview--problem-statement)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Architecture Overview](#architecture-overview)
5. [Repository Structure](#repository-structure)
6. [Backend Architecture](#backend-architecture)
7. [Frontend Atomic Design Architecture](#frontend-atomic-design-architecture)
8. [Prerequisites](#prerequisites)
9. [Local Development Setup](#local-development-setup)
10. [Environment Configuration](#environment-configuration)
11. [Database Setup & Prisma Migrations](#database-setup--prisma-migrations)
12. [Running the Applications](#running-the-applications)
13. [API Documentation & Endpoints](#api-documentation--endpoints)
14. [Authentication Flow](#authentication-flow)
15. [Testing Strategy](#testing-strategy)
16. [Code Quality: ESLint & Prettier](#code-quality-eslint--prettier)
17. [Docker & Containerized Deployment](#docker--containerized-deployment)
18. [Git Workflow & Conventional Commits](#git-workflow--conventional-commits)
19. [Environment Variable Reference](#environment-variable-reference)
20. [Known Limitations & Roadmap](#known-limitations--roadmap)

---

## Project Overview & Problem Statement

Managing diabetes and blood sugar fluctuations requires consistent, timely glucose monitoring before and after meals. Traditional spreadsheets and ad-hoc tracking methods suffer from:

- **Timezone Drift & Date Confusion**: Server UTC conversions inadvertently shifting records across calendar days.
- **Data Integrity Issues**: Duplicate entries for the same meal slot, unrealistic readings, or missing context.
- **Security & Privacy Risks**: Weak multi-tenant isolation exposing sensitive health telemetry.
- **Slow Analytical Queries**: Fetching hundreds of historical records into client memory for simple weekly or monthly averages.

**Sweety** solves these problems with strict date-only calendar modeling (`@db.Date` stored at UTC midnight), 4-slot daily limits, multi-tenant JWT scoping, database-level aggregation, and structured observability.

---

## Key Features

- **JWT Authentication & Registration**: Secure password hashing with BCrypt (salt rounds 10), email normalization, and tamper-proof JWT bearer tokens.
- **Glucose Reading CRUD**:
  - Enforces physiological range limits: integer between 40 and 600 mg/dL inclusive.
  - Chronological daily slots: `MORNING`, `AFTER_BREAKFAST`, `AFTER_LUNCH`, `AFTER_DINNER`.
  - Max 4 readings per day (exactly one per slot).
  - Duplicate slot conflict prevention (`409 Conflict`).
  - Safe in-place editing on days with 4 readings without false limit errors.
- **Analytical Reports API**:
  - **Daily Report**: Aggregates highest, lowest, average (rounded to 1 decimal place), count, and chronological slot breakdown.
  - **Month-to-Date Report**: Calculates statistics from the 1st day of the selected month through the selected date inclusive using PostgreSQL aggregation (`_min`, `_max`, `_avg`, `_count`).
  - **Previous Full Month Report**: Seamlessly computes full calendar month ranges, handling leap-year February (29 days), non-leap February (28 days), 30/31-day months, and January rollbacks to December.
- **Enterprise Observability**: Structured JSON logging in production via Pino, with automatic redaction of sensitive credentials (`password`, `token`, `authorization`, `cookie`, `secret`).
- **Health Checks & Monitoring**: Dedicated `/api/health` and `/health` endpoints for zero-downtime container probes.

---

## Technology Stack

### Backend (`server/`)
- **Runtime**: Node.js v22 (LTS), TypeScript 5.8
- **Framework**: Express 5.3
- **ORM & Database**: Prisma 6.19 with PostgreSQL 17
- **Security**: BCrypt, JSONWebToken, Helmet, CORS
- **Validation**: `class-validator`, `class-transformer`, Zod (environment schema)
- **Logging**: Pino & `pino-pretty`
- **Testing**: Vitest 5.1, Supertest 7.3

### Frontend (`client/`)
- **Build Tool**: Vite 8.3
- **Framework**: React / TypeScript
- **Styling**: Tailwind CSS
- **Web Server**: Nginx Alpine (production container with SPA routing fallback)

### Infrastructure & DevOps
- **Docker**: Multi-stage Dockerfiles for backend and frontend
- **Docker Compose v5**: Service orchestration (`postgres`, `backend`, `frontend`)
- **Git**: Lightweight Git Flow with Conventional Commits

---

## Architecture Overview

```mermaid
graph TD
    Client["Frontend Web Client<br/>(React + Vite / Nginx: Port 80)"] -->|"HTTP / API Proxy"| Backend["Backend API<br/>(Express + Clean Architecture: Port 3000)"]
    Backend -->|"Prisma ORM"| DB[("PostgreSQL 17 Database<br/>Port 5432")]

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
│   │   └── migrations/             # Applied SQL migrations
│   ├── src/
│   │   ├── domain/                 # Domain entities, value objects, interfaces
│   │   ├── application/            # Use cases, DTOs, mappers
│   │   ├── infrastructure/         # Repositories, Prisma, Logger, BCrypt, JWT
│   │   ├── presentation/           # Controllers, routes, middlewares
│   │   ├── shared/                 # Errors, constants, response utilities
│   │   └── main/                   # Composition root (app.ts) & server.ts
│   └── tests/
│       ├── unit/                   # Isolated unit test suites
│       ├── integration/            # Supertest route integration suites
│       └── e2e/                    # Real PostgreSQL database E2E tests
│
├── client/                         # Frontend web service
│   ├── Dockerfile                  # Multi-stage production Nginx container
│   ├── .dockerignore               # Frontend Docker build exclusions
│   ├── .gitignore                  # Frontend-specific Git exclusions
│   ├── .env.example                # Safe frontend environment template
│   ├── nginx.conf                  # Nginx reverse proxy & SPA fallback configuration
│   ├── package.json                # Client dependencies & scripts
│   ├── vite.config.ts              # Vite bundler configuration
│   ├── index.html                  # HTML entry point
│   └── src/                        # Frontend source code
│
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

- **Atoms (`client/src/components/atoms`)**:
  Fundamental design elements: Buttons, Inputs, Labels, Badges (e.g. glucose status pill), Spinners/Loaders.
- **Molecules (`client/src/components/molecules`)**:
  Simple combinations of atoms: FormField (Label + Input + ErrorMessage), SearchBar, ReadingCard, DatePickerField.
- **Organisms (`client/src/components/organisms`)**:
  Complex UI sections: NavigationHeader, LoginForm, RegisterForm, ReadingHistoryTable, ReportSummaryCard, SlotDistributionChart.
- **Templates (`client/src/components/templates`)**:
  Layout structures: `AuthLayout` (centered card with brand banner), `DashboardLayout` (sidebar navigation, breadcrumb, content area).
- **Pages (`client/src/pages`)**:
  Route-level screens binding state and services: `LoginPage`, `RegisterPage`, `ReadingsPage`, `ReportsPage`, `NotFoundPage`.

### Supporting Layers
- **`hooks/`**: Custom React hooks (`useAuth`, `useReadings`, `useReports`).
- **`services/`**: API communication layer via Axios with JWT token interceptors.
- **`types/`**: Shared TypeScript interfaces for API requests, responses, and user state.
- **`utils/`**: Formatting helpers (glucose unit formatting, date formatters).

---

## Prerequisites

- **Node.js**: `v20.x` or `v22.x` (v22.12+ recommended)
- **npm**: `v10.x` or higher
- **PostgreSQL**: `v16` or `v17` (running on `localhost:5432`)
- **Docker & Docker Compose**: Optional for containerized deployment

---

## Local Development Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd sweety
```

### 2. Configure Environment Files

**Backend:**
```bash
cp server/.env.example server/.env
```
Edit `server/.env` with your PostgreSQL database credentials:
```ini
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sweety_db?schema=public"
JWT_SECRET="your_secure_random_jwt_secret_at_least_32_characters"
JWT_EXPIRES_IN="1d"
LOG_LEVEL="info"
```

**Frontend:**
```bash
cp client/.env.example client/.env
```
```ini
VITE_API_BASE_URL="http://localhost:3000/api"
```

---

## Database Setup & Prisma Migrations

From the `server/` directory:

```bash
cd server

# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Apply migrations to PostgreSQL
npx prisma migrate deploy
```

*(Optional: To inspect database tables with Prisma Studio, run `npx prisma studio`.)*

---

## Running the Applications

### Backend Development Server
```bash
cd server
npm run dev
```
The server will start with hot-reloading at `http://localhost:3000`.

### Frontend Development Server
```bash
cd client
npm install
npm run dev
```
The Vite development server will start at `http://localhost:5173`.

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
| `GET` | `/api/health` | Public | Returns service status and timestamp |

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Body / Params | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | `{ name, email, password }` | Registers user with hashed password (201) |
| `POST` | `/api/auth/login` | Public | `{ email, password }` | Authenticates user and returns JWT token (200) |

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
    AuthAPI-->>Client: HTTP 200 { token, user: { id, name, email } }
    Client->>Client: Stores token in memory / storage
    
    User->>Client: Requests Readings or Reports
    Client->>ProtectedAPI: GET /api/readings (Header: Bearer <token>)
    ProtectedAPI->>ProtectedAPI: authMiddleware verifies JWT
    ProtectedAPI->>ProtectedAPI: Scopes query exclusively to req.user.id
    ProtectedAPI-->>Client: HTTP 200 { data: [...] }
```

---

## Testing Strategy

The project features a **100% passing test suite with 201 automated tests across 22 test files**:

- **Unit Tests**: Pure domain logic, date calculations, value objects, use cases with mock repositories, and Pino logger redaction.
- **Route Integration Tests**: Full Express middleware pipeline testing with Supertest (authentication guards, validation, daily limit conflicts, race conditions).
- **Real Database E2E Tests**: End-to-end integration tests validating against a live PostgreSQL 17 instance with foreign key cascades, unique constraints, and SQL aggregation.

```bash
# Run all backend tests
cd server
npm test
```

### Test Suite Summary:
```text
 ✓ tests/unit/dateUtils.spec.ts (17 tests)
 ✓ tests/unit/ReportUseCases.spec.ts (13 tests)
 ✓ tests/unit/PrismaReadingRepository.spec.ts (16 tests)
 ✓ tests/unit/ReadingUseCases.spec.ts (17 tests)
 ✓ tests/unit/JwtTokenService.spec.ts (4 tests)
 ✓ tests/unit/PrismaUserRepository.spec.ts (5 tests)
 ✓ tests/unit/LoginUserUseCase.spec.ts (6 tests)
 ✓ tests/unit/authMiddleware.spec.ts (6 tests)
 ✓ tests/unit/RegisterUserUseCase.spec.ts (6 tests)
 ✓ tests/unit/AppError.spec.ts (4 tests)
 ✓ tests/unit/requestIdMiddleware.spec.ts (4 tests)
 ✓ tests/unit/errorMiddleware.spec.ts (8 tests)
 ✓ tests/unit/logger.spec.ts (4 tests)
 ✓ tests/unit/response.util.spec.ts (4 tests)
 ✓ tests/unit/asyncHandler.spec.ts (3 tests)
 ✓ tests/integration/ReportRoutes.spec.ts (16 tests)
 ✓ tests/integration/ReadingRoutes.spec.ts (32 tests)
 ✓ tests/integration/RegisterUser.spec.ts (7 tests)
 ✓ tests/integration/LoginUser.spec.ts (9 tests)
 ✓ tests/e2e/RealDatabaseRegistration.spec.ts (7 tests)
 ✓ tests/e2e/RealDatabaseReading.spec.ts (8 tests)
 ✓ tests/e2e/RealDatabaseReport.spec.ts (5 tests)

 Test Files  22 passed (22)
      Tests  201 passed (201)
```

---

## Code Quality: ESLint & Prettier

Both backend and frontend follow strict type checking and zero-tolerance lint standards.

### Backend Commands
```bash
cd server

# Typecheck TypeScript without emitting bundle
npm run typecheck

# Lint with ESLint 9
npm run lint

# Check code formatting with Prettier
npm run format:check

# Auto-format codebase
npm run format
```

### Frontend Commands
```bash
cd client
npm run build
```

---

## Docker & Containerized Deployment

Sweety is architected with **three independent containers** coordinated via a root `docker-compose.yml`:

1. **`postgres`**: Official PostgreSQL 17 Alpine image with persistent named volume `postgres_data`.
2. **`backend`**: Multi-stage Node.js 22 Alpine build running as non-root user `sweety`, with automated migration deployment and `/api/health` probe.
3. **`frontend`**: Multi-stage build compiled with Vite and served through an Nginx Alpine container with SPA fallback routing and `/health` probe.

### Docker Architecture Diagram

```mermaid
graph LR
    subgraph Host Network
        Browser["User Browser"]
    end

    subgraph "Docker Compose Network (sweety_network)"
        Frontend["sweety_frontend<br/>(Nginx : Host 3001 -> Container 80)"]
        Backend["sweety_backend<br/>(Node 22 : Host 5001 -> Container 3000)"]
        Postgres["sweety_postgres<br/>(PostgreSQL 17 : Host 5433 -> Container 5432)"]
    end

    Browser -->|"http://localhost:3001"| Frontend
    Browser -->|"http://localhost:5001"| Backend
    Frontend -->|"Proxy /api/ -> http://backend:3000"| Backend
    Backend -->|"postgres:5432"| Postgres
    Postgres --- Volume[("Volume: postgres_data")]
```

### Docker Compose Commands

```bash
# Build all three container images
docker compose build

# Start all services in the background
docker compose up -d

# Verify container status and health
docker compose ps

# Follow container logs
docker compose logs -f

# Follow only backend logs
docker compose logs -f backend

# Restart a specific service
docker compose restart backend

# Rebuild and restart a specific service
docker compose up -d --build backend

# Stop and remove containers (preserving database volume)
docker compose down

# Stop and remove containers AND delete database volume
docker compose down -v
```

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
Every commit message must follow the Conventional Commits specification:
```text
<type>(<scope>): <description>
```

#### Supported Types:
- `feat`: New feature or user-facing functionality
- `fix`: Bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating test suites
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `chore`: Build tasks, configuration, package upgrades
- `build`: Changes affecting build system or external dependencies
- `ci`: CI configuration files and scripts

#### Examples:
```bash
git commit -m "feat(auth): implement user authentication and jwt tokens"
git commit -m "feat(readings): add glucose reading crud and 4-slot limit"
git commit -m "feat(reports): implement daily, month-to-date and previous-month reports"
git commit -m "chore(docker): add multi-stage dockerfiles and docker compose orchestration"
git commit -m "docs(readme): add comprehensive project documentation and setup guide"
```

A native pre-commit hook is configured at `.git/hooks/commit-msg` to enforce this standard automatically.

---

## Environment Variable Reference

### Root (`.env.example`)
| Variable | Default | Purpose |
|---|---|---|
| `POSTGRES_USER` | `postgres` | PostgreSQL superuser username |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL superuser password |
| `POSTGRES_DB` | `sweety_db` | Primary application database name |
| `POSTGRES_PORT` | `5433` | Exposed PostgreSQL host port (isolated from default 5432) |
| `BACKEND_PORT` | `5001` | Exposed backend host port (isolated from default 3000) |
| `FRONTEND_PORT` | `3001` | Exposed frontend host port (isolated from default 80/3000) |

### Backend (`server/.env.example`)
| Variable | Type | Default | Purpose |
|---|---|---|---|
| `PORT` | Number | `3000` | HTTP port backend binds to |
| `NODE_ENV` | String | `development` | Environment mode (`development`, `production`, `test`) |
| `DATABASE_URL` | String | Required | PostgreSQL connection URI |
| `JWT_SECRET` | String | Required (min 16 chars) | Secret key for signing and verifying JWT tokens |
| `JWT_EXPIRES_IN` | String | `1d` | Token lifetime (e.g. `1d`, `12h`) |
| `LOG_LEVEL` | String | `info` | Pino log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`) |

### Frontend (`client/.env.example`)
| Variable | Type | Default | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | String | `http://localhost:3000/api` | Base URL for backend API requests |

---

## Known Limitations & Roadmap

- **Docker Desktop Daemon**: Docker CLI v29.5.3 and Compose v5.1.4 are installed on the local system; container image builds and runtime execution require the Docker Desktop daemon to be started interactively in a Windows session.
- **Frontend UI Implementation**: The frontend architecture, Atomic Design component structure, and Nginx reverse proxy configuration are established. The subsequent development stage will implement the interactive React UI components (Dashboard, Reading Entry Form, and Analytical Charts).
- **Email Verification & Password Reset**: The current authentication layer implements secure registration and login; email verification tokens and forgotten password reset workflows can be layered onto the existing `User` entity and repository contracts.

---

## License

This project is licensed under the ISC License.
