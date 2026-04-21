/**
 * Vite config for Electron desktop build.
 * - base: '/' (relative URLs for file:// and localhost serving)
 * - No PORT or BASE_PATH env var requirement
 * - Sets VITE_DESKTOP_MODE=true for conditional logic in the app
 * - Outputs to dist/public (same as regular build for consistency)
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  define: {
    "import.meta.env.VITE_DESKTOP_MODE": JSON.stringify("true"),
    "import.meta.env.VITE_APP_URL": JSON.stringify(
      process.env.VITE_APP_URL || "https://cashierpro.replit.app"
    ),
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
});
