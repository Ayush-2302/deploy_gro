import { defineConfig } from '@tailwindcss/vite'

export default defineConfig({
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        primary: { DEFAULT: "#2563EB" },
        secondary: { DEFAULT: "#10B981" },
      },
      fontFamily: {
        heading: ["Montserrat", "ui-sans-serif", "system-ui"],
        sans: [
          "SF Pro Text",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Inter",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
      },
      boxShadow: { soft: "0 6px 16px rgba(15, 23, 42, .06)" },
    },
  },
});
