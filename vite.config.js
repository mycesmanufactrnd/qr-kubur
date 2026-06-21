import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  // logLevel: 'error',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      src: path.resolve(__dirname, "src"),
    },
  },
  base: "/",
  envDir: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) return "vendor-firebase";
            if (id.includes("three")) return "vendor-three";
            if (id.includes("tesseract")) return "vendor-tesseract";
            if (id.includes("@jitsi")) return "vendor-jitsi";
            if (id.includes("jspdf") || id.includes("html2canvas")) return "vendor-pdf";
            if (id.includes("@sentry")) return "vendor-sentry";
            if (id.includes("@stripe")) return "vendor-stripe";
            if (id.includes("react-leaflet") || id.includes("leaflet") || id.includes("@turf")) return "vendor-maps";
            if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-")) return "vendor-charts";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("@tanstack") || id.includes("@trpc")) return "vendor-query";
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) return "vendor-forms";
            if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("vaul") || id.includes("sonner")) return "vendor-ui";
            if (id.includes("@floating-ui")) return "vendor-floating";
            if (id.includes("react-quill") || id.includes("quill")) return "vendor-quill";
            if (id.includes("moment")) return "vendor-moment";
            if (id.includes("lodash")) return "vendor-lodash";
            if (id.includes("@base44")) return "vendor-base44";
            if (id.includes("papaparse") || id.includes("react-markdown") || id.includes("remark") || id.includes("micromark")) return "vendor-parse";
            if (id.includes("@capacitor")) return "vendor-capacitor";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("@hello-pangea") || id.includes("react-resizable") || id.includes("embla-carousel") || id.includes("react-day-picker")) return "vendor-widgets";
            if (id.includes("date-fns")) return "vendor-date";
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      "/api": "http://backend:8083",
      "/trpc": "http://backend:8083",
    },
  },
});
