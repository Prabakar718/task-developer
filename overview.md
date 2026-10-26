# EstateFlow CRM — Database & API Overview

---

## 1. Database

- **Engine**: PostgreSQL 18
- **Database name**: `realestate_crm`
- **Host**: `localhost:5432`
- **Schema**: `public`
- **ORM**: Prisma (with `prisma-client-js`)
- **Connection**: Defined in `server/.env` as `DATABASE_URL`

---

## 2. Database Schema

### Tables (7)

---

### `User`
Stores all CRM users (admins and sales employees).

| Column      | Type      | Notes                          |
|-------------|-----------|--------------------------------|
| id          | UUID (PK) | Auto-generated                 |
| name        | String    |                                |
| email       | String    | Unique                         |
| password    | String    | bcrypt hashed (cost 12)        |
| role        | Enum      | `ADMIN` or `SALES_EMPLOYEE`    |
| phone       | String?   | Optional                       |
| active      | Boolean   | Default `true`                 |
| createdAt   | DateTime  | Auto                           |
| updatedAt   | DateTime  | Auto                           |

---

### `Lead`
Represents a potential property buyer moving through the sales pipeline.

| Column        | Type      | Notes                                              |
|---------------|-----------|----------------------------------------------------|
| id            | UUID (PK) | Auto-generated                                     |
| name          | String    |                                                    |
| email         | String?   | Optional                                           |
| phone         | String    |                                                    |
| stage         | Enum      | `NEW` → `CONTACTED` → `SITE_VISIT` → `INTERESTED` → `NEGOTIATION` → `BOOKED` → `LOST` |
| source        | String?   | e.g. Website, MagicBricks, Referral                |
| budget        | Float?    | In INR                                             |
| followUpDate  | DateTime? | Used for notification reminders                    |
| assignedToId  | UUID (FK) | References `User.id`                               |
| createdAt     | DateTime  | Auto                                               |
| updatedAt     | DateTime  | Auto                                               |

---

### `LeadNote`
Timestamped notes/interactions logged against a lead.

| Column    | Type      | Notes                    |
|-----------|-----------|--------------------------|
| id        | UUID (PK) |                          |
| content   | String    | Note text                |
| leadId    | UUID (FK) | References `Lead.id` (cascade delete) |
| userId    | UUID (FK) | References `User.id`     |
| createdAt | DateTime  | Auto                     |

---

### `Project`
Top-level real estate development (e.g. Sunrise Heights).

| Column      | Type      | Notes    |
|-------------|-----------|----------|
| id          | UUID (PK) |          |
| name        | String    |          |
| location    | String    |          |
| description | String?   | Optional |
| createdAt   | DateTime  | Auto     |
| updatedAt   | DateTime  | Auto     |

---

### `Building`
A tower or block within a project.

| Column    | Type      | Notes                              |
|-----------|-----------|------------------------------------|
| id        | UUID (PK) |                                    |
| name      | String    | e.g. Tower A, Block 1              |
| projectId | UUID (FK) | References `Project.id` (cascade)  |
| floors    | Int       | Default 1                          |
| createdAt | DateTime  | Auto                               |
| updatedAt | DateTime  | Auto                               |

---

### `Unit`
An individual apartment/villa/plot within a building.

| Column     | Type      | Notes                                                                 |
|------------|-----------|-----------------------------------------------------------------------|
| id         | UUID (PK) |                                                                       |
| unitNumber | String    | e.g. A-402 — unique per building                                      |
| buildingId | UUID (FK) | References `Building.id` (cascade)                                    |
| type       | Enum      | `STUDIO`, `ONE_BHK`, `TWO_BHK`, `THREE_BHK`, `FOUR_BHK`, `PENTHOUSE`, `VILLA`, `PLOT`, `COMMERCIAL` |
| floor      | Int       |                                                                       |
| area       | Float     | Carpet area in sq.ft                                                  |
| price      | Float     | In INR                                                                |
| status     | Enum      | `AVAILABLE`, `RESERVED`, `BOOKED`, `SOLD`                             |
| createdAt  | DateTime  | Auto                                                                  |
| updatedAt  | DateTime  | Auto                                                                  |

> **Unique constraint**: `(buildingId, unitNumber)` — no duplicate unit numbers within the same building.

---

### `Booking`
Links a lead to a unit. Created inside an ACID transaction to prevent double-booking.

| Column      | Type      | Notes                                          |
|-------------|-----------|------------------------------------------------|
| id          | UUID (PK) |                                                |
| leadId      | UUID (FK) | References `Lead.id`                           |
| unitId      | UUID (FK) | References `Unit.id`                           |
| bookedById  | UUID (FK) | References `User.id` (sales rep who booked)    |
| amount      | Float     | Contract value in INR                          |
| status      | Enum      | `PENDING`, `CONFIRMED`, `CANCELLED`            |
| notes       | String?   | Optional booking notes                         |
| bookingDate | DateTime  | Default `now()`                                |
| createdAt   | DateTime  | Auto                                           |
| updatedAt   | DateTime  | Auto                                           |

---

## 3. Relationships

```
User ──< Lead (assignedTo)
User ──< LeadNote
User ──< Booking (bookedBy)

Project ──< Building ──< Unit
                          │
Lead ──────────────────< Booking >── Unit
Lead ──< LeadNote
```

---

## 4. Live Data (as of last check)

| Table     | Records |
|-----------|---------|
| User      | 4       |
| Lead      | 12      |
| LeadNote  | —       |
| Project   | 3       |
| Building  | 5       |
| Unit      | 21      |
| Booking   | 7       |

---

## 5. API Overview

**Base URL**: `http://localhost:5000/api`  
**Auth**: Bearer JWT token in `Authorization` header  
**JWT Expiry**: 7 days  

---

### Authentication — `/api/auth`

| Method | Endpoint        | Auth | Role | Description                          |
|--------|-----------------|------|------|--------------------------------------|
| POST   | `/auth/login`   | ❌   | Any  | Login with email + password, returns JWT token |
| POST   | `/auth/register`| ❌   | Any  | Register new user (used by seed/admin) |
| GET    | `/auth/me`      | ✅   | Any  | Returns current logged-in user profile |

**Login response:**
```json
{ "token": "<jwt>", "user": { "id", "name", "email", "role" } }
```

---

### Leads — `/api/leads`

| Method | Endpoint             | Auth | Role          | Description                              |
|--------|----------------------|------|---------------|------------------------------------------|
| GET    | `/leads`             | ✅   | Any           | List leads with search, stage, assignee, source filters + pagination |
| GET    | `/leads/:id`         | ✅   | Any           | Get single lead with notes and bookings  |
| POST   | `/leads`             | ✅   | Any           | Create new lead                          |
| PUT    | `/leads/:id`         | ✅   | Any           | Update lead details or advance stage     |
| DELETE | `/leads/:id`         | ✅   | ADMIN only    | Delete lead                              |
| POST   | `/leads/:id/notes`   | ✅   | Any           | Add timestamped note to lead             |

**Query params for GET `/leads`:**
- `search` — searches name, email, phone
- `stage` — filter by pipeline stage
- `assignedToId` — filter by sales rep (admin only)
- `source` — filter by lead source
- `page`, `limit` — pagination (max 50 per page)
- `sortBy`, `sortOrder` — sorting

**RBAC rules:**
- `SALES_EMPLOYEE` can only see/edit leads assigned to them
- `ADMIN` has full visibility and can reassign leads

---

### Properties — `/api/properties`

#### Projects

| Method | Endpoint                  | Auth | Role       | Description                        |
|--------|---------------------------|------|------------|------------------------------------|
| GET    | `/properties/projects`    | ✅   | Any        | List all projects with unit stats  |
| GET    | `/properties/projects/:id`| ✅   | Any        | Get project with buildings + units |
| POST   | `/properties/projects`    | ✅   | ADMIN only | Create new project                 |
| PUT    | `/properties/projects/:id`| ✅   | ADMIN only | Update project details             |

#### Buildings

| Method | Endpoint                   | Auth | Role       | Description                    |
|--------|----------------------------|------|------------|--------------------------------|
| GET    | `/properties/buildings`    | ✅   | Any        | List buildings (filter by projectId) |
| POST   | `/properties/buildings`    | ✅   | ADMIN only | Create building inside project |
| PUT    | `/properties/buildings/:id`| ✅   | ADMIN only | Update building                |

#### Units

| Method | Endpoint                | Auth | Role       | Description                              |
|--------|-------------------------|------|------------|------------------------------------------|
| GET    | `/properties/units`     | ✅   | Any        | List units (filter by projectId, buildingId, status, type, price range) |
| POST   | `/properties/units`     | ✅   | ADMIN only | Add unit to a building                   |
| PUT    | `/properties/units/:id` | ✅   | ADMIN only | Update unit details or status            |

---

### Bookings — `/api/bookings`

| Method | Endpoint                  | Auth | Role       | Description                                        |
|--------|---------------------------|------|------------|----------------------------------------------------|
| GET    | `/bookings`               | ✅   | Any        | List bookings (sales employee sees only their own) |
| POST   | `/bookings`               | ✅   | Any        | Create booking — runs inside PostgreSQL ACID transaction to prevent double-booking |
| PUT    | `/bookings/:id/cancel`    | ✅   | ADMIN only | Cancel booking and release unit back to AVAILABLE  |

**Booking transaction logic (POST `/bookings`):**
1. Lock and check unit status = `AVAILABLE` — reject with `409` if not
2. Check lead exists
3. Check no active booking already exists for this lead+unit
4. Set `Unit.status = BOOKED`
5. Set `Lead.stage = BOOKED`
6. Create `Booking` record with `status = CONFIRMED`
7. All 4 steps commit atomically — concurrent requests are safely rejected

---

### Dashboard — `/api/dashboard`

| Method | Endpoint     | Auth | Role | Description                                    |
|--------|--------------|------|------|------------------------------------------------|
| GET    | `/dashboard` | ✅   | Any  | Returns full analytics payload                 |

**Response includes:**
- `stats` — totalLeads, totalBookings, totalRevenue, totalUnits, availableUnits, overdueFollowUps
- `leadsByStage` — count per pipeline stage
- `leadsBySource` — count per acquisition source
- `bookingStats` — count + revenue per booking status
- `recentLeads` — last 5 leads
- `recentBookings` — last 5 bookings with full unit/project info
- `upcomingFollowUps` — leads with `followUpDate` not null and `<= now + 7 days`, stage not BOOKED/LOST

**RBAC scoping:** Sales employees only see their own leads and bookings. Admins see everything.

---

### Users — `/api/users`

| Method | Endpoint                  | Auth | Role       | Description                    |
|--------|---------------------------|------|------------|--------------------------------|
| GET    | `/users`                  | ✅   | ADMIN only | List all users                 |
| POST   | `/users`                  | ✅   | ADMIN only | Create new user                |
| PUT    | `/users/:id/toggle-active`| ✅   | ADMIN only | Activate / deactivate user     |

---

### Health Check

| Method | Endpoint      | Auth | Description              |
|--------|---------------|------|--------------------------|
| GET    | `/api/health` | ❌   | Returns `{ status: "ok", timestamp }` |

---

## 6. Authentication Flow

```
Client                        Server
  │                              │
  ├─ POST /api/auth/login ──────►│
  │   { email, password }        │ verify password (bcrypt)
  │                              │ sign JWT (userId, role, 7d)
  │◄─ { token, user } ──────────┤
  │                              │
  ├─ GET /api/leads ────────────►│
  │   Authorization: Bearer <jwt>│ authenticate middleware:
  │                              │   decode JWT → load user from DB
  │                              │   attach req.user
  │                              │ authorize middleware (if role-locked):
  │                              │   check req.user.role
  │◄─ { leads, pagination } ────┤
```

---

## 7. Middleware Stack

| Middleware     | Purpose                                                  |
|----------------|----------------------------------------------------------|
| `cors()`       | Allow cross-origin requests from React dev server        |
| `express.json()` | Parse JSON request bodies                              |
| `morgan('dev')`| HTTP request logging                                     |
| `authenticate` | Verify JWT, load user from DB, attach to `req.user`      |
| `authorize()`  | Role-based guard — rejects non-matching roles with 403   |
| `errorHandler` | Global error handler — formats errors as JSON responses  |

---

## 8. Environment Variables (`server/.env`)

| Variable       | Value                                      |
|----------------|--------------------------------------------|
| `PORT`         | `5000`                                     |
| `DATABASE_URL` | `postgresql://postgres:<password>@localhost:5432/realestate_crm?schema=public` |
| `JWT_SECRET`   | `realestate-crm-jwt-secret-key-2024`       |
| `JWT_EXPIRES_IN` | `7d`                                     |
| `NODE_ENV`     | `development`                              |

---

## 9. Key Business Rules

1. **Double-booking prevention** — Unit booking runs in a Prisma `$transaction`. If two requests hit simultaneously, the second gets a `409 Conflict`.
2. **Auto stage sync** — Booking a unit automatically sets `Lead.stage = BOOKED`. Cancelling a booking sets `Unit.status = AVAILABLE`.
3. **Data scoping** — Sales employees are silently scoped to their own leads/bookings at the query level (`where: { assignedToId: req.user.id }`).
4. **Auto-seed on empty DB** — On server startup, if no users exist, the server auto-creates admin accounts and a sample project so the app is immediately usable.
5. **Notification window** — Follow-up reminders show leads where `followUpDate IS NOT NULL AND followUpDate <= now + 7 days AND stage NOT IN (BOOKED, LOST)`.
