/**
 * ============================================================================
 * 👤 USER MODEL (models/User.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS MODEL DO?
 * Defines the MongoDB schema and document structure for institutional users.
 * 
 * 👥 ROLE-BASED ACCESS CONTROL (RBAC):
 * Every user has one of 3 distinct roles:
 * 1. 'requester' : Students and staff who browse and request to borrow lab equipment.
 * 2. 'incharge'  : Lab In-Charge who approves/rejects requests, issues gear, and audits returns.
 * 3. 'admin'     : System Administrator who manages the equipment catalog (CRUD) & system metrics.
 * 
 * 🔒 SECURITY:
 * Passwords are encrypted using bcrypt hashing before saving to the database.
 * ============================================================================
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Define the blueprint (Schema) for each User in MongoDB
const userSchema = new mongoose.Schema(
  {
    // Full name of the user (e.g. "Dr. Eleanor Vance", "Aria Sharma")
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    // Institutional email address (e.g. "student@lab.edu") - must be unique
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Password - will be securely hashed by bcrypt before storage
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },

    // Role determines what permissions and pages the user can access
    role: {
      type: String,
      enum: ["requester", "incharge", "admin"],
      default: "requester",
    },

    // Academic department or laboratory group (e.g. "Robotics & Embedded Systems")
    department: {
      type: String,
      default: "General Science & Engineering",
      trim: true,
    },

    // Institutional Roll Number or Staff ID (e.g. "STU-9904", "ADM-1001")
    idNumber: {
      type: String,
      trim: true,
      default: function () {
        return `ID-${Math.floor(1000 + Math.random() * 9000)}`;
      },
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` date fields
    timestamps: true,
  }
);

/**
 * 🔐 PRE-SAVE HOOK: Automatically Hash Passwords
 * Before saving a user to MongoDB, this hook checks if the password was modified.
 * If yes, it salts and hashes the plaintext password using bcrypt.
 */
userSchema.pre("save", async function (next) {
  // If the password hasn't changed (e.g. updating profile details), skip re-hashing
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * 🔑 INSTANCE METHOD: Verify Password on Login
 * Compares a candidate plaintext password (from login form) with the hashed password in MongoDB.
 * @param {string} candidatePassword - The plain password entered by user
 * @returns {Promise<boolean>} - True if password matches, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create the Mongoose Model from the schema
const User = mongoose.model("User", userSchema);
export default User;
