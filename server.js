// server.js
require('dotenv').config({ override: true });

const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const admin = require('firebase-admin');

const isProd = process.env.NODE_ENV === 'production';

// Allow both 5173 and 5174 (Vite sometimes bumps ports)
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'
]);

/* ----------------------- Firebase Admin init ----------------------- */
(function initAdmin() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (b64) {
    const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(json),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  }
})();

/* ---------------------------- Express ----------------------------- */
const app = express();
app.disable('x-powered-by');
if (isProd) app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// CORS: accept same-site dev origins and send credentials
app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      try {
        const o = new URL(origin).origin;
        return cb(null, ALLOWED_ORIGINS.has(o));
      } catch {
        return cb(null, false);
      }
    }
  })
);

/* ----------------------- Utility / Health ------------------------- */
app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/smoke', async (_req, res, next) => {
  try {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'smoke/' });
    res.json({ bucket: bucket.name, files: files.map((f) => f.name) });
  } catch (e) {
    next(e);
  }
});

/* ------------------------- Auth Sessions -------------------------- */
const FIVE_DAYS = 1000 * 60 * 60 * 24 * 5;

app.post('/sessionLogin', async (req, res) => {
  try {
    const { idToken, remember } = req.body || {};
    if (!idToken) return res.status(400).json({ error: 'missing idToken' });

    const expiresIn = remember ? FIVE_DAYS : 1000 * 60 * 60 * 8;
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    res.cookie('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      path: '/'
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('sessionLogin failed:', e);
    res.status(401).json({ error: 'sessionLogin failed' });
  }
});

app.post('/sessionLogout', async (req, res) => {
  try {
    const cookie = req.cookies.__session || '';
    if (req.query.revoke === '1' && cookie) {
      try {
        const decoded = await admin.auth().verifySessionCookie(cookie, true);
        await admin.auth().revokeRefreshTokens(decoded.sub);
      } catch { /* ignore */ }
    }
  } finally {
    res.clearCookie('__session', { path: '/' });
    res.json({ ok: true });
  }
});

app.get('/whoami', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const cookie = req.cookies.__session || '';
    const decoded = await admin.auth().verifySessionCookie(cookie, true);
    res.json({ uid: decoded.uid, email: decoded.email, claims: decoded });
  } catch {
    res.status(401).json({ authed: false });
  }
});

/* --------------------- DEV bypass (guarded) ----------------------- */
if (String(process.env.FIREBASE_ADMIN_BYPASS).toLowerCase() === 'true') {
  app.post('/dev/login/:uid', async (req, res) => {
    try {
      const { uid } = req.params;
      const customToken = await admin.auth().createCustomToken(uid);
      const sessionCookie = await admin.auth().createSessionCookie(customToken, { expiresIn: FIVE_DAYS });
      res.cookie('__session', sessionCookie, {
        maxAge: FIVE_DAYS,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        path: '/'
      });
      res.json({ ok: true, uid, note: 'DEV ONLY' });
    } catch (e) {
      console.error('dev/login failed:', e);
      res.status(500).json({ error: 'dev login failed' });
    }
  });
}

/* -------------------- STATIC + SPA FALLBACK ----------------------- */
/**
 * Serve the production build when it exists (vite build -> /dist).
 * This lets you refresh deep routes like /admin/home without 404s.
 */
const distDir = path.resolve(process.cwd(), 'dist');
app.use(express.static(distDir, { extensions: ['html'] }));

// Send index.html for any route we didn't match above (SPA fallback).
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

/* ---------------------- Error handler last ------------------------ */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
});

/* --------------------------- Listen ------------------------------- */
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3000);
app.listen(port, host, () => {
  console.log(`[server] http://${host}:${port}`);
});
