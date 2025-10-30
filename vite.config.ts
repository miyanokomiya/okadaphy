import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, "src"),
  base: process.env.BASE_PATH || "/",
  define: {
    "process.env.__APP_VERSION__": JSON.stringify(process.env.TAG_NAME || "development"),
  },
  build: {
    outDir: resolve(__dirname, "dist"),
    rollupOptions: {
      input: {
        index: resolve(__dirname, "src", "index.html"),
      },
    },
  },
})

