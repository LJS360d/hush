import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import solid from "vite-plugin-solid";
import mkCert from "vite-plugin-mkcert";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const [username, repoName] = GITHUB_REPOSITORY
  ? GITHUB_REPOSITORY.split("/")
  : ["", ""];

// Check if this is a User/Org site (root) or a Project site (subfolder)
const isRootPages = repoName === `${username}.github.io`;

// https://vitejs.dev/config/
export default defineConfig((env) => ({
  root: ".",
  envDir: ".",
  publicDir: "public",
  base: GITHUB_REPOSITORY && !isRootPages ? `/${repoName}/` : "/",
  plugins: [
    tanstackRouter({
      target: "solid",
      autoCodeSplitting: true,
      routesDirectory: "src/routes",
      generatedRouteTree: "src/routeTree.gen.ts",
    }),
    solid(),
    tailwindcss(),
    mkCert(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
  },
  build: {
    assetsInlineLimit: 0,
    sourcemap: env.mode === "development",
    // Vite uses rollup currently for prod builds so a separate config is needed
    // to keep vite from bundling ESM together with commonjs
    rollupOptions: {
      output: {
        format: "umd",
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
}));
