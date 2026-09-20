/**
 * ============================================================================
 * 🛡️ AUTHENTICATION & RBAC MIDDLEWARE (middleware/auth.js)
 * ============================================================================
 * 
 * 💡 WHAT IS MIDDLEWARE?
 * In Express, a middleware is a function that sits between an incoming HTTP
 * request and the final controller handler. It has access to:
 * - `req` (Request object)
 * - `res` (Response object)
 * - `next` (Function that passes control to the next middleware or route)
 * 
 * 🔐 OUR SECURITY CHECKS:
 * 1. `requireAuth`: Ensures the user is logged in before visiting protected pages.
 * 2. `requireRole`: Ensures the logged-in user has specific role permissions (e.g. admin).
 * 3. `attachUser`: Injects `currentUser` into all EJS templates for dynamic UI rendering.
 * ============================================================================
 */

/**
 * 🔒 Check if user is logged in.
 * If not authenticated, redirects them to /login with an error notification.
 */
export function requireAuth(req, res, next) {
  // Check if session exists and contains user credentials
  if (req.session && req.session.user) {
    return next(); // User is authenticated -> proceed to next handler
  }

  // Not logged in -> redirect to login page
  return res.redirect("/login?error=Please+log+in+to+access+this+page");
}

/**
 * 👮 Role-Based Access Control (RBAC) Guard.
 * Restricts route access to specific permitted roles.
 * Example usage: `requireRole('admin')` or `requireRole('incharge', 'admin')`
 * 
 * @param  {...string} allowedRoles - List of role names allowed to access this route
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // 1. Ensure user is logged in
    if (!req.session || !req.session.user) {
      return res.redirect("/login?error=Authentication+required");
    }

    // 2. Check if current user's role is in the permitted roles array
    if (allowedRoles.includes(req.session.user.role)) {
      return next(); // Role permitted -> proceed
    }

    // 3. User does not have permission -> Render friendly 403 Forbidden page
    return res.status(403).render("pages/error", {
      title: "403 Forbidden — Access Denied",
      statusCode: 403,
      message: `Access denied. This action requires one of the following roles: [${allowedRoles.join(", ")}]. Your current role is: "${req.session.user.role}".`,
    });
  };
}

/**
 * 🌐 Global Context Helper Middleware.
 * Attaches `currentUser` and `currentPath` to `res.locals`.
 * Express automatically exposes `res.locals` variables directly inside all EJS templates,
 * allowing navigation bars to check `currentUser.role` without manual controller passing.
 */
export function attachUser(req, res, next) {
  res.locals.currentUser = req.session && req.session.user ? req.session.user : null;
  res.locals.currentPath = req.path;
  next();
}
