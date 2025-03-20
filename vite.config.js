import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: ["src/main.js"],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
      cssFileName: "my-lib-style",
    },
  },
});
