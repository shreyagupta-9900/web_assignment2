/**
 * ============================================================================
 * 🔬 ASSET MODEL (models/Asset.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS MODEL DO?
 * Defines the MongoDB schema for institutional laboratory equipment and shared assets.
 * 
 * 📦 INVENTORY TRACKING:
 * - `totalQuantity`: The total number of units physically owned by the institution.
 * - `availableQuantity`: The units currently sitting in the lab room ready for checkout.
 * - `issuedQuantity` (Virtual): Automatically calculated as (totalQuantity - availableQuantity).
 * 
 * 🏷️ ASSET TAGS:
 * Unique alphanumeric codes (e.g. `LAB-OSC-101`) affixed to physical equipment for barcode/tracking.
 * ============================================================================
 */

import mongoose from "mongoose";

// Define the blueprint for laboratory equipment assets
const assetSchema = new mongoose.Schema(
  {
    // Unique identifier tag code for the equipment (e.g. "LAB-OSC-101")
    assetTag: {
      type: String,
      required: [true, "Asset Tag is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    // Descriptive name of the equipment (e.g. "Rigol DS1054Z 4-Channel Oscilloscope")
    name: {
      type: String,
      required: [true, "Asset Name is required"],
      trim: true,
    },

    // Scientific category / laboratory discipline
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Electronics & Embedded",
        "Optics & Lasers",
        "Robotics & Computing",
        "Biotechnology & Life Sciences",
        "Chemistry & Materials",
        "Mechanical & Tools",
        "General Instruments",
      ],
      default: "Electronics & Embedded",
    },

    // Location / Room number where the item is physically stored
    labLocation: {
      type: String,
      required: [true, "Lab Location is required"],
      trim: true,
      default: "Main Research Lab",
    },

    // Physical working condition of the equipment
    condition: {
      type: String,
      enum: ["Good", "Fair", "Needs Maintenance", "Damaged"],
      default: "Good",
    },

    // Total quantity of units owned in institutional inventory
    totalQuantity: {
      type: Number,
      required: [true, "Total quantity is required"],
      min: [1, "Total quantity must be at least 1"],
      default: 1,
    },

    // Number of units currently available in the lab for immediate borrowing
    availableQuantity: {
      type: Number,
      required: true,
      min: [0, "Available quantity cannot be negative"],
      default: 1,
    },

    // Technical specifications, model numbers, probe accessories included
    specifications: {
      type: String,
      trim: true,
      default: "",
    },

    // Operational status of this asset model in the system
    status: {
      type: String,
      enum: ["Active", "Under Maintenance", "Decommissioned"],
      default: "Active",
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` date fields
    timestamps: true,
  }
);

/**
 * 🧮 MONGOOSE VIRTUAL: Calculate Currently Issued Units
 * Virtuals are computed on the fly and not saved redundantly in the database.
 * issuedQuantity = totalQuantity - availableQuantity
 */
assetSchema.virtual("issuedQuantity").get(function () {
  return Math.max(0, this.totalQuantity - this.availableQuantity);
});

// Ensure virtual properties are included when converting Mongoose documents to JSON or Objects
assetSchema.set("toJSON", { virtuals: true });
assetSchema.set("toObject", { virtuals: true });

// Create the Mongoose Model from the schema
const Asset = mongoose.model("Asset", assetSchema);
export default Asset;
