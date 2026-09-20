/**
 * ============================================================================
 * 📊 DASHBOARD ROUTES (routes/dashboardRoutes.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS ROUTE FILE DO?
 * Directs authenticated users to the main analytics dashboard.
 * ============================================================================
 */

import express from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Main Analytics & Status Dashboard (Requires login)
router.get("/dashboard", requireAuth, getDashboard);

export default router;
