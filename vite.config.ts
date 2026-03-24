import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import devServer from "@hono/vite-dev-server";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    devServer({
      entry: "server/index.ts",
      exclude: [
        /^(?!\/api\/).*/,
      ],
      injectClientScript: false,
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@server": resolve(__dirname, "server"),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        client: resolve(__dirname, "index.html"),
      },
    },
  },
});
