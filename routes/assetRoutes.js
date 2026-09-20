/**
 * ============================================================================
 * 🔬 ASSET & CATALOG ROUTES (routes/assetRoutes.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS ROUTE FILE DO?
 * Defines endpoints for browsing equipment inventory, inspecting technical
 * specs, and Admin CRUD (Create, Read, Update, Delete) management.
 * 
 * 🔒 SECURITY:
 * - All routes require authentication (`requireAuth`).
 * - Modification routes (new, edit, delete) require `requireRole('admin')`.
 * ============================================================================
 */

import express from "express";
import {
  getAssetsList,
  getAssetDetails,
  getNewAssetForm,
  postCreateAsset,
  getEditAssetForm,
  postUpdateAsset,
  postDeleteAsset,
} from "../controllers/assetController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// 1. Equipment Catalog (Browse & Search) - Available to all logged-in users
router.get("/assets", requireAuth, getAssetsList);

// 2. Register New Asset [Admin Only]
router.get("/assets/new", requireAuth, requireRole("admin"), getNewAssetForm);
router.post("/assets/new", requireAuth, requireRole("admin"), postCreateAsset);

// 3. View Asset Specifications & Usage Logs (Available to all logged-in users)
router.get("/assets/:id", requireAuth, getAssetDetails);

// 4. Edit Existing Asset [Admin Only]
router.get("/assets/:id/edit", requireAuth, requireRole("admin"), getEditAssetForm);
router.post("/assets/:id/edit", requireAuth, requireRole("admin"), postUpdateAsset);

// 5. Delete Asset [Admin Only]
router.post("/assets/:id/delete", requireAuth, requireRole("admin"), postDeleteAsset);

export default router;
