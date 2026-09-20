/**
 * ============================================================================
 * 🔐 AUTHENTICATION CONTROLLER (controllers/authController.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS CONTROLLER DO?
 * Handles user authentication, account registration, session initialization,
 * 1-click demo logins for instant testing, and user sign-out.
 * ============================================================================
 */

import User from "../models/User.js";

/**
 * 🏠 Render Public Landing Page
 * If the user is already logged in, redirects them straight to /dashboard.
 */
export function getLandingPage(req, res) {
  if (req.session && req.session.user) {
    return res.redirect("/dashboard");
  }

  res.render("pages/landing", {
    title: "Lab Equipment & Asset Tracking System — Institutional Portal",
  });
}

/**
 * 🔑 Render Login Page
 */
export function getLoginPage(req, res) {
  // If already logged in, go to dashboard
  if (req.session && req.session.user) {
    return res.redirect("/dashboard");
  }

  // Pass any query error or success messages to the view template
  res.render("pages/login", {
    title: "Sign In — Lab Asset Tracking System",
    error: req.query.error || null,
    success: req.query.success || null,
  });
}

/**
 * 📝 Render Registration Page
 */
export function getRegisterPage(req, res) {
  if (req.session && req.session.user) {
    return res.redirect("/dashboard");
  }

  res.render("pages/register", {
    title: "Create Account — Lab Asset Tracking System",
    error: req.query.error || null,
  });
}

/**
 * 🚀 Handle Login Form Submission (POST /login)
 * 
 * Step-by-Step Flow:
 * 1. Extract email and password from req.body (submitted from HTML form).
 * 2. Look up the user by email in MongoDB.
 * 3. Use `user.comparePassword()` to securely check the bcrypt hash.
 * 4. If valid, store user identity in `req.session.user` and redirect to dashboard.
 */
export async function postLogin(req, res) {
  const { email, password } = req.body;

  // Step 1: Validate input presence
  if (!email || !password) {
    return res.redirect("/login?error=Please+enter+both+email+and+password");
  }

  try {
    // Step 2: Find user by normalized email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.redirect("/login?error=Invalid+email+or+password");
    }

    // Step 3: Verify password using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.redirect("/login?error=Invalid+email+or+password");
    }

    // Step 4: Store authenticated user profile in session cookie
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      idNumber: user.idNumber,
    };

    // Step 5: Redirect to dashboard upon successful login
    res.redirect("/dashboard");
  } catch (err) {
    res.redirect(`/login?error=${encodeURIComponent(err.message)}`);
  }
}

/**
 * ✍️ Handle User Registration Form (POST /register)
 * 
 * Step-by-Step Flow:
 * 1. Extract form fields from req.body.
 * 2. Verify all required fields are filled and email is not already taken.
 * 3. Create new User document in MongoDB (password gets auto-hashed via pre-save hook).
 * 4. Automatically log the user in and redirect to dashboard.
 */
export async function postRegister(req, res) {
  const { name, email, password, role, department, idNumber } = req.body;

  // Step 1: Validate required fields
  if (!name || !email || !password) {
    return res.redirect("/register?error=Please+fill+in+all+required+fields");
  }

  try {
    // Step 2: Check for existing account with same email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.redirect("/register?error=Email+is+already+registered");
    }

    // Step 3: Insert new user into MongoDB
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // Mongoose pre-save hook will hash this securely
      role: role && ["requester", "incharge", "admin"].includes(role) ? role : "requester",
      department: department ? department.trim() : "General Science & Engineering",
      idNumber: idNumber ? idNumber.trim() : undefined,
    });

    // Step 4: Set active session
    req.session.user = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      idNumber: newUser.idNumber,
    };

    res.redirect("/dashboard");
  } catch (err) {
    res.redirect(`/register?error=${encodeURIComponent(err.message)}`);
  }
}

/**
 * ⚡ 1-Click Instant Demo Login (GET /demo-login/:role)
 * Allows testing each role (admin, incharge, requester) in one click without typing passwords.
 */
export async function demoLogin(req, res) {
  const { role } = req.params;
  
  // Map requested demo role to seeded account emails
  const roleEmails = {
    admin: "admin@lab.edu",
    incharge: "incharge@lab.edu",
    requester: "student@lab.edu",
  };

  const targetEmail = roleEmails[role] || "student@lab.edu";

  try {
    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      return res.redirect("/login?error=Demo+account+not+found.+Ensure+database+is+seeded.");
    }

    // Set demo session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      idNumber: user.idNumber,
    };

    res.redirect("/dashboard");
  } catch (err) {
    res.redirect(`/login?error=${encodeURIComponent(err.message)}`);
  }
}

/**
 * 🚪 Log User Out (GET /logout)
 * Destroys the session cookie and redirects to the login screen.
 */
export function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/login?success=Logged+out+successfully");
  });
}
