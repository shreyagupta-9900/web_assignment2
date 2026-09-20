/**
 * ============================================================================
 * 🔄 REQUISITION & LIFECYCLE ROUTES (routes/requestRoutes.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS ROUTE FILE DO?
 * Connects the 4 stages of the equipment borrowing lifecycle to their handlers:
 * 1. Requesters raise new borrowing requests (/requests/new)
 * 2. Requesters track personal requests (/requests/my)
 * 3. Lab In-Charge reviews & approves/rejects (/requests, /approve, /reject)
 * 4. Lab In-Charge dispatches gear (/issue) & records returns with condition audit (/return)
 * ============================================================================
 */

import express from "express";
import {
  getNewRequestForm,
  postCreateRequest,
  getMyRequests,
  getAllRequests,
  postApproveRequest,
  postRejectRequest,
  postIssueAsset,
  postReturnAsset,
} from "../controllers/requestController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// ----------------------------------------------------------------------------
// REQUESTER ROUTES (Student & Staff)
// ----------------------------------------------------------------------------
// Personal borrowing history & status logs
router.get("/requests/my", requireAuth, getMyRequests);

// Submit new equipment borrowing request
router.get("/requests/new", requireAuth, getNewRequestForm);
router.post("/requests/new", requireAuth, postCreateRequest);

// ----------------------------------------------------------------------------
// MANAGEMENT ROUTES (Lab In-Charge & System Admin)
// ----------------------------------------------------------------------------
// View complete institutional requisition queue
router.get("/requests", requireAuth, requireRole("incharge", "admin"), getAllRequests);

// Approve or Reject pending requisition
router.post("/requests/:id/approve", requireAuth, requireRole("incharge", "admin"), postApproveRequest);
router.post("/requests/:id/reject", requireAuth, requireRole("incharge", "admin"), postRejectRequest);

// Dispatch equipment (Physical issue -> Decrement available stock)
router.post("/requests/:id/issue", requireAuth, requireRole("incharge", "admin"), postIssueAsset);

// Record equipment return & audit condition (OK / Damaged / Lost)
router.post("/requests/:id/return", requireAuth, requireRole("incharge", "admin"), postReturnAsset);

export default router;
