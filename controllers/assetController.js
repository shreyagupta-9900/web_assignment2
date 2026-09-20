/**
 * ============================================================================
 * 📦 ASSET CONTROLLER (controllers/assetController.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS CONTROLLER DO?
 * Manages the institutional equipment catalog, multi-criteria search filtering,
 * viewing equipment specifications and historical usage logs, plus Admin CRUD
 * (Create, Read, Update, Delete) operations.
 * 
 * 🛡️ INVENTORY INTEGRITY RULES:
 * - Admin cannot lower `totalQuantity` below the number of units currently issued out.
 * - Admin cannot delete equipment that is currently checked out by students/staff.
 * ============================================================================
 */

import Asset from "../models/Asset.js";
import IssueRequest from "../models/IssueRequest.js";

/**
 * 🔍 List all equipment with live search and category filtering (GET /assets)
 * 
 * Step-by-Step Flow:
 * 1. Read filter query params from URL (search keyword, category, condition, availableOnly).
 * 2. Construct dynamic MongoDB query object.
 * 3. Fetch matching assets sorted alphabetically by name.
 * 4. Render `pages/assets/index.ejs` with the results.
 */
export async function getAssetsList(req, res, next) {
  try {
    const { search, category, condition, availableOnly } = req.query;

    // Step 1: Build MongoDB query object
    const query = {};

    // A) Keyword Search (Matches Name, Asset Tag, or Lab Location case-insensitively)
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { assetTag: { $regex: search.trim(), $options: "i" } },
        { labLocation: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // B) Category Filter
    if (category && category !== "All") {
      query.category = category;
    }

    // C) Condition Filter
    if (condition && condition !== "All") {
      query.condition = condition;
    }

    // D) Available Stock Only Filter
    if (availableOnly === "true") {
      query.availableQuantity = { $gt: 0 };
    }

    // Step 2: Query database
    const assets = await Asset.find(query).sort({ name: 1 }).lean();
    const allCategories = await Asset.distinct("category");

    // Step 3: Render catalog page
    res.render("pages/assets/index", {
      title: "Equipment & Asset Inventory — Lab Asset Tracking",
      assets,
      categories: allCategories,
      selectedCategory: category || "All",
      selectedCondition: condition || "All",
      searchQuery: search || "",
      availableOnly: availableOnly === "true",
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 🔬 View single equipment details and historical borrowing logs (GET /assets/:id)
 */
export async function getAssetDetails(req, res, next) {
  try {
    const { id } = req.params;

    // Step 1: Fetch asset by ID
    const asset = await Asset.findById(id).lean();

    if (!asset) {
      return res.status(404).render("pages/error", {
        title: "Asset Not Found",
        statusCode: 404,
        message: "The requested equipment or asset could not be found in the database.",
      });
    }

    // Step 2: Fetch past and current borrowing records for this specific equipment
    const history = await IssueRequest.find({ asset: id })
      .populate("requester", "name email department idNumber")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Step 3: Render details page
    res.render("pages/assets/show", {
      title: `${asset.name} (${asset.assetTag}) — Asset Details`,
      asset,
      history,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * ➕ Render Create Asset Form [Admin Only] (GET /assets/new)
 */
export function getNewAssetForm(req, res) {
  res.render("pages/assets/form", {
    title: "Register New Equipment / Asset — Admin Portal",
    asset: null,
    isEdit: false,
    error: req.query.error || null,
  });
}

/**
 * 💾 Create new equipment asset in database [Admin Only] (POST /assets/new)
 */
export async function postCreateAsset(req, res) {
  const { assetTag, name, category, labLocation, condition, totalQuantity, specifications } = req.body;

  // Step 1: Check required fields
  if (!assetTag || !name || !category || !totalQuantity) {
    return res.redirect("/assets/new?error=Please+fill+in+all+required+fields");
  }

  try {
    // Step 2: Ensure unique asset tag
    const existing = await Asset.findOne({ assetTag: assetTag.trim().toUpperCase() });
    if (existing) {
      return res.redirect("/assets/new?error=Asset+Tag+code+already+exists.+Please+use+a+unique+tag.");
    }

    const totalQty = parseInt(totalQuantity, 10) || 1;

    // Step 3: Insert new asset record
    await Asset.create({
      assetTag: assetTag.trim().toUpperCase(),
      name: name.trim(),
      category,
      labLocation: labLocation ? labLocation.trim() : "Main Lab",
      condition: condition || "Good",
      totalQuantity: totalQty,
      availableQuantity: totalQty, // Initially, all units are available in lab
      specifications: specifications ? specifications.trim() : "",
    });

    res.redirect("/assets?success=New+equipment+asset+registered+successfully");
  } catch (err) {
    res.redirect(`/assets/new?error=${encodeURIComponent(err.message)}`);
  }
}

/**
 * ✏️ Render Edit Asset Form [Admin Only] (GET /assets/:id/edit)
 */
export async function getEditAssetForm(req, res, next) {
  try {
    const { id } = req.params;
    const asset = await Asset.findById(id).lean();

    if (!asset) {
      return res.status(404).render("pages/error", {
        title: "Asset Not Found",
        statusCode: 404,
        message: "Asset not found",
      });
    }

    res.render("pages/assets/form", {
      title: `Edit ${asset.name} (${asset.assetTag})`,
      asset,
      isEdit: true,
      error: req.query.error || null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 🔄 Update an existing asset [Admin Only] (POST /assets/:id/edit)
 */
export async function postUpdateAsset(req, res) {
  const { id } = req.params;
  const { name, category, labLocation, condition, totalQuantity, specifications, status } = req.body;

  try {
    const asset = await Asset.findById(id);
    if (!asset) {
      return res.redirect("/assets?error=Asset+not+found");
    }

    const newTotal = parseInt(totalQuantity, 10);
    const currentlyIssued = asset.totalQuantity - asset.availableQuantity;

    // Integrity Guard: Cannot reduce total inventory below currently checked out units
    if (newTotal < currentlyIssued) {
      return res.redirect(
        `/assets/${id}/edit?error=Total+quantity+cannot+be+less+than+currently+issued+units+(${currentlyIssued}+units+issued)`
      );
    }

    // Adjust available quantity by the difference in total stock
    const difference = newTotal - asset.totalQuantity;
    asset.totalQuantity = newTotal;
    asset.availableQuantity = Math.max(0, asset.availableQuantity + difference);

    asset.name = name.trim();
    asset.category = category;
    asset.labLocation = labLocation.trim();
    asset.condition = condition;
    asset.specifications = specifications.trim();
    if (status) asset.status = status;

    await asset.save();

    res.redirect(`/assets/${id}?success=Asset+details+updated+successfully`);
  } catch (err) {
    res.redirect(`/assets/${id}/edit?error=${encodeURIComponent(err.message)}`);
  }
}

/**
 * 🗑️ Delete an asset from inventory [Admin Only] (POST /assets/:id/delete)
 */
export async function postDeleteAsset(req, res) {
  const { id } = req.params;

  try {
    const asset = await Asset.findById(id);
    if (!asset) {
      return res.redirect("/assets?error=Asset+not+found");
    }

    // Integrity Guard: Cannot delete asset if units are currently checked out
    const currentlyIssued = asset.totalQuantity - asset.availableQuantity;
    if (currentlyIssued > 0) {
      return res.redirect(
        `/assets?error=Cannot+delete+asset.+${currentlyIssued}+unit(s)+are+currently+issued+out+to+staff/students.`
      );
    }

    await Asset.findByIdAndDelete(id);
    res.redirect("/assets?success=Asset+deleted+from+inventory");
  } catch (err) {
    res.redirect(`/assets?error=${encodeURIComponent(err.message)}`);
  }
}
