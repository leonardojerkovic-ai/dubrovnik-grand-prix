import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Isti alias kao u tsconfig.json ("@/*" -> korijen projekta), da testovi
// mogu uvoziti module kao što ih uvozi aplikacija.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
