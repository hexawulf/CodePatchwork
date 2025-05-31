import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async () => {
  /* ------------------------------------------------------------
   * Only load Replit-specific plugins in the Replit IDE
   * ---------------------------------------------------------- */
  const loadReplitPlugins = async () => {
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
    ) {
      const runtimeErrorOverlay = (
        await import("@replit/vite-plugin-runtime-error-modal")
      ).default;
      const { cartographer } = await import("@replit/vite-plugin-cartographer");
      return [runtimeErrorOverlay(), cartographer()];
    }
    return [];
  };

  const replitPlugins = await loadReplitPlugins();

  return {
    plugins: [react(), ...replitPlugins],

    /* ----------------------------------------------------------
     * Alias shortcuts  (@ → client/src, @shared, @assets)
     * -------------------------------------------------------- */
    resolve: {
      alias: {
        "@":       path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },

    /* ----------------------------------------------------------
     * Project roots & output
     * -------------------------------------------------------- */
    root:  path.resolve(import.meta.dirname, "client"),
    build: {
      outDir:      path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    publicDir: path.resolve(import.meta.dirname, "public"),

    /* ----------------------------------------------------------
     * Env handling
     *  – Vite already injects import.meta.env.*
     *  – This define() lets the few libs that still reach for
     *    process.env.X run safely in the browser
     * -------------------------------------------------------- */
    define: {
      "process.env": {},          // harmless shim
    },

    /* Limit Vite’s env import to the usual VITE_* prefix */
    envPrefix: "VITE_",
  };
});
