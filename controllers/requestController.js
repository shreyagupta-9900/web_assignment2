/**
 * ============================================================================
 * 🔄 REQUEST CONTROLLER (controllers/requestController.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS CONTROLLER DO?
 * Manages the entire 4-stage Requisition Lifecycle for laboratory equipment:
 * 
 * ┌────────────┐   1. Raise Request    ┌──────────────┐   2. Review (Approve/Reject)
 * │ Requester  │ ────────────────────> │ Lab InCharge │ ───────────────────────────┐
 * └────────────┘                       └──────────────┘                            │
 *                                                                                  ▼
 * ┌────────────────────────────────────────────────────────┐  3. Physical Issue  ┌───────────┐
 * │ 4. Return & Condition Audit (OK / Damaged / Lost)      │ <────────────────── │ Dispatch  │
 * └────────────────────────────────────────────────────────┘                     └───────────┘
 * 
 * 🛡️ INVENTORY & SAFETY CHECKS:
 * 1. Cannot request more units than currently available in lab stock.
 * 2. Return date must be in the future.
 * 3. Cannot dispatch (Issue) if stock is exhausted.
 * 4. Return audit handles condition:
 *    - 'OK'      : Restores available stock.
 *    - 'Damaged' : Sets condition to Damaged & restores for maintenance.
 *    - 'Lost'    : Deducts from total institutional inventory.
 * ============================================================================
 */

import IssueRequest from "../models/IssueRequest.js";
import Asset from "../models/Asset.js";

/**
 * 📝 STEP 1A: Render Borrow Request Form [Requester] (GET /requests/new)
 */
export async function getNewRequestForm(req, res, next) {
  try {
    const { assetId } = req.query;
    let selectedAsset = null;

    // If user clicked "Borrow" directly on an asset card in catalog, pre-select it
    if (assetId) {
      selectedAsset = await Asset.findById(assetId).lean();
    }

    // List all active assets that currently have at least 1 unit available
    const availableAssets = await Asset.find({
      availableQuantity: { $gt: 0 },
      status: "Active",
    })
      .sort({ name: 1 })
      .lean();

    res.render("pages/requests/new", {
      title: "Raise Equipment Issue Request — Lab Asset Tracking",
      availableAssets,
      selectedAsset,
      error: req.query.error || null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 🚀 STEP 1B: Submit Issue Request [Requester] (POST /requests/new)
 * 
 * Step-by-Step Flow:
 * 1. Read assetId, quantity, purpose, expectedReturnDate from form body.
 * 2. Validate that the requested quantity <= asset availableQuantity.
 * 3. Validate that expectedReturnDate is in the future.
 * 4. Create IssueRequest record with status 'Pending'.
 */
export async function postCreateRequest(req, res) {
  const { assetId, quantity, purpose, expectedReturnDate } = req.body;

  // Step 1: Check presence of required form inputs
  if (!assetId || !purpose || !expectedReturnDate) {
    return res.redirect("/requests/new?error=Please+complete+all+required+fields");
  }

  try {
    // Step 2: Fetch target asset from database
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.redirect("/requests/new?error=Selected+asset+not+found");
    }

    const reqQty = parseInt(quantity, 10) || 1;

    // Step 3: Prevent requesting more units than currently available in lab
    if (reqQty > asset.availableQuantity) {
      return res.redirect(
        `/requests/new?assetId=${assetId}&error=Cannot+request+${reqQty}+unit(s).+Only+${asset.availableQuantity}+unit(s)+currently+available+in+lab.`
      );
    }

    // Step 4: Ensure return date is a valid future date
    const returnDate = new Date(expectedReturnDate);
    if (returnDate <= new Date()) {
      return res.redirect(
        `/requests/new?assetId=${assetId}&error=Expected+return+date+must+be+a+future+date`
      );
    }

    // Step 5: Save request with status 'Pending'
    await IssueRequest.create({
      requester: req.session.user.id,
      asset: asset._id,
      quantity: reqQty,
      purpose: purpose.trim(),
      expectedReturnDate: returnDate,
      status: "Pending",
    });

    res.redirect("/requests/my?success=Issue+request+submitted+successfully.+Awaiting+Lab+In-Charge+approval.");
  } catch (err) {
    res.redirect(`/requests/new?error=${encodeURIComponent(err.message)}`);
  }
}

/**
 * 📜 View Personal Requests & Borrowed Gear [Requester] (GET /requests/my)
 */
export async function getMyRequests(req, res, next) {
  try {
    // Fetch only requests belonging to the currently logged-in user
    const requests = await IssueRequest.find({ requester: req.session.user.id })
      .populate("asset")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.render("pages/requests/myRequests", {
      title: "My Issue Requests & Borrowed Equipment",
      requests,
      now: new Date(),
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 📋 STEP 2A: View Requisition Queue [In-Charge & Admin] (GET /requests)
 */
export async function getAllRequests(req, res, next) {
  try {
    const { status } = req.query;
    const query = {};

    // Filter by status tab if selected
    if (status && status !== "All") {
      if (status === "Overdue") {
        query.status = "Issued";
        query.expectedReturnDate = { $lt: new Date() };
      } else {
        query.status = status;
      }
    }

    // Retrieve all requests with requester and asset details populated
    const requests = await IssueRequest.find(query)
      .populate("requester", "name email department idNumber role")
      .populate("asset", "name assetTag category labLocation condition totalQuantity availableQuantity")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.render("pages/requests/index", {
      title: "Equipment Issue & Return Management — Lab In-Charge",
      requests,
      selectedStatus: status || "All",
      now: new Date(),
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * ✅ STEP 2B: Approve Pending Request [In-Charge & Admin] (POST /requests/:id/approve)
 */
export async function postApproveRequest(req, res) {
  const { id } = req.params;
  const { remarks } = req.body;

  try {
    const request = await IssueRequest.findById(id).populate("asset");
    if (!request || request.status !== "Pending") {
      return res.redirect("/requests?error=Request+cannot+be+approved+in+its+current+state");
    }

    // Transition status to 'Approved'
    request.status = "Approved";
    request.approvedBy = req.session.user.id;
    if (remarks) request.inchargeRemarks = remarks.trim();

    await request.save();

    res.redirect("/requests?success=Request+approved.+Ready+for+physical+issue/dispatch.");
  } catch (err) {
    res.redirect(`/requests?error=${encodeURIComponent(err.message)}`);
  }
}

/**
 * ❌ STEP 2C: Reject Pending Request [In-Charge & Admin] (POST /requests/:id/reject)
 */
export async function postRejectRequest(req, res) {
  const { id } = req.params;
  const { remarks } = req.body;

  try {
    const request = await IssueRequest.findById(id);
    if (!request || request.status !== "Pending") {
      return res.redirect("/requests?error=Request+cannot+be+rejected");
    }

    // Transition status to 'Rejected'
    request.status = "Rejected";
    request.approvedBy = req.session.user.id;
    request.inchargeRemarks = remarks ? remarks.trim() : "Rejected by Lab In-Charge";

    await request.save();

    res.redirect("/requests?success=Request+rejected");
  } catch (err) {
    res.redirect(`/requests?error=${encodeURIComponent(err.message)}`);
  }
}

/**
 * 📦 STEP 3: Dispatch Physical Equipment (Issue Gear) [In-Charge & Admin] (POST /requests/:id/issue)
 * 
 * Step-by-Step Flow:
 * 1. Find request and target asset.
 * 2. Verify stock availability: asset.availableQuantity >= request.quantity.
 * 3. Decrement asset.availableQuantity in database.
 * 4. Update request status to 'Issued' and record `issuedAt` timestamp.
 */
export async function postIssueAsset(req, res) {
  const { id } = req.params;
  const { remarks } = req.body;

  try {
    const request = await IssueRequest.findById(id).populate("asset");
    if (!request || !["Approved", "Pending"].includes(request.status)) {
      return res.redirect("/requests?error=Invalid+request+state+for+issuing+equipment");
    }

    const asset = await Asset.findById(request.asset._id);
    if (!asset) {
      return res.redirect("/requests?error=Asset+not+found");
    }

    // Verify stock is still available at moment of dispatch
    if (asset.availableQuantity < request.quantity) {
      return res.redirect(
        `/requests?error=Cannot+issue+asset.+Insufficient+units+available+(${asset.availableQuantity}+available,+${request.quantity}+required)`
      );
    }

    // Decrement available stock
    asset.availableQuantity -= request.quantity;
    await asset.save();

    // Mark as Issued
    request.status = "Issued";
    request.issuedAt = new Date();
    request.approvedBy = req.session.user.id;
    if (remarks) request.inchargeRemarks = remarks.trim();

    await request.save();

    res.redirect("/requests?success=Equipment+recorded+as+ISSUED.+Stock+updated.");
  } catch (err) {
    res.redirect(`/requests?error=${encodeURIComponent(err.message)}`);
  }
}

/**
 * 🔍 STEP 4: Record Return with Condition Audit (OK / Damaged / Lost) [In-Charge & Admin] (POST /requests/:id/return)
 * 
 * Step-by-Step Flow:
 * 1. Find the issued request and its asset.
 * 2. Audit condition:
 *    - 'OK'      : Restores available stock units.
 *    - 'Damaged' : Marks asset as Damaged and returns to stock for maintenance repair.
 *    - 'Lost'    : Deducts units from total inventory so institutional numbers stay accurate.
 * 3. Update request status to 'Returned' and save condition notes.
 */
export async function postReturnAsset(req, res) {
  const { id } = req.params;
  const { returnCondition, returnNotes } = req.body;

  try {
    const request = await IssueRequest.findById(id).populate("asset");
    if (!request || request.status !== "Issued") {
      return res.redirect("/requests?error=Only+currently+ISSUED+equipment+can+be+returned");
    }

    const asset = await Asset.findById(request.asset._id);
    if (!asset) {
      return res.redirect("/requests?error=Asset+record+not+found");
    }

    const condition = returnCondition || "OK";

    // Replenish stock or adjust inventory according to audit condition
    if (condition === "OK") {
      asset.availableQuantity = Math.min(asset.totalQuantity, asset.availableQuantity + request.quantity);
    } else if (condition === "Damaged") {
      asset.condition = "Damaged";
      asset.availableQuantity = Math.min(asset.totalQuantity, asset.availableQuantity + request.quantity);
    } else if (condition === "Lost") {
      // Equipment lost: decrement totalQuantity
      asset.totalQuantity = Math.max(0, asset.totalQuantity - request.quantity);
    }

    await asset.save();

    // Mark request as Returned
    request.status = "Returned";
    request.returnedAt = new Date();
    request.returnCondition = condition;
    if (returnNotes) {
      request.inchargeRemarks = request.inchargeRemarks
        ? `${request.inchargeRemarks} | Return Note: ${returnNotes.trim()}`
        : `Return Note: ${returnNotes.trim()}`;
    }

    await request.save();

    res.redirect(
      `/requests?success=Equipment+return+logged+successfully+with+condition:+${condition}`
    );
  } catch (err) {
    res.redirect(`/requests?error=${encodeURIComponent(err.message)}`);
  }
}
