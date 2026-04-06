# Finance Data Processing and Access Control Backend

A robust, role-based backend API for a finance dashboard built using Node.js, Express, and SQLite. This project demonstrates core backend engineering principles including API design, data modeling, role-based access control (RBAC), validation, and error handling.

## 🚀 Features

- **Authentication & Authorization**: Secure JWT-based authentication.
- **Role-Based Access Control (RBAC)**: Support for `Admin`, `Analyst`, and `Viewer` roles, each with strict permission boundaries.
- **Financial Records Management**: Full CRUD operations for income and expense records with soft-delete capabilities.
- **Rich Filtering & Pagination**: Easily query records by type, category, date range, or search terms.
- **Dashboard Analytics**: Aggregation endpoints for total summaries, category breakdowns, and monthly trends.
- **Robust Validation**: Strict input validation using Joi.
- **Centralized Error Handling**: Clean, consistent error responses across the API.
- **Security best practices**: Implements Rate Limiting, Helmet, and CORS.
- **Interactive Documentation**: Swagger UI for exploring and testing endpoints.
- **Comprehensive Testing**: Integration tests using Jest and Supertest.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (via `better-sqlite3` for high-performance synchronous access)
- **Authentication**: JSON Web Tokens (JWT) & `bcrypt` for password hashing
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Documentation**: Swagger JS-Doc & Swagger UI Express

---

## 📦 Project Structure

```text
Project/
├── data/                    # SQLite database files (auto-generated)
├── src/
│   ├── app.js               # Express app configuration & middleware setup
│   ├── server.js            # Main entry point (starts the HTTP server)
│   ├── config/              # Database initialization and connection logic
│   ├── middleware/          # Auth, RBAC, Validation, and Global Error handlers
│   ├── models/              # Data Access Layer (raw SQLite queries wrapped in classes)
│   ├── routes/              # Express routers defining endpoints
│   ├── services/            # Business logic separation from routes/controllers
│   ├── utils/               # Constants and Custom Error classes
│   └── scripts/             # Utility scripts (e.g., database seeding)
├── tests/                   # Integration tests organized by module
├── .env.example             # Template for environment variables
├── package.json             # Dependencies and NPM scripts
├── swagger.js               # OpenAPI/Swagger configuration
└── README.md                # This file
```

---

## 🚦 Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18 or higher recommended)
- **npm** (Node Package Manager)

*If you do not have Node.js installed, download it from [nodejs.org](https://nodejs.org/) or use a version manager like `nvm`.*

### Installation & Setup

1. **Navigate to the project directory** (if you aren't already there):
   ```bash
   cd /home/tejas/Desktop/tejas/Project
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   A `.env` file has already been created from `.env.example`. Check the `.env` file in the root directory to ensure it looks like this:
   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=finance-dashboard-secret-key-dev-2024
   JWT_EXPIRES_IN=24h
   DB_PATH=./data/finance.db
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX=100
   ```
   *Note: The SQLite database file acts locally. Ensure the `data/` folder exists or the app will create it automatically based on the `DB_PATH`.*

4. **Seed the Database (Optional but Recommended)**:
   Populate the database with sample users and initial financial records for testing:
   ```bash
   npm run seed
   ```
   **Seed Users Created:**
   - **Admin**: `admin` / `admin123`
   - **Analyst**: `analyst` / `analyst123`
   - **Viewer**: `viewer` / `viewer123`

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   *Alternatively, start in production mode using `npm start`.*

6. **Explore the API**:
   Open your browser and navigate to the interactive Swagger configuration:
   👉 **http://localhost:3000/api-docs**

---

## 🧪 Running Tests

This project includes a comprehensive suite of integration tests using an isolated, in-memory SQLite database to ensure the live database is untouched.

Run the test suite with:
```bash
npm test
```
*Tests cover Auth, Users, Financial Records, and Dashboard functionalities including strict checks on RBAC permissions.*

---

## 🧑‍💻 Role-Based Access Control (RBAC) Matrix

| Feature | Viewer (`viewer`) | Analyst (`analyst`) | Admin (`admin`) |
| :--- | :---: | :---: | :---: |
| **Login & Profile** | ✅ | ✅ | ✅ |
| **View Latest Activity** | ✅ | ✅ | ✅ |
| **List Financial Records** | ✅ | ✅ | ✅ |
| **View Dashboard Summaries**| ❌ | ✅ | ✅ |
| **View Trends & Breakdown** | ❌ | ✅ | ✅ |
| **Create/Update Records** | ❌ | ❌ | ✅ |
| **Delete Records (Soft)** | ❌ | ❌ | ✅ |
| **Manage Users/Roles** | ❌ | ❌ | ✅ |

---

## 🌐 API Endpoints Overview

*For exact payloads and responses, refer to the `/api-docs` Swagger UI.*

### Auth
- `POST /api/auth/register`: Create a new user.
- `POST /api/auth/login`: Authenticate and receive a JWT token.

### Users (Admin Only)
- `GET /api/users`: List all system users.
- `GET /api/users/:id`: Get user details (Allowed for Admin or Self).
- `PATCH /api/users/:id`: Update a user's role or status.
- `DELETE /api/users/:id`: Deactivate a user.

### Financial Records
- `GET /api/records`: Fetch paginated records with optional filters (`type`, `category`, `startDate`, `endDate`, `search`).
- `GET /api/records/:id`: Fetch a specific record.
- `POST /api/records`: Create a new income/expense record (Admin).
- `PUT /api/records/:id`: Update an existing record (Admin).
- `DELETE /api/records/:id`: Soft-delete a record (Admin).

### Dashboard Analytics
- `GET /api/dashboard/summary`: Overall income, expenses, and net balance (Analyst/Admin).
- `GET /api/dashboard/category-summary`: Breakdown of funds by category (Analyst/Admin).
- `GET /api/dashboard/trends`: Month-over-month financial trends (Analyst/Admin).
- `GET /api/dashboard/recent`: Most recent transactional activity (All Roles).

---

## 🛳️ Deployment Guide

While this backend is designed using SQLite for simplicity during assessment, deploying it to a cloud provider like Render, Heroku, or a VPS (e.g., DigitalOcean, AWS EC2) requires a few considerations regarding the database.

### Option 1: Deploying to a VPS (Recommended for SQLite)

Because SQLite stores data in a local file (`data/finance.db`), deploying to ephemeral services (like Heroku or Render's free tier without a persistent disk) will result in data loss when the instance restarts. A traditional VPS is best.

1. **Provision a Server**: Spin up an Ubuntu server on VPS (DigitalOcean/AWS).
2. **Install Node.js & Git**:
   ```bash
   sudo apt update
   sudo apt install nodejs npm git
   ```
3. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd Project
   ```
4. **Install Dependencies**: `npm install --production`
5. **Set Environment Variables**: Create a `.env` file with a strong `JWT_SECRET` and set `NODE_ENV=production`.
6. **Use PM2 to run the app**:
   ```bash
   sudo npm install -g pm2
   pm2 start src/server.js --name "finance-api"
   pm2 save
   pm2 startup
   ```
7. **Setup Nginx (Reverse Proxy)**: Configure Nginx to route port 80/443 traffic to `localhost:3000`.

### Option 2: Transitioning to PostgreSQL/MySQL (For Ephemeral Hosts like Render/Heroku)

If you wish to deploy to a platform that uses ephemeral file systems:
1. Swap `better-sqlite3` with `pg` (PostgreSQL) or `mysql2`.
2. Update the `Database Configuration` (`src/config/database.js`) to connect to the cloud database URI.
3. Replace the raw SQLite queries in `src/models/*.js` with standard SQL compatible with your chosen engine (or implement an ORM like Sequelize/Prisma if desired).

---

## 🧠 Design Philosophy & Assumptions

1. **Architecture Model**: The app follows a clear Controller-Service-Model setup. 
   - *Routes* act as Controllers handling HTTP logic and validation.
   - *Services* handle business logic and formatting.
   - *Models* handle direct SQLite database access.
2. **Soft Deletes**: Financial records are never truly `DELETE`d. A generic `is_deleted` flag is flipped off to maintain audit integrity.
3. **Prepared Statements**: Used extensively within the SQLite models to prevent SQL Injection naturally.
4. **Lean Dependencies**: Minimizing the bulk by avoiding heavy ORMs, opting instead for crafted SQL queries which show genuine backend data fetching understanding.
