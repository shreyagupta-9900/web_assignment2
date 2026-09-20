/**
 * ============================================================================
 * 📋 ISSUE REQUEST MODEL (models/IssueRequest.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS MODEL DO?
 * Tracks the complete lifecycle of equipment borrowing requisitions:
 * 
 * 🔄 LIFECYCLE PHASES:
 * 1. "Pending"   : Requester created the request; awaiting Lab In-Charge review.
 * 2. "Approved"  : Lab In-Charge approved the request; ready for physical equipment handover.
 * 3. "Issued"    : Physical equipment dispatched; available inventory stock decremented by requested qty.
 * 4. "Returned"  : Physical equipment handed back; condition audited (OK, Damaged, Lost).
 * 5. "Rejected"  : Lab In-Charge rejected the requisition with explanation remarks.
 * 
 * ⏰ OVERDUE DETECTION (Virtual):
 * An item is automatically flagged as overdue if status is "Issued" and
 * today's date has passed the `expectedReturnDate`.
 * ============================================================================
 */

import mongoose from "mongoose";

const issueRequestSchema = new mongoose.Schema(
  {
    // Reference (foreign key) to the User (Student/Staff) who made the request
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Reference to the Asset (Equipment) being requested
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },

    // Number of units requested
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity requested must be at least 1"],
      default: 1,
    },

    // Academic or research purpose for borrowing the equipment
    purpose: {
      type: String,
      required: [true, "Please provide the purpose or project details"],
      trim: true,
    },

    // Due date when the borrower promised to return the equipment
    expectedReturnDate: {
      type: Date,
      required: [true, "Expected return date is required"],
    },

    // Current state in the issue-return lifecycle workflow
    status: {
      type: String,
      enum: ["Pending", "Approved", "Issued", "Returned", "Rejected"],
      default: "Pending",
    },

    // Reference to the Lab In-Charge / Admin who approved or rejected the request
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Timestamp when physical equipment was handed over (Issued)
    issuedAt: {
      type: Date,
    },

    // Timestamp when equipment was handed back (Returned)
    returnedAt: {
      type: Date,
    },

    // Physical condition audited by Lab In-Charge upon return
    returnCondition: {
      type: String,
      enum: ["OK", "Damaged", "Lost", "Pending Return"],
      default: "Pending Return",
    },

    // In-Charge remarks or notes (rejection reasons, return notes, cable checks)
    inchargeRemarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` date fields
    timestamps: true,
  }
);

/**
 * ⏰ MONGOOSE VIRTUAL: Dynamic Overdue Flag
 * Computes whether an issued item is past its expected return date.
 */
issueRequestSchema.virtual("isOverdue").get(function () {
  if (this.status === "Issued" && this.expectedReturnDate) {
    return new Date() > new Date(this.expectedReturnDate);
  }
  return false;
});

// Ensure virtual properties are serialized to JSON and Objects
issueRequestSchema.set("toJSON", { virtuals: true });
issueRequestSchema.set("toObject", { virtuals: true });

// Create the Mongoose Model from the schema
const IssueRequest = mongoose.model("IssueRequest", issueRequestSchema);
export default IssueRequest;
