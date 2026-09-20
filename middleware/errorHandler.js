/**
 * ============================================================================
 * ⚠️ ERROR HANDLING MIDDLEWARE (middleware/errorHandler.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS FILE DO?
 * Provides friendly error pages instead of crashing the server or displaying
 * confusing raw error stack traces to users.
 * 
 * 1. `notFoundHandler`    : Handles 404 (Page Not Found) for invalid URLs.
 * 2. `globalErrorHandler`  : Catches 500 (Internal Server Error) exceptions.
 * ============================================================================
 */

/**
 * 404 Not Found Middleware
 * Triggers when no preceding route matched the incoming request URL.
 */
export function notFoundHandler(req, res, next) {
  res.status(404).render("pages/error", {
    title: "404 Not Found — LabScope",
    statusCode: 404,
    message: `The requested URL "${req.originalUrl}" was not found on this server.`,
  });
}

/**
 * 500 Internal Server Error Middleware
 * Catches unhandled exceptions from controllers or asynchronous database queries.
 */
export function globalErrorHandler(err, req, res, next) {
  console.error("🔥 Unhandled Server Error:", err);

  const statusCode = err.status || 500;
  res.status(statusCode).render("pages/error", {
    title: `${statusCode} Server Error — LabScope`,
    statusCode,
    message: err.message || "An unexpected error occurred while processing your request. Please try again.",
  });
}
