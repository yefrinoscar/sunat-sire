import node from "@astrojs/node";
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  vite: {
    envDir: fileURLToPath(new URL("..", import.meta.url)),
    server: {
      fs: { allow: [".."] },
    },
  },
});
