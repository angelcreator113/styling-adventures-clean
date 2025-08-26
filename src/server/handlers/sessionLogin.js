// src/server/handlers/sessionLogin.js

const admin = global.admin;

module.exports = async function sessionLogin(req, res) {
  const idToken = req.body.idToken; // ✅ Updated to match frontend payload

  if (!idToken) {
    return res.status(400).json({ error: 'Missing idToken in request body' });
  }

  try {
    const expiresIn = 5 * 24 * 60 * 60 * 1000; // 5 days in ms

    // Create session cookie
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    // Define cookie settings
    const cookieOptions = {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/', // site-wide cookie
    };
    console.log('[sessionLogin] Incoming body:', req.body);

    // Set the cookie
    res.cookie('session', sessionCookie, cookieOptions);

    // Send success response
    res.status(200).json({ status: 'success', expiresIn });
  } catch (err) {
    console.error('[sessionLogin]', err);
    res.status(401).json({ error: 'Failed to create session cookie' });
  }
};
