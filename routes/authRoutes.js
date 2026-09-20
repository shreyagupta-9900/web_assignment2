/**
 * ============================================================================
 * 🚪 AUTHENTICATION ROUTES (routes/authRoutes.js)
 * ============================================================================
 * 
 * 💡 WHAT ARE ROUTES?
 * Routes map incoming HTTP request URLs (e.g. GET /login, POST /login)
 * to their corresponding controller functions.
 * ============================================================================
 */

import express from "express";
import {
  getLandingPage,
  getLoginPage,
  getRegisterPage,
  postLogin,
  postRegister,
  demoLogin,
  logout,
} from "../controllers/authController.js";

const router = express.Router();

// Public Landing Page
router.get("/", getLandingPage);

// Sign In Routes
router.get("/login", getLoginPage);
router.post("/login", postLogin);

// Registration Routes
router.get("/register", getRegisterPage);
router.post("/register", postRegister);

// 1-Click Instant Demo Login (e.g. /demo-login/admin, /demo-login/incharge, /demo-login/requester)
router.get("/demo-login/:role", demoLogin);

// Sign Out Route
router.get("/logout", logout);

export default router;
