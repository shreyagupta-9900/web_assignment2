/**
 * ============================================================================
 * 🔬 LABSCOPE — MAIN SERVER ENTRY POINT (server.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS FILE DO?
 * This is the "brain" and entry point of our Node.js + Express application.
 * When you run `npm start` or `npm run dev`, Node executes this file first.
 * 
 * 🛠️ HOW THE MVC ARCHITECTURE FLOWS:
 * 1. Client (Browser) makes an HTTP request (e.g. GET /assets).
 * 2. Express receives the request and passes it through Middlewares (auth, body parsers).
 * 3. Express checks the Routes to see which Controller function should handle it.
 * 4. The Controller interacts with MongoDB via Models, retrieves data, and passes
 *    it to an EJS View template to render HTML back to the browser.
 * ============================================================================
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import session from "express-session";

// 1. Database Connection Helper
import { connectDB } from "./config/db.js";

// 2. Custom Middlewares
import { attachUser } from "./middleware/auth.js";
import { notFoundHandler, globalErrorHandler } from "./middleware/errorHandler.js";

// 3. Application Route Handlers
import authRoutes from "./routes/authRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

// Load environment variables from .env file (PORT, MONGODB_URI, SESSION_SECRET)
dotenv.config();

// In ES Modules (type: "module"), __dirname is not available by default.
// We reconstruct it using fileURLToPath and path.dirname.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express Application
const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------------------------------------------------------------
// STEP 1: Connect to Database
// ----------------------------------------------------------------------------
// Connect to MongoDB via Mongoose. Automatically seeds initial demo accounts
// and lab equipment if the database is currently empty.
connectDB();

// ----------------------------------------------------------------------------
// STEP 2: Configure View Engine (EJS)
// ----------------------------------------------------------------------------
// Tell Express to use Embedded JavaScript (EJS) as our template engine,
// and set the folder where all our .ejs template files live.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ----------------------------------------------------------------------------
// STEP 3: Middleware Pipeline (Parsers, Static Files & Sessions)
// ----------------------------------------------------------------------------
// A) Body Parsers: Allows Express to read data sent from HTML <form> and JSON payloads.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// B) Static File Server: Serves CSS, client-side JS, and images from the 'public' folder.
app.use(express.static(path.join(__dirname, "public")));

// C) Session Management: Keeps users logged in across page visits using cookies.
app.use(
  session({
    secret: process.env.SESSION_SECRET || "lab_asset_tracking_super_secret_session_key_2026",
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // Cookie expires after 7 days (in milliseconds)
      httpOnly: true, // Prevents client-side scripts from reading the cookie (security)
      sameSite: "lax", // Protects against CSRF attacks
    },
  })
);

// D) Global Context Middleware: Automatically injects the logged-in user (`currentUser`)
// and current URL (`currentPath`) into all EJS templates, so we don't have to pass it manually.
app.use(attachUser);

// ----------------------------------------------------------------------------
// STEP 4: Register Application Routes
// ----------------------------------------------------------------------------
// Mount route files to handle different sections of the app:
app.use("/", authRoutes);      // Landing page, Login, Register, Logout, Demo Logins
app.use("/", assetRoutes);     // Equipment Catalog, Details, Admin Asset CRUD
app.use("/", requestRoutes);   // Requisitions, Approvals, Dispatching, Return Condition Auditing
app.use("/", dashboardRoutes); // Analytics Dashboard & KPI Visualizers

// ----------------------------------------------------------------------------
// STEP 5: Centralized Error Handlers
// ----------------------------------------------------------------------------
// If a user navigates to a URL that doesn't exist, this 404 handler triggers:
app.use(notFoundHandler);

// If an unexpected error happens inside any route/controller, this catches it:
app.use(globalErrorHandler);

// ----------------------------------------------------------------------------
// STEP 6: Start HTTP Server
// ----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 LabScope Asset Tracking Server running at: http://localhost:${PORT}`);
});
