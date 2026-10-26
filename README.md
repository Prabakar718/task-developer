# EstateFlow CRM — Real Estate Sales & Property Booking Management System

A high-performance, modern full-stack Real Estate Customer Relationship Management (CRM) application built for sales teams and property developers to manage leads, track multi-stage sales pipelines, schedule site visits, maintain property unit inventory, and safely execute property bookings without race conditions or double-booking.

---

## 🌟 Key Features

### 1. Lead Management & Sales Pipeline
- **Full Lifecycle Stages**: `New`, `Contacted`, `Site Visit`, `Interested`, `Negotiation`, `Booked`, and `Lost`.
- **Search & Multi-Filter**: Filter by stage, sales representative, acquisition source (`MagicBricks`, `99acres`, `Website`, etc.), and search across customer name, phone, and email.
- **Lead Dossier & Notes**: Comprehensive lead detail page with chronological interaction history, timestamped notes, and follow-up calendar alerts.
- **Lead Assignment**: Sales employees automatically manage their assigned leads; Administrators can assign or reassign leads across the team.

### 2. Property & Inventory Management
- **Hierarchy Structure**: **Projects** (e.g., Sunrise Heights) $\rightarrow$ **Buildings/Towers** (e.g., Tower A, Tower B) $\rightarrow$ **Units** (e.g., A-402, Villa V-01).
- **Unit Metadata**: Type (`1 BHK`, `2 BHK`, `3 BHK`, `Penthouse`, `Villa`), Floor, Carpet Area (sq.ft), Price (INR), and Status (`AVAILABLE`, `RESERVED`, `BOOKED`, `SOLD`).
- **Live Inventory Filter**: Filter units by status and apartment layout with visual color-coded badges and instant one-click booking buttons.

### 3. Concurrency-Safe Booking Flow
- Connects verified customer leads directly to specific property units.
- **Atomic Double-Booking Prevention**: Executes inside a PostgreSQL ACID transaction. If two sales representatives simultaneously submit a booking for the same unit, the first commits and locks the unit status to `BOOKED` while transitioning the lead stage to `BOOKED`; the concurrent transaction is safely rejected with a clear conflict alert.
- **Cancellation & Unit Release**: Administrators can cancel a booking, which automatically restores the unit status back to `AVAILABLE`.

### 4. Executive Analytics Dashboard
- Key performance metrics: Total active leads, confirmed bookings count, total booking contract revenue (INR), available unit inventory, and overdue follow-up counters.
- Visual pipeline distribution bars with percentage breakdowns.
- Next 7-day priority follow-up agenda.
- Recent leads and recent bookings ledger.

### 5. Role-Based Access Control (RBAC)
- **`ADMIN`**: Global visibility, lead reassignment, project/building/unit creation, booking cancellation, team user provisioning, and deactivation.
- **`SALES_EMPLOYEE`**: Focused dashboard and pipeline showing only their assigned leads and bookings, with note-taking and unit booking abilities.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, React-Bootstrap, SCSS (Custom Design System), React Icons, React Router 6, Axios |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, Express-Validator, JWT, bcryptjs |
| **Database** | PostgreSQL 18 with relational schema and transactional isolation |

---

## 🧠 4 Important Architectural & Business Decisions Made

### 1. Atomic Database Transactions for Concurrency & Double-Booking Protection
* **Decision**: Implemented Prisma's interactive transaction (`prisma.$transaction`) on unit booking.
* **Why**: In real estate sales, multiple agents frequently pitch the same premium unit to different clients. Relying solely on client-side state or standard non-transactional queries leads to double-booking race conditions. By checking the unit's availability within an atomic transaction that marks the unit as `BOOKED` and creates the booking contract simultaneously, we guarantee database consistency and eliminate race conditions.

### 2. Multi-Stage Pipeline State Machine with Auto-Advancement
* **Decision**: When a booking is finalized, the customer's lead stage is automatically synchronized to `BOOKED`. Conversely, if an admin cancels a booking, the unit is immediately released back to `AVAILABLE`.
* **Why**: In real-world sales teams, manual stage updates lead to discrepancies between sales logs and inventory availability. Automating these transitions maintains a single source of truth across both inventory and CRM pipelines.

### 3. Strict Role-Based Data Scoping at the API Layer
* **Decision**: Sales employees can only query and modify leads assigned to them (`where: { assignedToId: req.user.id }`), while Administrators have full visibility and reassignment rights.
* **Why**: Protects customer confidentiality, prevents lead stealing among sales representatives, and ensures clear sales attribution and commission calculations.

### 4. High-Information-Density Dark Theme Design System (SCSS)
* **Decision**: Built a custom design system with SCSS variables, mixins, glassmorphism, and color-coded status badges rather than default UI component libraries.
* **Why**: Real estate CRM software is used for long hours by sales teams who need quick visual distinction across stages (e.g. orange for Negotiation, green for Booked, purple for Site Visit) with rapid data entry and zero visual clutter.

---

## 🚀 Setup & Local Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### 1. Database Configuration
Ensure PostgreSQL is running, then create the database:
```sql
CREATE DATABASE realestate_crm;
```
Configure your credentials in `server/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/realestate_crm?schema=public"
JWT_SECRET="estateflow-crm-jwt-secret-key-2024"
JWT_EXPIRES_IN="7d"
```

### 2. Backend Setup
```bash
cd server
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```
*Backend will be running on `http://localhost:5000`*

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```
*Frontend will be running on `http://localhost:3000`*

---

## 👥 Demo Login Credentials

The database seed provides realistic initial data and sample users:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@estatecrm.com` | `admin123` | Full access (Projects, Buildings, Units, Team, All Leads, Bookings) |
| **Sales Employee** | `priya@estatecrm.com` | `sales123` | Assigned leads, unit booking, notes logging |
| **Sales Employee** | `amit@estatecrm.com` | `sales123` | Assigned leads, unit booking, notes logging |

---

## 📡 API Overview

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate user and issue JWT token
- `POST /api/auth/register` — Provision user (Admin / Seed)
- `GET /api/auth/me` — Verify active token and retrieve session profile

### Leads (`/api/leads`)
- `GET /api/leads` — List leads with search, stage/assignee filter, and pagination
- `GET /api/leads/:id` — Get lead details with notes and booking history
- `POST /api/leads` — Create new lead (auto-assigned for sales reps)
- `PUT /api/leads/:id` — Update lead details or advance pipeline stage
- `DELETE /api/leads/:id` — Remove lead (Admin only)
- `POST /api/leads/:id/notes` — Append timestamped meeting/call note

### Properties (`/api/properties`)
- `GET /api/properties/projects` — List projects with live unit counts
- `POST /api/properties/projects` — Create project (Admin only)
- `GET /api/properties/buildings` — List buildings by project
- `POST /api/properties/buildings` — Create building/tower (Admin only)
- `GET /api/properties/units` — List units with status, price, and type filters
- `POST /api/properties/units` — Add unit to building (Admin only)

### Bookings (`/api/bookings`)
- `GET /api/bookings` — List bookings ledger
- `POST /api/bookings` — Transactional unit booking (race-condition protected)
- `PUT /api/bookings/:id/cancel` — Cancel booking and release unit back to available (Admin only)

### Analytics Dashboard (`/api/dashboard`)
- `GET /api/dashboard` — Sales metrics, pipeline distribution, and follow-up calendar alerts
