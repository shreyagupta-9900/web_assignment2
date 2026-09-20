/**
 * ============================================================================
 * 💾 DATABASE CONFIGURATION (config/db.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS FILE DO?
 * This file establishes a connection between our Node.js server and our
 * MongoDB database using the Mongoose Object-Data Modeling (ODM) library.
 * 
 * 🌱 AUTO-SEEDING:
 * If this is the first time running the application and the database is empty,
 * it will automatically invoke `seedDatabase()` to insert demo accounts and
 * initial laboratory equipment so the app is immediately usable for demonstration.
 * ============================================================================
 */

import mongoose from "mongoose";
import { seedDatabase } from "../services/seedService.js";

let isConnected = false;

/**
 * Connect to MongoDB instance and trigger seed check.
 */
export async function connectDB() {
  // Use MongoDB URI from .env file, or fall back to default local MongoDB port 27017
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lab_asset_management";

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000, // Timeout after 4 seconds if database is not reachable
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Check if database needs initial sample data seeded
    await seedDatabase();
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️ MongoDB connection warning: ${error.message}`);
    console.warn(`   Tip: Ensure MongoDB is running locally via 'brew services start mongodb-community' or mongod.`);
  }
}

/**
 * Helper function to check if the database is currently connected and ready.
 * @returns {boolean}
 */
export function isDBConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}
