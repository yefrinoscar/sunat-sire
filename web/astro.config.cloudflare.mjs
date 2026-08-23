import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    envDir: fileURLToPath(new URL("..", import.meta.url)),
    server: {
      fs: { allow: [".."] },
    },
  },
});
