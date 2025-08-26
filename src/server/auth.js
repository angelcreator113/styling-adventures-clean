// src/server/auth.js

const admin = require('firebase-admin');

/**
 * Middleware to authenticate users using a Bearer token from Authorization header.
 * If valid, attaches the decoded user to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const [, token] = (req.headers.authorization || '').split(' ');

    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    const decoded = await admin.auth().verifyIdToken(token, true);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('[auth][authenticate]', error.message || error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to ensure the authenticated user has the `admin` claim.
 */
function requireAdmin(req, res, next) {
  if (req.user?.admin === true) {
    return next();
  }

  console.warn('[auth][requireAdmin] Forbidden: user lacks admin claim');
  res.status(403).json({ error: 'Admin access required' });
}

module.exports = { authenticate, requireAdmin };
