# CRM Backend System

## Description

This is a **backend-only analytical CRM system** designed for customer data management, engagement analysis, churn prediction, and marketing automation. Built with Node.js and Express, it provides a RESTful API that processes customer behavioral data stored in MongoDB, computing real-time insights through aggregation pipelines and rule-based scoring engines.

The system treats customers as a single denormalized collection, enabling fast analytics queries through MongoDB aggregations rather than complex joins. All features (analytics, segmentation, churn prediction, marketing automation) operate on this unified customer data model.

---

## Features

### Core Capabilities

- **Customer Management**: Create, read, update, delete customer records with automatic field validation
- **Advanced Search & Filtering**: Full-text search on customer names/emails, paginated list queries with country/churn filtering
- **Engagement Scoring**: Computed engagement metrics (0–100) based on login frequency, session duration, purchase behavior, and social engagement
- **Churn Prediction**: Rule-based churn scoring engine (0–100) categorizing customers into risk bands: Low, Medium, High
- **Customer Segmentation**: 
  - Behavioral segments (Power Users, Regular, Occasional, Dormant)
  - Value segments (High Value, Mid Value, Low Value)
  - Risk segments (Active, At Risk, Dormant, Churned)
  - Dynamic filtering by arbitrary customer attributes
- **Analytics Dashboard**:
  - Key Performance Indicators (KPIs)
  - Revenue and churn overviews
  - Geographic breakdown (top countries)
  - Revenue by quarter aggregations
  - Engagement distribution analysis
  - Demographic breakdowns
- **Marketing Automation**:
  - Predefined trigger rules (discount offers, reengagement emails, loyalty rewards, winback campaigns, review requests)
  - Dry-run previews before execution
  - Automatic marketing action logging per customer
- **Data Seeding**: CSV import script with automatic data transformation and computed field calculation
- **Security**: JWT authentication on write routes, CORS support, rate limiting, request logging, comprehensive error handling

---

## Tech Stack

### Backend Framework
- **Node.js** (≥ 18.0.0)
- **Express.js** ^4.19.2 — HTTP server & routing

### Database
- **MongoDB** — NoSQL document store
- **Mongoose** ^8.4.4 — ODM with schema validation and indexing

### Authentication & Security
- **jsonwebtoken** (JWT) ^9.0.3 — Token-based authentication
- **helmet** ^7.1.0 — Security headers
- **cors** ^2.8.5 — Cross-origin resource sharing
- **express-rate-limit** ^7.3.1 — Request rate limiting

### Data Validation & Processing
- **joi** ^17.13.1 — Schema validation
- **csv-parse** ^5.6.0 — CSV parsing for data import
- **dotenv** ^16.4.5 — Environment configuration

### Development Tools
- **nodemon** ^3.1.4 — Auto-restart on file changes
- **morgan** ^1.10.0 — HTTP request logging
- **eslint** ^9.5.0 — Code linting

---

## Project Structure

```
backend/
├── server.js                 # Entry point — initializes app & DB connection
├── app.js                    # Express app configuration (middleware, routes)
├── package.json              # Dependencies & scripts
│
├── data/
│   └── customers.csv         # Sample customer data for seeding
│
├── scripts/
│   └── importCsv.js          # One-shot CSV → MongoDB importer with scoring
│
└── src/
    ├── config/
    │   ├── db.js             # MongoDB connection setup
    │   └── env.js            # Environment variable validation
    │
    ├── models/
    │   └── Customer.js       # Single Mongoose schema (denormalized collection)
    │
    ├── controllers/          # HTTP request handlers (no business logic)
    │   ├── customer.controller.js
    │   ├── analytics.controller.js
    │   ├── segment.controller.js
    │   ├── churn.controller.js
    │   └── marketing.controller.js
    │
    ├── services/             # Business logic layer
    │   ├── customer.service.js
    │   ├── analytics.service.js
    │   ├── segment.service.js
    │   ├── churn.service.js
    │   └── marketing.service.js
    │
    ├── routes/               # API endpoint definitions
    │   ├── index.js          # Route aggregator
    │   ├── customer.routes.js
    │   ├── analytics.routes.js
    │   ├── segment.routes.js
    │   ├── churn.routes.js
    │   └── marketing.routes.js
    │
    ├── middleware/
    │   ├── auth.js           # JWT authentication & role-based access control
    │   ├── validate.js       # Request body/query validation with Joi schemas
    │   └── errorHandler.js   # Global error handling middleware
    │
    └── utils/
        ├── ApiError.js       # Standardized error class
        ├── paginate.js       # Pagination helper for aggregation pipelines
        ├── queryBuilder.js   # Dynamic query builder for filtering
        └── scoring.js        # Engagement & churn score algorithms
```

### Key Design Principles

- **Separation of Concerns**: Controllers handle HTTP, services contain business logic
- **Single Collection Model**: All customer data in one collection with computed fields
- **Aggregation Pipelines**: Analytics queries use MongoDB `$lookup`, `$group`, `$facet` for performance
- **Middleware Chain**: Validation → Authentication → Authorization → Handler
- **Error Standardization**: All errors inherit from `ApiError` with consistent response format

---

## Installation

### Prerequisites

- Node.js ≥ 18.0.0
- MongoDB (local or Atlas)
- npm or yarn

### Steps

1. **Clone the repository** (or navigate to the project):
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the `backend/` directory (see [Environment Variables](#environment-variables) below):
   ```bash
   cp .env.example .env  # if available, otherwise create manually
   ```

4. **Verify the `.env` file** has required variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/crm_db
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key
   CLIENT_ORIGIN=http://localhost:3000
   ```

5. **Seed the database** (optional, loads sample data):
   ```bash
   npm run seed:fresh
   ```
   - `--drop`: Clears existing customer collection before import
   - Uses `data/customers.csv` and auto-computes engagement & churn scores

---

## Environment Variables

Create a `.env` file in the `backend/` directory with the following:

| Variable        | Type   | Required | Default                 | Description                                         |
|-----------------|--------|----------|-------------------------|-----------------------------------------------------|
| `PORT`          | number | Yes      | 5000                    | HTTP server port                                    |
| `MONGO_URI`     | string | Yes      | —                       | MongoDB connection string (local or Atlas)          |
| `NODE_ENV`      | string | No       | `development`           | Runtime environment (`development` or `production`) |
| `JWT_SECRET`    | string | No*      | —                       | Secret key for JWT signing (required if using auth) |
| `CLIENT_ORIGIN` | string | No       | `http://localhost:3000` | CORS allowed origin                                 |

**\* Note**: `JWT_SECRET` is **required** if authentication middleware is active. See [Authentication Bypass](#authentication-bypass) for development.

### Example `.env`

```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/crm_db
NODE_ENV=development
JWT_SECRET=your-super-secret-key-change-this-in-production
CLIENT_ORIGIN=http://localhost:3000
```

### MongoDB Atlas Connection

For MongoDB Atlas (cloud):

```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/crm_db?retryWrites=true&w=majority
```

---

## Running the Server

### Start Development Server

```bash
npm run dev
```
- Automatically restarts on file changes (nodemon)
- Outputs request logs (morgan)
- Default: `http://localhost:5000`

### Start Production Server

```bash
npm start
```
- No auto-restart; run with PM2 or Docker in production

### Verify Server is Running

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": "1234s"
}
```

### Database Seeding

**Import fresh customer data from CSV**:
```bash
# Drop existing collection and import
npm run seed:fresh

# Or import without dropping
npm run seed -- --file=./data/customers.csv
```

---

## API Endpoints

All endpoints are prefixed with `/api`.

### **1. Customer Management**

Base path: `/api/customers`

| Method   | Endpoint            | Auth | Description                                            |
|----------|---------------------|------|--------------------------------------------------------|
| `GET`    | `/`                 | No   | List all customers (paginated, searchable, filterable) |
| `GET`    | `/:id`              | No   | Get single customer full profile                       |
| `POST`   | `/`                 | Yes  | Create new customer                                    |
| `PATCH`  | `/:id`              | Yes  | Update customer fields                                 |
| `DELETE` | `/:id`              | Yes  | Hard delete customer                                   |
| `POST`   | `/recompute-scores` | Yes  | Bulk recompute all engagement scores                   |

#### Example: List Customers with Filters

```bash
curl "http://localhost:5000/api/customers?page=1&limit=10&search=john&country=US&churned=false"
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Full-text search on name/email
- `country`: Filter by country
- `churned`: Filter by churn status (true/false)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "full_name": "John Doe",
      "email": "john@example.com",
      "country": "US",
      "lifetime_value": 5200,
      "churn_score": 25,
      "churn_risk": "Low",
      "engagement_score": 78
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "pages": 15
}
```

#### Example: Create Customer (Requires JWT)

```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Smith",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "phone": "+1-555-123-4567",
    "country": "US",
    "age": 32
  }'
```

---

### **2. Analytics Dashboard**

Base path: `/api/analytics` (all read-only)

| Method | Endpoint                   | Description                                               |
|--------|----------------------------|-----------------------------------------------------------|
| `GET`  | `/kpis`                    | Overall KPIs (total customers, avg LTV, churn rate, etc.) |
| `GET`  | `/by-country`              | Revenue & customer count by top countries                 |
| `GET`  | `/revenue-by-quarter`      | Revenue aggregated by signup quarter                      |
| `GET`  | `/churn-overview`          | Churn rate, at-risk count, churned count                  |
| `GET`  | `/engagement-distribution` | Distribution of customers across engagement bands         |
| `GET`  | `/gender-breakdown`        | Customer count by gender                                  |

#### Example: Get KPIs

```bash
curl http://localhost:5000/api/analytics/kpis
```

**Response**:
```json
{
  "success": true,
  "data": {
    "total_customers": 5000,
    "avg_lifetime_value": 2350,
    "churn_rate": 12.5,
    "avg_engagement_score": 65,
    "total_revenue": 11750000
  }
}
```

#### Example: Revenue by Country (Top 10)

```bash
curl "http://localhost:5000/api/analytics/by-country?limit=15"
```

---

### **3. Customer Segmentation**

Base path: `/api/segments` (read-only)

| Method | Endpoint      | Description                                                  |
|--------|---------------|--------------------------------------------------------------|
| `GET`  | `/behavioral` | Segment breakdown (Power User, Regular, Occasional, Dormant) |
| `GET`  | `/value`      | Segment breakdown (High, Mid, Low value)                     |
| `GET`  | `/risk`       | Segment breakdown (Active, At Risk, Dormant, Churned)        |
| `POST` | `/dynamic`    | Arbitrary filtering with pagination                          |

#### Example: Get Behavioral Segments

```bash
curl http://localhost:5000/api/segments/behavioral
```

**Response**:
```json
{
  "success": true,
  "data": {
    "Power User": 450,
    "Regular": 1200,
    "Occasional": 2100,
    "Dormant": 1250
  }
}
```

#### Example: Dynamic Segmentation (with Filters)

```bash
curl -X POST http://localhost:5000/api/segments/dynamic \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "churned": false,
    "lifetime_value_min": 1000,
    "page": 1,
    "limit": 20
  }'
```

---

### **4. Churn Analysis**

Base path: `/api/churn`

| Method | Endpoint        | Auth | Description                                    |
|--------|-----------------|------|------------------------------------------------|
| `GET`  | `/at-risk`      | No   | Paginated list of High + Medium risk customers |
| `GET`  | `/distribution` | No   | Risk distribution (count + avg score per band) |
| `POST` | `/score/:id`    | Yes  | Recompute churn score for one customer         |
| `POST` | `/score-all`    | Yes  | Bulk recompute all churn scores                |

#### Example: Get At-Risk Customers

```bash
curl "http://localhost:5000/api/churn/at-risk?page=1&limit=20&risk=High"
```

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `risk`: Risk level filter (Low, Medium, High, or comma-separated)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "full_name": "John Doe",
      "churn_score": 85,
      "churn_risk": "High",
      "lifetime_value": 3200,
      "days_since_last_purchase": 120
    }
  ],
  "total": 342,
  "page": 1,
  "limit": 20,
  "pages": 18
}
```

---

### **5. Marketing Automation**

Base path: `/api/marketing`

| Method | Endpoint             | Auth | Description                                        |
|--------|----------------------|------|----------------------------------------------------|
| `GET`  | `/definitions`       | No   | List all marketing trigger rules and conditions    |
| `GET`  | `/triggers`          | No   | Preview: which customers match each rule (dry-run) |
| `POST` | `/run-automation`    | Yes  | Execute marketing automation (or dry-run)          |
| `GET`  | `/by-action/:action` | No   | List customers who received specific action        |

#### Available Trigger Rules

- **DISCOUNT_OFFER**: High LTV + not recently purchased
- **REENGAGEMENT_EMAIL**: Low engagement score + no recent login
- **LOYALTY_REWARD**: High LTV + long membership + active usage
- **WINBACK_CAMPAIGN**: Churned or dormant customers
- **REVIEW_REQUEST**: Recent purchases + high satisfaction signals

#### Example: Preview Marketing Actions

```bash
curl http://localhost:5000/api/marketing/triggers
```

**Response**:
```json
{
  "success": true,
  "data": {
    "DISCOUNT_OFFER": 245,
    "REENGAGEMENT_EMAIL": 189,
    "LOYALTY_REWARD": 567,
    "WINBACK_CAMPAIGN": 34,
    "REVIEW_REQUEST": 412
  }
}
```

#### Example: Execute Marketing Automation (Dry-Run)

```bash
curl -X POST http://localhost:5000/api/marketing/run-automation \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "dryRun": true }'
```

#### Example: Execute Marketing Automation (Write to DB)

```bash
curl -X POST http://localhost:5000/api/marketing/run-automation \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "dryRun": false }'
```

---

### **6. Health Check**

| Method | Endpoint      | Description            |
|--------|---------------|------------------------|
| `GET`  | `/api/health` | Server status & uptime |

```bash
curl http://localhost:5000/api/health
```

---

## Database Design

### Collections

The system uses a **single denormalized collection** approach:

#### `customers`

All customer data is stored in a single MongoDB collection called `customers`. This enables:
- Fast analytics queries without complex joins
- Computed fields automatically updated via service methods
- Efficient indexing on frequently-queried fields

### Schema Overview

```javascript
{
  _id: ObjectId,

  // ── Identity ─────────────────
  full_name: String,              // e.g., "John Doe"
  first_name: String,
  last_name: String,
  email: String (unique),
  phone: String (optional),

  // ── Location ─────────────────
  country: String,                // e.g., "US", "UK"
  city: String (optional),

  // ── Demographics ─────────────
  age: Number,
  gender: String,                 // "Male" | "Female" | "Other"

  // ── Membership ───────────────
  membership_years: Number,
  signup_quarter: String,         // e.g., "Q1-2021"

  // ── Behavioral ───────────────
  login_frequency: Number,        // logins/month
  session_duration_avg: Number,   // minutes
  pages_per_session: Number,
  mobile_app_usage: Number,       // % (0-100)
  social_media_engagement_score: Number, // 0-100
  email_open_rate: Number,        // % (0-100)
  product_reviews_written: Number,

  // ── Transactional ────────────
  total_purchases: Number,
  average_order_value: Number,
  lifetime_value: Number,         // total revenue from customer
  days_since_last_purchase: Number,
  cart_abandonment_rate: Number,  // % (0-100)
  wishlist_items: Number,
  discount_usage_rate: Number,    // % (0-100)
  returns_rate: Number,           // % (0-100)
  payment_method_diversity: Number, // count of payment methods

  // ── Support ──────────────────
  customer_service_calls: Number,

  // ── Churn ────────────────────
  churned: Boolean,

  // ── Computed Fields (Updated by Services) ─────────────────
  engagement_score: Number,       // 0-100 (auto-computed)
  churn_score: Number,            // 0-100 (auto-computed)
  churn_risk: String,             // "Low" | "Medium" | "High"
  credit_balance: Number,

  // ── Marketing Log ────────────
  marketing_actions: [
    {
      action: String,             // e.g., "DISCOUNT_SENT"
      reason: String,             // human-readable trigger
      triggered_at: Date
    }
  ],

  // ── Timestamps ───────────────
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Indexes

For query performance, the following indexes are created:

| Index    | Fields                            | Purpose                      |
|----------|-----------------------------------|------------------------------|
| Compound | `country`, `churned`              | Common list + filter queries |
| Unique   | `email`                           | Email uniqueness constraint  |
| Single   | `churned`                         | Churn filter queries         |
| Single   | `churn_risk`                      | At-risk customer queries     |
| Single   | `engagement_score` (desc)         | Engagement ranking           |
| Single   | `lifetime_value` (desc)           | Value ranking                |
| Single   | `days_since_last_purchase` (desc) | Recency ranking              |
| Single   | `signup_quarter`                  | Quarterly aggregations       |
| Text     | `full_name`, `email`              | Full-text search             |

### Relationships

**No explicit relationships** — the system is single-collection:
- Customer is the only entity
- All analytics, segments, and marketing rules operate on customer fields
- No foreign keys or embedded subdocuments (except marketing_actions array)

---

## Architecture Overview

### Request Flow

```
HTTP Request
    ↓
Middleware Chain:
  1. helmet (security headers)
  2. cors (cross-origin)
  3. morgan (logging)
  4. rate-limiter
  5. body-parser (JSON)
    ↓
Routing: Match to handler
    ↓
Validation Middleware:
  - Joi schema validation
  - Returns 400 if invalid
    ↓
Authentication Middleware (if protected):
  - Extract & verify JWT
  - Attach req.user
  - Returns 401 if missing/invalid
    ↓
Route Handler (Controller):
  - Parse request params/body
  - Call appropriate service
    ↓
Service Layer (Business Logic):
  - Query/mutate database
  - Compute scores (churn, engagement)
  - Apply filtering/aggregation
  - Return result
    ↓
Response Sent:
  - 200 OK / 201 Created / 400 Bad Request / 401 Unauthorized / 404 Not Found / 500 Server Error
    ↓
Error Handler (if error):
  - Catch all errors
  - Log to console
  - Return standardized error response
```

### Scoring Engines

#### Engagement Score (0–100)

Computes engagement based on:
- Login frequency (weight: 20%)
- Session duration (weight: 25%)
- Pages per session (weight: 20%)
- Mobile app usage (weight: 10%)
- Social media engagement (weight: 15%)
- Email open rate (weight: 10%)

#### Churn Score (0–100)

Predicts churn risk based on:
- Days since last purchase (weight: 30%)
- Engagement score (weight: 25%)
- Login frequency (weight: 15%)
- Email open rate (weight: 10%)
- Support calls (weight: 10%)
- Returns rate (weight: 10%)

Risk Bands:
- **Low**: 0–34
- **Medium**: 35–64
- **High**: 65–100

### Segmentation Strategy

#### Behavioral Segments
- **Power User**: High login frequency + high session duration
- **Regular**: Moderate engagement
- **Occasional**: Low engagement but some activity
- **Dormant**: No recent activity

#### Value Segments
- **High Value**: LTV ≥ $5,000
- **Mid Value**: $1,000 ≤ LTV < $5,000
- **Low Value**: LTV < $1,000

#### Risk Segments
- **Active**: churn_score ≤ 34 (Low risk)
- **At Risk**: 35 ≤ churn_score ≤ 64 (Medium risk)
- **Dormant**: High risk but not churned
- **Churned**: churned = true

---

## Authentication

### Current Status

**JWT authentication is implemented but optional** during development.

### How It Works

1. **Obtain Token** (implement login route separately):
   ```bash
   POST /api/auth/login
   Body: { email: "user@example.com", password: "..." }
   Response: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
   ```

2. **Use Token** on protected routes:
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/customers
   ```

### Protected Routes (Write Operations)

All `POST`, `PATCH`, `DELETE` operations require JWT authentication.

### Authentication Bypass (Development)

If you haven't implemented login/register yet, temporarily bypass auth:

In [src/middleware/auth.js](src/middleware/auth.js), replace:

```javascript
const protect = (req, res, next) => { /* verify JWT */ };
```

with:

```javascript
const protect = (req, res, next) => next(); // bypass
```

---

## Error Handling

All errors follow a standardized format:

### Error Response

```json
{
  "success": false,
  "message": "Customer not found",
  "statusCode": 404,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Status Codes

| Code  | Meaning                 | Example                           |
|-------|-------------------------|-----------------------------------|
| 200   | OK                      | Successful GET/PATCH              |
| 201   | Created                 | Successful POST                   |
| 400   | Bad Request             | Invalid input (validation failed) |
| 401   | Unauthorized            | Missing/invalid JWT token         |
| 404   | Not Found               | Customer/route not found          |
| 429   | Too Many Requests       | Rate limit exceeded               |
| 500   | Internal Server Error   | Unexpected server error           |

---

## Rate Limiting

Global rate limiter: **500 requests per 15 minutes per IP address**

Applies to all `/api` routes.

Response when limit exceeded:
```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

---

## Development Tips

### Debugging

Enable verbose logging:
```bash
NODE_ENV=development npm run dev
```
- Morgan logs all HTTP requests
- Errors are printed to console with full stack traces

### Linting

Check code style:
```bash
npm run lint
```

### Common Issues

#### `MONGO_URI is not defined`
- Ensure `.env` file exists in `backend/` directory
- Verify `MONGO_URI` is set

#### `MongoDB connection failed`
- Check MongoDB is running (local: `mongod`, or connect to Atlas)
- Verify connection string is correct

#### `JWT verification failed`
- Ensure `JWT_SECRET` is set in `.env`
- Token must be in `Authorization: Bearer <TOKEN>` format

#### Port already in use
```bash
# Change port
PORT=5001 npm run dev

# Or kill process using port 5000
# Linux/Mac: lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill
# Windows: netstat -ano | findstr :5000
```

---

## Future Improvements

### Phase 2: Frontend Integration
- React/Vue dashboard for visualizing analytics, segments, and churn predictions
- Customer management UI for CRUD operations
- Real-time KPI dashboards with charts and filters

### Phase 3: Advanced Features
- **Machine Learning**: Replace rule-based churn scoring with ML models (TensorFlow.js, Python service)
- **Real-Time Notifications**: WebSocket support for live dashboard updates
- **Email Integration**: Auto-send marketing emails via SendGrid/Mailgun
- **File Uploads**: Customer photo/document uploads to cloud storage

### Phase 4: Scalability & Performance
- **Caching**: Redis for frequently-accessed data (KPIs, segments)
- **Message Queue**: Bullmq/RabbitMQ for async job processing (bulk scoring, marketing campaigns)
- **Horizontal Scaling**: Deploy multiple instances behind load balancer
- **Database Optimization**: Sharding for large datasets, read replicas for analytics

### Phase 5: Security & Compliance
- **RBAC Expansion**: Admin, Manager, Staff, Analyst roles with fine-grained permissions
- **Audit Logging**: Track all data modifications with user & timestamp
- **Data Encryption**: Encrypt PII at rest (customer names, emails, phone numbers)
- **Compliance**: GDPR right-to-delete, data export functionality
- **API Keys**: Support API key authentication in addition to JWT

### Phase 6: Advanced Analytics
- **Cohort Analysis**: Segment customers by signup cohort and track retention
- **Predictive Analytics**: Forecast LTV, purchase likelihood, churn probability
- **Custom Reports**: Builder for ad-hoc reports with email scheduling
- **Data Warehouse Integration**: Sync with BigQuery/Redshift for BI tools

---

## Troubleshooting

### Server won't start
```bash
# Check if port is in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux

# Check environment variables
echo $MONGO_URI
echo $PORT
```

### Database connection timeout
```bash
# Verify MongoDB is running
mongo  # or mongosh for newer versions

# Test connection with MongoDB CLI
mongo "mongodb://localhost:27017/crm_db"
```

### Rate limit errors
- Wait 15 minutes, or
- Use different IP/VPN, or
- Adjust rate limit in [app.js](app.js)

### JWT authentication errors
- Ensure token is in `Authorization: Bearer <TOKEN>` format
- Verify `JWT_SECRET` is set and consistent
- Check token hasn't expired

---

## Contributing

- Follow existing code structure (MVC + Services)
- Add Joi validation schemas for new endpoints
- Write error handling with try-catch in controllers
- Update this README with new features/endpoints

---

## License

This project is part of the Information System Management course at IU.

---

## Author

**Project**: Analytical CRM Backend System  
**Course**: Y4 S2 Information System Management  
**Institution**: IU (Indiana University)  
**Created**: 2024

---

## Quick Start Checklist

- [ ] Clone repository / navigate to `backend/`
- [ ] Run `npm install`
- [ ] Create `.env` with `MONGO_URI`, `PORT`, `JWT_SECRET`
- [ ] Start MongoDB locally or use Atlas
- [ ] Run `npm run dev` to start server
- [ ] Run `npm run seed:fresh` to load sample data
- [ ] Test: `curl http://localhost:5000/api/health`
- [ ] Explore endpoints in [API Endpoints](#api-endpoints) section

