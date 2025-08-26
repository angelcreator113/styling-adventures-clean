// src/server/handlers/auth-session.js
const admin = require('firebase-admin');

/**
 * Middleware to verify Firebase session cookie and attach user info to request
 */
async function authenticateSession(req, res, next) {
  try {
    const sessionCookie = req.cookies?.session;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Missing session cookie' });
    }

    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    req.user = decodedClaims;
    next();
  } catch (err) {
    console.error('[auth-session][authenticateSession]', err.message || err);
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

/**
 * Middleware to check for admin claim in session token
 */
function requireAdminSession(req, res, next) {
  if (req.user?.admin === true) return next();
  return res.status(403).json({ error: 'Admin access required' });
}

module.exports = {
  authenticateSession,
  requireAdminSession
};
