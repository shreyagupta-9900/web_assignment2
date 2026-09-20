# 🔬 LabScope — Institutional Lab Equipment & Asset Issue-Return Tracking System

A beginner-friendly, full-stack **MVC Web Application** built with **Node.js, Express.js, MongoDB (Mongoose ODM), and EJS templating** for institutional asset management, laboratory equipment tracking, role-based workflows, and condition auditing.

---

## 🏛️ Domain & Problem Statement

In academic and research institutions, costly laboratory equipment and shared assets (oscilloscopes, spectrophotometers, laser benches, GPU developer kits, 3D printers, balances) are regularly checked out by students and researchers. Without centralized tracking:
- Equipment is frequently misplaced or lost.
- Items past their due date go unnoticed without automated overdue alerts.
- Stock conflicts occur when units are over-requested beyond available inventory.
- Condition issues (damaged / lost units) are not recorded on return.

**LabScope** solves this with a role-based workflow (Requester, Lab In-Charge, System Admin), live inventory stock checks, return condition auditing (`OK`, `Damaged`, `Lost`), real-time overdue alerts, and an analytics dashboard.

---

## 🎓 Beginner's Guide: Understanding the MVC Architecture

This project is organized using the **Model-View-Controller (MVC)** architectural pattern:

```
                  ┌────────────────────────┐
                  │ 1. Client (Browser)    │
                  └───────────┬────────────┘
                              │ HTTP Request (e.g. GET /assets)
                              ▼
                  ┌────────────────────────┐
                  │ 2. Express Server      │ (server.js)
                  └───────────┬────────────┘
                              │ Routes & Middlewares
                              ▼
                  ┌────────────────────────┐
                  │ 3. Controllers         │ (controllers/assetController.js)
                  └───┬────────────────┬───┘
                      │ Queries DB     │ Passes Data
                      ▼                ▼
     ┌───────────────────────┐   ┌───────────────────────┐
     │ 4. Models (Mongoose)  │   │ 5. Views (EJS)        │
     │ (models/Asset.js)     │   │ (views/assets/index)  │
     └───────────────────────┘   └───────────┬───────────┘
                                             │ Renders HTML
                                             ▼
                                 ┌───────────────────────┐
                                 │ Client sees Webpage   │
                                 └───────────────────────┘
```

1. **`server.js`**: The main entry point. Sets up Express, connects to MongoDB, configures session cookies, and attaches routes.
2. **`models/` (Data Blueprint)**: Defines what our data looks like in MongoDB (e.g. `User`, `Asset`, `IssueRequest`).
3. **`views/` (User Interface)**: HTML templates powered by **EJS** (Embedded JavaScript) that dynamically display data using `<%= %>` tags.
4. **`controllers/` (Business Logic)**: Functions that handle what happens when a user clicks a button, submits a form, or views a page.
5. **`routes/` (URL Mappers)**: Maps URLs (like `/login` or `/assets/new`) to controller functions.
6. **`middleware/` (Security Guards)**: Intercepts requests to ensure the user is logged in (`requireAuth`) and has the required permissions (`requireRole`).

---

## 👥 Role-Based Access Control (RBAC)

| Role | Access Permissions & Key Capabilities |
|---|---|
| **Admin** | Full Asset CRUD (create, edit, delete equipment), manage tag codes, locations, categories, total units, and system-wide analytics. |
| **Lab In-Charge** | Review pending issue requests, approve/reject requisitions, dispatch physical equipment, record returns with condition audit (`OK`, `Damaged`, `Lost`), and track overdue gear. |
| **Requester (Student / Staff)** | Browse active catalog, inspect technical specifications, check real-time stock availability, raise issue requests with expected return date, and monitor requisition statuses. |

---

## 🔑 1-Click Instant Demo Credentials

The application auto-seeds demo user accounts and sample lab assets upon first launch:

| Role | Demo Email | Password | 1-Click Demo Shortcut |
|---|---|---|---|
| **System Admin** | `admin@lab.edu` | `admin123` | Click **"Admin"** on Login / Landing Page |
| **Lab In-Charge** | `incharge@lab.edu` | `incharge123` | Click **"In-Charge"** on Login / Landing Page |
| **Student / Staff** | `student@lab.edu` | `student123` | Click **"Student"** on Login / Landing Page |

---

## ✨ Core Features & Lifecycle Workflow

1. **Role-Based Authentication & Session Management**:
   - Secure BCrypt password hashing & session management via `express-session`.
   - RBAC route protection middleware (`requireAuth`, `requireRole`).
2. **Admin Asset Inventory Management (CRUD)**:
   - Asset Tag, Name, Category, Lab/Room Location, Condition (`Good`, `Fair`, `Needs Maintenance`, `Damaged`), and Total Stock.
   - Prevents total quantity from being reduced below currently issued units.
   - Prevents deletion of assets that are currently checked out.
3. **Equipment Requisition Lifecycle**:
   - **Step 1: Requisition**: Requester selects equipment, specifies quantity, purpose, and future return date.
   - **Step 2: Review**: Lab In-Charge approves or rejects with remarks.
   - **Step 3: Dispatch (Issue)**: Equipment is physically handed over; `availableQuantity` is automatically decremented. Cannot issue if stock is insufficient.
   - **Step 4: Return & Condition Audit**: In-Charge records return condition:
     - `OK`: Restores available stock units.
     - `Damaged`: Marks asset condition as `Damaged` and returns to stock for maintenance.
     - `Lost`: Deducts from total institutional inventory.
4. **Overdue Tracking & Automated Alerting**:
   - Dynamic detection of issued items past their expected return date.
   - High-visibility overdue alert banner on dashboard and quick filter for overdue requisitions.
5. **Interactive Analytics Dashboard**:
   - Real-time KPI cards (Total Units, Available Units, Issued Out, Overdue, Damaged/Lost).
   - Chart.js visual breakdown by laboratory discipline & category.
   - Chart.js doughnut chart for equipment status distribution.
6. **UI & Theme Support**:
   - Responsive, glassmorphic UI built with pure CSS.
   - Persistent Dark / Light theme toggle with `localStorage`.

---

## 📁 Project Structure

```
WebAssignment/
├── server.js                      # Express entry point & middleware pipeline
├── package.json                   # Project metadata & npm dependencies
├── test_suite.js                  # Automated end-to-end integration test suite
├── .env.example                   # Environment configuration template
├── .env                           # Local environment variables
│
├── config/
│   └── db.js                      # MongoDB connection via Mongoose & auto-seed trigger
│
├── models/
│   ├── User.js                    # User schema with RBAC roles & bcrypt password hashing
│   ├── Asset.js                   # Lab equipment schema with virtual stock calculations
│   └── IssueRequest.js            # Request schema with status lifecycle & overdue virtuals
│
├── controllers/
│   ├── authController.js          # Authentication, registration & 1-click demo logins
│   ├── assetController.js         # Asset catalog search, details & Admin CRUD
│   ├── requestController.js       # Requisitions, approvals, dispatch & condition auditing
│   └── dashboardController.js     # KPI metrics & serialized Chart.js analytics
│
├── routes/
│   ├── authRoutes.js              # Auth & landing routes (/, /login, /register, /logout)
│   ├── assetRoutes.js             # Catalog & Admin CRUD routes (/assets, /assets/new, etc.)
│   ├── requestRoutes.js           # Requisition lifecycle routes (/requests, /requests/new, etc.)
│   └── dashboardRoutes.js         # Dashboard analytics route (/dashboard)
│
├── middleware/
│   ├── auth.js                    # requireAuth, requireRole & attachUser RBAC middleware
│   └── errorHandler.js            # Centralized 404 & 500 error handlers
│
├── services/
│   └── seedService.js             # Initial database auto-seed dataset
│
├── public/
│   ├── css/
│   │   ├── style.css              # Main glassmorphic styles, responsive grid & typography
│   │   ├── palette.css            # Dark/light theme design tokens & status pills
│   │   └── animations.css         # Transitions, glow pulse & hover effects
│   ├── js/
│   │   ├── main.js                # Frontend entry point & modal event handlers
│   │   ├── dashboardCharts.js     # Chart.js category & status visualizers
│   │   └── theme.js               # Dark/light mode switcher with localStorage persistence
│   └── icons/
│       └── favicon.svg            # Vector microchip/equipment icon
│
└── views/
    ├── partials/
    │   ├── head.ejs               # Meta tags, fonts, stylesheets & Chart.js CDN
    │   ├── navbar.ejs             # Dynamic role-based navigation bar & user avatar
    │   ├── alerts.ejs             # Success / error notification alerts
    │   └── footer.ejs             # App footer
    └── pages/
        ├── landing.ejs            # Public landing page with 1-click demo access
        ├── login.ejs              # Sign in page
        ├── register.ejs           # User registration page
        ├── dashboard.ejs          # Analytics dashboard, KPIs & Chart.js widgets
        ├── error.ejs              # 404 & 500 error view
        ├── assets/
        │   ├── index.ejs          # Equipment catalog with search & multi-filter
        │   ├── show.ejs           # Asset specifications & historical borrowing logs
        │   └── form.ejs           # Admin Create/Edit equipment form
        └── requests/
            ├── index.ejs          # Lab In-Charge queue with approval & return modal
            ├── myRequests.ejs     # Student/Staff personal borrowing history
            └── new.ejs            # Raise equipment issue request form
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Ensure your `.env` file contains:
```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=lab_asset_tracking_super_secret_session_key_2026
MONGODB_URI=mongodb://127.0.0.1:27017/lab_asset_management
```

### 3. Start the Server
```bash
# Production mode
npm start

# Development mode (auto-restarts on change)
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

### 4. Run Automated Tests
```bash
npm test
```
