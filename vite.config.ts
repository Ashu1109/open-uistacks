import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { environment: "jsdom", include: ["originals/**/*.test.tsx", "playground/**/*.test.tsx"] },
});
