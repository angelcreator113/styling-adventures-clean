// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: {
    host: "127.0.0.1",
    port: 5174,          // stay on 5174
    strictPort: true,
    open: true,
    proxy: {
      "/sessionLogin": "http://localhost:3000",
      "/sessionLogout": "http://localhost:3000",
      "/smoke":        "http://localhost:3000",
      "/whoami":       "http://localhost:3000",
      // IMPORTANT: no '/admin' proxy — let the SPA own /admin/* routes
    },
    hmr: { protocol: "ws", host: "localhost", port: 5174 },
  },
  optimizeDeps: {
    include: ["recharts"],
    exclude: ["firebase", "firebase/app", "firebase/auth", "lucide-react"],
    force: command === "serve",
  },
  ssr: { noExternal: ["firebase"] },
}));
