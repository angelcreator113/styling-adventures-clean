// src/utils/roles.js
import { auth } from "@/utils/init-firebase";

/**
 * Lightweight role/claims cache to avoid hammering the securetoken endpoint.
 * We DO NOT force-refresh by default. We de-dupe concurrent calls and only
 * refresh after STALE_MS or when explicitly forced.
 */

let _claimsCache = null;         // last claims object
let _rolesCache = ["fan"];       // last derived roles
let _ts = 0;                     // last fetch timestamp
let _inflight = null;            // de-duped in-flight promise
let _backoffUntil = 0;           // backoff window end

const STALE_MS = 5 * 60 * 1000;  // 5 minutes
const BACKOFF_MS = 60 * 1000;    // 60s after quota errors

function deriveRolesFromClaims(claims) {
  // Normalize to your app's role model
  if (!claims) return ["fan"];
  if (claims.role === "admin" || claims.admin) return ["admin", "creator"];
  if (claims.role === "creator") return ["creator"];
  return ["fan"];
}

export function primaryRole(roles = []) {
  // Prefer admin > creator > fan
  if (roles.includes("admin")) return "admin";
  if (roles.includes("creator")) return "creator";
  return "fan";
}

export function getCachedRoles() {
  return { claims: _claimsCache, roles: _rolesCache, ts: _ts };
}

export function clearRolesCache() {
  _claimsCache = null;
  _rolesCache = ["fan"];
  _ts = 0;
}

/**
 * getRoles({ force })
 * - De-duped, cached call.
 * - No forced refresh unless explicitly requested.
 * - Falls back to cache on quota errors and sets a short backoff.
 */
export async function getRoles({ force = false } = {}) {
  const now = Date.now();

  // Backoff: if we recently hit quota, return cache without trying again
  if (now < _backoffUntil && _claimsCache) {
    return _rolesCache;
  }

  const fresh = now - _ts < STALE_MS;
  if (!force && fresh && _claimsCache) {
    return _rolesCache;
  }

  if (_inflight) return _inflight;

  _inflight = (async () => {
    const user = auth.currentUser;
    if (!user) {
      _claimsCache = null;
      _rolesCache = ["fan"];
      _ts = Date.now();
      return _rolesCache;
    }

    try {
      // DO NOT pass 'true' unless you really must force refresh.
      const res = await user.getIdTokenResult(); // no force-refresh
      _claimsCache = res?.claims || null;
      _rolesCache = deriveRolesFromClaims(_claimsCache);
      _ts = Date.now();
      return _rolesCache;
    } catch (err) {
      // Graceful fallback on quota or transient network errors
      const code = err?.code || "";
      if (code === "auth/quota-exceeded" || code === "auth/network-request-failed") {
        _backoffUntil = Date.now() + BACKOFF_MS; // short backoff
        if (_claimsCache) return _rolesCache;    // use cache if available
      }
      // For anything else, still expose cache if we have it
      if (_claimsCache) return _rolesCache;
      // Otherwise surface fan as a safe default
      _claimsCache = null;
      _rolesCache = ["fan"];
      _ts = Date.now();
      return _rolesCache;
    } finally {
      _inflight = null;
    }
  })();

  return _inflight;
}
