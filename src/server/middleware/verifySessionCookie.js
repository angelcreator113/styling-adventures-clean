// src/server/middleware/verifySessionCookie.js
const admin = global.admin;

async function verifySessionCookie(req, res, next) {
  try {
    const sessionCookie = req.cookies?.session || '';
    if (!sessionCookie) {
      return res.status(401).json({ error: 'No session cookie found' });
    }

    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    req.user = decodedClaims;
    next();
  } catch (error) {
    console.error('[verifySessionCookie]', error.message || error);
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

module.exports = verifySessionCookie;
