/**
 * ============================================================================
 * 📊 DASHBOARD CONTROLLER (controllers/dashboardController.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS CONTROLLER DO?
 * Aggregates institutional laboratory analytics, calculates Key Performance
 * Indicators (KPIs), detects overdue equipment returns, and serializes
 * dataset arrays for interactive Chart.js graphs on the dashboard.
 * 
 * 📈 DASHBOARD KPIS COMPUTED:
 * 1. Total Asset Units (all physical items across categories)
 * 2. Total Available Units (ready to borrow in labs)
 * 3. Currently Issued Out Units (checked out by students/researchers)
 * 4. Overdue Returns Count (items past return date)
 * 5. Damaged / Lost Items Count
 * ============================================================================
 */

import Asset from "../models/Asset.js";
import IssueRequest from "../models/IssueRequest.js";

/**
 * 📊 Render Analytics Dashboard (GET /dashboard)
 */
export async function getDashboard(req, res, next) {
  try {
    const now = new Date();

    // ------------------------------------------------------------------------
    // STEP 1: Fetch All Equipment & Compute Stock KPIs
    // ------------------------------------------------------------------------
    const assets = await Asset.find().lean();
    const totalAssetTypes = assets.length;
    let totalInventoryUnits = 0;
    let totalAvailableUnits = 0;

    // Track unit counts per category for the bar chart
    const categoryCounts = {};

    assets.forEach((a) => {
      totalInventoryUnits += a.totalQuantity || 0;
      totalAvailableUnits += a.availableQuantity || 0;

      const cat = a.category || "Other";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + (a.totalQuantity || 0);
    });

    const totalIssuedUnits = Math.max(0, totalInventoryUnits - totalAvailableUnits);

    // ------------------------------------------------------------------------
    // STEP 2: Fetch Requisitions & Detect Overdue Returns
    // ------------------------------------------------------------------------
    const allRequests = await IssueRequest.find()
      .populate("requester", "name email department idNumber role")
      .populate("asset", "name assetTag category labLocation condition")
      .sort({ createdAt: -1 })
      .lean();

    let pendingRequestsCount = 0;
    let issuedActiveCount = 0;
    let returnedCount = 0;
    let overdueCount = 0;
    let damagedLostCount = 0;

    const overdueList = [];

    allRequests.forEach((reqItem) => {
      if (reqItem.status === "Pending") pendingRequestsCount++;
      if (reqItem.status === "Issued") {
        issuedActiveCount++;
        // Check if current date has passed expected return date
        if (reqItem.expectedReturnDate && new Date(reqItem.expectedReturnDate) < now) {
          overdueCount++;
          overdueList.push(reqItem);
        }
      }
      if (reqItem.status === "Returned") {
        returnedCount++;
        if (reqItem.returnCondition === "Damaged" || reqItem.returnCondition === "Lost") {
          damagedLostCount++;
        }
      }
    });

    // ------------------------------------------------------------------------
    // STEP 3: Filter Recent Activity by User Role
    // ------------------------------------------------------------------------
    // If logged in as Student, only show their own recent borrowing requests.
    // If In-Charge or Admin, show institution-wide recent requests.
    let userSpecificRequests = [];
    if (req.session.user.role === "requester") {
      userSpecificRequests = allRequests.filter(
        (r) => r.requester && r.requester._id.toString() === req.session.user.id
      );
    }

    const recentActivities = (
      req.session.user.role === "requester" ? userSpecificRequests : allRequests
    ).slice(0, 8);

    // ------------------------------------------------------------------------
    // STEP 4: Format Data Arrays for Chart.js
    // ------------------------------------------------------------------------
    const chartCategoryLabels = Object.keys(categoryCounts);
    const chartCategoryValues = Object.values(categoryCounts);

    const chartStatusData = {
      labels: ["Available in Labs", "Currently Issued", "Damaged / Lost", "In Maintenance"],
      values: [
        totalAvailableUnits,
        totalIssuedUnits,
        damagedLostCount,
        assets.filter((a) => a.condition === "Needs Maintenance").length,
      ],
    };

    // ------------------------------------------------------------------------
    // STEP 5: Render Dashboard EJS View
    // ------------------------------------------------------------------------
    res.render("pages/dashboard", {
      title: "Dashboard & Analytics — Lab Asset Tracking System",
      kpis: {
        totalAssetTypes,
        totalInventoryUnits,
        totalIssuedUnits,
        totalAvailableUnits,
        overdueCount,
        pendingRequestsCount,
        damagedLostCount,
        returnedCount,
      },
      overdueList,
      recentActivities,
      chartCategory: {
        labels: chartCategoryLabels,
        values: chartCategoryValues,
      },
      chartStatus: chartStatusData,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    next(err);
  }
}
