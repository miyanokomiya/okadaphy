import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, "src"),
  build: {
    outDir: resolve(__dirname, "dist"),
    rollupOptions: {
      input: {
        index: resolve(__dirname, "src", "index.html"),
      },
    },
  },
})

