import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";
import { sites } from "@openai/sites-vite-plugin";

// No editor/devtools instrumentation is injected into the Three.js scene.
export default defineConfig(({ command, mode }) => {
  // Start's prerender preview reloads this config without forwarding --mode.
  // TSS_PRERENDERING is set by Start in that build process only.
  const mobile = mode === "mobile" || process.env["TSS_PRERENDERING"] === "true";
  const vercel = process.env["VERCEL"] === "1";

  return {
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
      tanstackStart({
        server: { entry: "server" },
        spa: { enabled: mobile, prerender: { outputPath: "/index.html" } },
      }),
      ...(command === "build" && !mobile
        ? [
            vercel
              ? nitro()
              : nitro({
                  preset: "cloudflare-module",
                  output: { dir: "dist", serverDir: "dist/server", publicDir: "dist/client" },
                  rollupConfig: { output: { entryFileNames: "index.js" } },
                  cloudflare: { nodeCompat: true },
                }),
          ]
        : []),
      react(),
      ...(!mobile && !vercel ? [sites()] : []),
    ],
    ...(mobile
      ? {
          build: { outDir: ".mobile-build" },
          environments: { client: { build: { outDir: "dist-mobile" } } },
        }
      : {
          build: { rolldownOptions: { external: ["cloudflare:workers"] } },
        }),
    server: { host: "127.0.0.1", port: 8080, strictPort: true },
    resolve: {
      dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
