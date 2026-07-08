import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve("index.html"),
        passThePhone: resolve("pass-the-phone.html"),
      },
    },
  },
});
