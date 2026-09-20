/**
 * ============================================================================
 * 🌱 DATABASE SEED SERVICE (services/seedService.js)
 * ============================================================================
 * 
 * 💡 WHAT IS SEEDING?
 * "Seeding" means populating a brand-new database with realistic initial data
 * so you don't start with empty screens.
 * 
 * 📦 WHAT THIS SCRIPT CREATES:
 * 1. 3 Demo User Accounts (Admin, Lab In-Charge, Requester).
 * 2. 10 Institutional Laboratory Equipment items across disciplines.
 * 3. Sample Requisitions (Demonstrating Active, Overdue, and Returned states).
 * ============================================================================
 */

import User from "../models/User.js";
import Asset from "../models/Asset.js";
import IssueRequest from "../models/IssueRequest.js";

export async function seedDatabase() {
  try {
    // Check if users already exist. If yes, skip seeding to avoid duplicate data.
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return; // Database already seeded
    }

    console.log("🌱 Database is empty. Seeding initial demo users, lab assets, and sample requisitions...");

    // ------------------------------------------------------------------------
    // 1. Create Default Demo Accounts
    // ------------------------------------------------------------------------
    const adminUser = await User.create({
      name: "Dr. Eleanor Vance (Admin)",
      email: "admin@lab.edu",
      password: "admin123", // Pre-save hook will hash this
      role: "admin",
      department: "Central Institutional Lab Directorate",
      idNumber: "ADM-1001",
    });

    const inchargeUser = await User.create({
      name: "Prof. Marcus Thorne (Lab In-Charge)",
      email: "incharge@lab.edu",
      password: "incharge123",
      role: "incharge",
      department: "Advanced Electronics & Physics Lab",
      idNumber: "LIC-2002",
    });

    const studentUser = await User.create({
      name: "Aria Sharma (Student / Staff)",
      email: "student@lab.edu",
      password: "student123",
      role: "requester",
      department: "Robotics & Embedded Systems",
      idNumber: "STU-9904",
    });

    // ------------------------------------------------------------------------
    // 2. Create Sample Laboratory Equipment Inventory
    // ------------------------------------------------------------------------
    const assetsData = [
      {
        assetTag: "LAB-OSC-101",
        name: "Rigol DS1054Z 4-Channel Digital Storage Oscilloscope (100MHz)",
        category: "Electronics & Embedded",
        labLocation: "Embedded Systems Lab (Room 302)",
        condition: "Good",
        totalQuantity: 8,
        availableQuantity: 6,
        specifications: "4 Analog Channels, 50MHz Bandwidth, 1GSa/s Real-time Sample Rate, 24Mpts Memory Depth",
      },
      {
        assetTag: "LAB-SPEC-204",
        name: "UV-Visible Spectrophotometer UV-1900i",
        category: "Chemistry & Materials",
        labLocation: "Analytical Chemistry Lab (Room 114)",
        condition: "Good",
        totalQuantity: 3,
        availableQuantity: 2,
        specifications: "Wavelength range: 190 to 1100 nm, Ultra-fast scanning up to 29,000 nm/min",
      },
      {
        assetTag: "LAB-OPT-305",
        name: "He-Ne Laser Optical Bench & Interferometer Kit",
        category: "Optics & Lasers",
        labLocation: "Photonics & Optics Lab (Room 210)",
        condition: "Good",
        totalQuantity: 5,
        availableQuantity: 4,
        specifications: "632.8nm Red Laser, 5mW Power, Precision Kinematic Mounts, Michelson Beam Splitter",
      },
      {
        assetTag: "LAB-BIO-402",
        name: "Thermo Scientific High-Speed Refrigerated Centrifuge",
        category: "Biotechnology & Life Sciences",
        labLocation: "Biomedical & Cell Biology Lab (Room 405)",
        condition: "Good",
        totalQuantity: 4,
        availableQuantity: 4,
        specifications: "Max Speed 15,200 RPM, Auto-Lock Rotor exchange, Temp range -10°C to +40°C",
      },
      {
        assetTag: "LAB-ROB-501",
        name: "NVIDIA Jetson AGX Orin 64GB AI Developer Kit",
        category: "Robotics & Computing",
        labLocation: "Robotics & Autonomous Systems Lab (Room 501)",
        condition: "Good",
        totalQuantity: 6,
        availableQuantity: 4,
        specifications: "275 TOPS AI performance, 2048-core NVIDIA Ampere architecture GPU, 12-core Arm CPU",
      },
      {
        assetTag: "LAB-THERM-603",
        name: "FLIR E8-XT Infrared Thermal Imaging Camera",
        category: "General Instruments",
        labLocation: "Instrumentation Lab (Room 208)",
        condition: "Good",
        totalQuantity: 4,
        availableQuantity: 3,
        specifications: "320x240 Thermal Resolution, MSX Image Enhancement, Temp range -20°C to 550°C",
      },
      {
        assetTag: "LAB-PRINT-708",
        name: "Prusa i3 MK4 High-Precision 3D Printer",
        category: "Mechanical & Tools",
        labLocation: "Prototyping & Maker Space (Room 102)",
        condition: "Fair",
        totalQuantity: 3,
        availableQuantity: 2,
        specifications: "Direct Drive Extruder, Automatic Loadcell Bed Leveling, 0.05mm Layer Resolution",
      },
      {
        assetTag: "LAB-FUNC-812",
        name: "Siglent SDG2042X Arbitrary Waveform Generator (40MHz)",
        category: "Electronics & Embedded",
        labLocation: "Circuits & Signal Processing Lab (Room 304)",
        condition: "Good",
        totalQuantity: 10,
        availableQuantity: 9,
        specifications: "Dual-Channel, 1.2GSa/s Sampling rate, 16-bit Vertical Resolution, TrueArb & EasyPulse",
      },
      {
        assetTag: "LAB-MIC-920",
        name: "Olympus CX23 Binocular Biological Microscope",
        category: "Biotechnology & Life Sciences",
        labLocation: "Microbiology Lab (Room 408)",
        condition: "Needs Maintenance",
        totalQuantity: 12,
        availableQuantity: 10,
        specifications: "Plan Achromat Objectives (4x, 10x, 40x, 100x Oil), LED illumination with field diaphragm",
      },
      {
        assetTag: "LAB-CHEM-110",
        name: "Mettler Toledo Analytical Balance (0.0001g Precision)",
        category: "Chemistry & Materials",
        labLocation: "Analytical Chemistry Lab (Room 114)",
        condition: "Good",
        totalQuantity: 6,
        availableQuantity: 6,
        specifications: "220g Capacity, 0.1mg Readability, Internal Calibration (FACT), Glass Draft Shield",
      },
    ];

    const createdAssets = await Asset.insertMany(assetsData);

    // ------------------------------------------------------------------------
    // 3. Create Sample Lifecycle Requests (Pending, Active, Overdue, Returned)
    // ------------------------------------------------------------------------
    const now = new Date();
    const pastDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const overdueExpectedDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago (OVERDUE!)
    const futureExpectedDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // in 7 days

    await IssueRequest.create([
      // A) Active normal checkout
      {
        requester: studentUser._id,
        asset: createdAssets[0]._id, // Rigol Oscilloscope
        quantity: 1,
        purpose: "Final Year Capstone Project - High-Speed Signal Integrity Analysis",
        expectedReturnDate: futureExpectedDate,
        status: "Issued",
        approvedBy: inchargeUser._id,
        issuedAt: pastDate,
        returnCondition: "Pending Return",
        inchargeRemarks: "Issued in good working condition with 2 BNC probe cables.",
      },
      // B) Overdue checkout to test alert system
      {
        requester: studentUser._id,
        asset: createdAssets[4]._id, // NVIDIA Jetson
        quantity: 1,
        purpose: "Autonomous Drone Computer Vision Navigation Experiment",
        expectedReturnDate: overdueExpectedDate, // Past date -> Automatically flags as OVERDUE
        status: "Issued",
        approvedBy: inchargeUser._id,
        issuedAt: pastDate,
        returnCondition: "Pending Return",
        inchargeRemarks: "High-value unit issued. Ensure cooling fan is connected.",
      },
      // C) Pending requisition awaiting approval
      {
        requester: studentUser._id,
        asset: createdAssets[1]._id, // Spectrophotometer
        quantity: 1,
        purpose: "Organic Compound Absorbance Wavelength Curve Calibration",
        expectedReturnDate: futureExpectedDate,
        status: "Pending",
        inchargeRemarks: "",
      },
      // D) Completed return with condition audit
      {
        requester: studentUser._id,
        asset: createdAssets[5]._id, // FLIR Thermal Camera
        quantity: 1,
        purpose: "PCB Heat Dissipation Thermography",
        expectedReturnDate: pastDate,
        status: "Returned",
        approvedBy: inchargeUser._id,
        issuedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        returnedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        returnCondition: "OK",
        inchargeRemarks: "Returned on time in clean condition. Lens cap intact.",
      },
    ]);

    console.log("✅ Database seeded successfully with demo accounts & institutional assets!");
  } catch (err) {
    console.error("⚠️ Error seeding database:", err.message);
  }
}
