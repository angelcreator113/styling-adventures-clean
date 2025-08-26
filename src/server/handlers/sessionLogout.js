// src/server/handlers/sessionLogout.js

module.exports = async function sessionLogout(req, res) {
  try {
    // Clear the session cookie
    res.clearCookie('session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.status(200).json({ status: 'logged out' });
  } catch (err) {
    console.error('[sessionLogout] Error clearing session cookie:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
};
