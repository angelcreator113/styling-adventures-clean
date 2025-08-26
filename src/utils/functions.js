// Always call Cloud Functions in the same region we deploy to.
import { getApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

/**
 * fx() → region-bound Functions instance
 * In dev, you can optionally point to the local emulator by setting:
 *   VITE_USE_FUNCTIONS_EMULATOR=true
 */
export function fx() {
  const f = getFunctions(getApp(), "us-central1");
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === "true") {
    // Default emulator port for functions is 5001
    connectFunctionsEmulator(f, "127.0.0.1", 5001);
  }
  return f;
}
