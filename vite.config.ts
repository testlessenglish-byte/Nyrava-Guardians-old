import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";
import { sites } from "@openai/sites-vite-plugin";

// No editor/devtools instrumentation is injected into the Three.js scene.
export default defineConfig(({ command }) => ({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({ server: { entry: "server" } }),
    ...(command === "build"
      ? [
          nitro({
            preset: "cloudflare-module",
            output: { dir: "dist", serverDir: "dist/server", publicDir: "dist/client" },
            rollupConfig: { output: { entryFileNames: "index.js" } },
            cloudflare: { nodeCompat: true },
          }),
        ]
      : []),
    react(),
    sites(),
  ],
  server: { host: "127.0.0.1", port: 8080, strictPort: true },
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
