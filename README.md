# CRM Analytics System (Fullstack)

A fullstack CRM analytics project for customer management, segmentation, churn analysis, and marketing automation.

- Backend: Node.js + Express + MongoDB (aggregation-driven analytics API)
- Frontend: React + Vite + Tailwind (dashboard and feature pages)

This repository is structured as a monorepo-style workspace with two apps:

- backend: REST API, business logic, data import, scoring engines
- frontend: UI dashboard consuming backend APIs via /api proxy

## What's Included

### Backend Features

- Customer CRUD with validation
- Search, filter, sort, and pagination
- Engagement scoring and churn scoring
- Analytics aggregations (KPI, country, quarter, churn overview, engagement bands, gender)
- Segmentation (behavioral, value, risk, dynamic)
- Marketing automation triggers with dry-run and execution modes
- CSV data import script with optional fresh drop
- Security middleware: helmet, CORS, rate limiting, JWT middleware

### Frontend Features

- Sidebar-based CRM dashboard UI
- Pages:
  - Dashboard
  - Customers
  - Customer Detail
  - Analytics
  - Segments
  - Churn
  - Marketing
- Data fetching/caching via TanStack Query
- Charts via Recharts
- Axios client with optional JWT header from localStorage crm_token

## Tech Stack

### Backend

- Node.js >= 18
- Express 4
- MongoDB + Mongoose
- Joi validation
- jsonwebtoken
- helmet, cors, express-rate-limit, morgan

### Frontend

- React 18
- React Router 6
- Vite 5
- Tailwind CSS
- @tanstack/react-query
- Axios
- Recharts
- Lucide React

## Repository Structure

```
ProjectCRM/
├─ backend/
│  ├─ app.js
│  ├─ server.js
│  ├─ package.json
│  ├─ data/
│  │  └─ customers.csv
│  ├─ scripts/
│  │  └─ importCsv.js
│  └─ src/
│     ├─ config/
│     ├─ controllers/
│     ├─ middleware/
│     ├─ models/
│     ├─ routes/
│     ├─ services/
│     └─ utils/
└─ frontend/
   ├─ index.html
   ├─ package.json
   ├─ vite.config.js
   └─ src/
      ├─ api/
      ├─ components/
      ├─ pages/
      ├─ App.jsx
      └─ main.jsx
```

## Prerequisites

- Node.js 18+
- npm
- MongoDB local or MongoDB Atlas

## Environment Variables

Create backend/.env:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/crm_db
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
CLIENT_ORIGIN=http://localhost:3000
```

Notes:

- PORT defaults to 5000.
- Frontend Vite dev server runs on 3000 and proxies /api to http://localhost:5000.
- JWT_SECRET is required only for routes guarded by protect middleware.

## Install

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

## Run (Development)

Start backend:

```bash
cd backend
npm run dev
```

Start frontend (new terminal):

```bash
cd frontend
npm run dev
```

Open app:

- http://localhost:3000

Backend API base:

- http://localhost:5000/api

## Seed Data

From backend folder:

```bash
npm run seed:fresh
```

Or without dropping existing collection:

```bash
npm run seed
```

## API Overview

All endpoints are under /api.

### Health

- GET /api/health

### Customers

- GET /api/customers
- GET /api/customers/:id
- POST /api/customers (auth)
- PATCH /api/customers/:id (auth)
- DELETE /api/customers/:id (auth)
- POST /api/customers/recompute-scores (auth)

### Analytics

- GET /api/analytics/kpis
- GET /api/analytics/by-country
- GET /api/analytics/revenue-by-quarter
- GET /api/analytics/churn-overview
- GET /api/analytics/engagement-distribution
- GET /api/analytics/gender-breakdown

### Segments

- GET /api/segments/behavioral
- GET /api/segments/value
- GET /api/segments/risk
- POST /api/segments/dynamic

### Churn

- GET /api/churn/at-risk
- GET /api/churn/distribution
- POST /api/churn/score/:id (auth)
- POST /api/churn/score-all (auth)

### Marketing

- GET /api/marketing/definitions
- GET /api/marketing/triggers
- POST /api/marketing/run-automation
- GET /api/marketing/by-action/:action

Current behavior in this codebase:

- marketing/run-automation is currently public (no protect middleware) to support frontend flow without login.

## Frontend Route Map

- / -> Dashboard
- /customers -> Customers list
- /customers/:id -> Customer detail
- /analytics -> Analytics charts
- /segments -> Segmentation
- /churn -> Churn analysis
- /marketing -> Marketing automation

## Security and Middleware

Backend app uses:

- helmet for security headers
- cors with CLIENT_ORIGIN
- express-rate-limit on /api (500 requests/15 min per IP)
- morgan request logging in development
- global error handler with standardized JSON errors

## Useful Commands

Backend:

```bash
npm run dev
npm run start
npm run seed
npm run seed:fresh
npm run lint
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

## Architecture Summary

- Controllers handle HTTP request/response only.
- Services contain business logic and MongoDB queries.
- Customer is the central collection used for analytics, segmentation, churn, and marketing.
- Frontend consumes backend APIs through a shared Axios client and caches query data via React Query.

## Course Context

Project for Information System Management, IU-VNU-HCM.

---

# CRM System — Frontend

A React dashboard for customer relationship management, analytics, churn prediction, segmentation, and marketing automation.

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| Framework | React 18.3 |
| Routing | React Router DOM 6 |
| Data fetching | TanStack React Query 5 |
| HTTP client | Axios 1.7 |
| Styling | Tailwind CSS 3.4 |
| Forms | React Hook Form 7 |
| Charts | Recharts 2.12 |
| Icons | Lucide React |
| Build tool | Vite 5.4 |

---

## Getting Started

**Prerequisites:** Node.js ≥ 18, backend running on `http://localhost:5000`

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build → dist/
npm run preview    # preview production build locally
```

The dev server proxies all `/api/*` requests to `http://localhost:5000`.

---

## Folder Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.js          # Axios instance with JWT interceptor
│   │   ├── analytics.js       # KPI, revenue, engagement endpoints
│   │   ├── customers.js       # Customer CRUD
│   │   ├── churn.js           # Churn scoring endpoints
│   │   ├── segments.js        # Segmentation endpoints
│   │   └── marketing.js       # Marketing automation endpoints
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx     # App shell with sidebar
│   │   │   └── Sidebar.jsx    # Navigation sidebar
│   │   └── ui/
│   │       ├── Badge.jsx
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── Input.jsx
│   │       ├── KpiCard.jsx
│   │       ├── Modal.jsx
│   │       ├── Pagination.jsx
│   │       └── Spinner.jsx
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx       # KPIs + overview charts
│   │   ├── Customers.jsx       # Customer list, search, filters
│   │   ├── CustomerDetail.jsx  # Customer profile + inline edit
│   │   ├── Analytics.jsx       # Revenue & engagement charts
│   │   ├── Segmentation.jsx    # Behavioral / value / risk segments
│   │   ├── ChurnAnalysis.jsx   # Churn prediction & at-risk table
│   │   └── Marketing.jsx       # Marketing automation triggers
│   │
│   ├── lib/
│   │   └── utils.js            # Currency, percent, number formatters
│   │
│   ├── App.jsx                 # Route configuration
│   └── main.jsx                # Entry point, QueryClient setup
│
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | KPI cards, revenue by quarter, customer status & engagement charts |
| `/customers` | Customers | Paginated list; search by name/email; filter by country, churn status, risk level; create & delete |
| `/customers/:id` | Customer Detail | Full profile with personal info, financials, engagement metrics, churn score; inline edit; rescore |
| `/analytics` | Analytics | Revenue by country & quarter, engagement distribution, gender breakdown |
| `/segments` | Segmentation | Behavioral (Power/Regular/Occasional/Dormant), value (High/Mid/Low LTV), and risk segments with charts |
| `/churn` | Churn Analysis | Risk band summary cards, churn distribution chart, at-risk customers table with rescoring |
| `/marketing` | Marketing | Dry-run preview and live execution of automation triggers (discount, re-engagement, loyalty, winback, review) |

---

## API Integration

All API modules live in `src/api/`. The Axios client in `client.js`:
- Attaches the JWT token from `localStorage.crm_token` to every request.
- Standardises error responses.

| Module | Endpoints used |
|---|---|
| `analytics.js` | KPIs, revenue, engagement, gender |
| `customers.js` | List (with filters), get one, create, update, delete |
| `churn.js` | Risk distribution, at-risk list, rescore one / all |
| `segments.js` | Behavioral, value, risk breakdown |
| `marketing.js` | Trigger definitions, preview, execute |

---

## Authentication

The app expects a JWT token stored in `localStorage` under the key `crm_token`. The token is attached automatically by the Axios interceptor. No login UI is included in this version — obtain the token from the backend and set it manually or integrate a login page.

---

## React Query Configuration

Configured in `main.jsx`:

```js
staleTime: 2 * 60 * 1000   // 2 minutes
retry: 1
```

---

## Environment

No `.env` file is required. The backend URL is set in `vite.config.js`:

```js
proxy: {
  '/api': 'http://localhost:5000'
}
```

Change this if your backend runs on a different port.
