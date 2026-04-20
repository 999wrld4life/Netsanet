/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Professional Medical Theme Replacing Neon Ethiopian Theme
        "eth-green": "#0f766e", // Teal 700 - Professional/calm
        "eth-yellow": "#0369a1", // Sky 700 - Trustworthy blue
        "eth-red": "#be123c", // Rose 700 - Urgent but not glaring
        "bg-dark": "#f8fafc", // Slate 50 - Very light background
        "bg-card": "#ffffff", // Plain white for cards
        "bg-surface": "#f1f5f9", // Slate 100 for surface elements
        primary: "#0f172a", // Slate 900 for primary text
        secondary: "#475569", // Slate 600 for secondary text
        muted: "#94a3b8", // Slate 400 for muted text
        error: "#e11d48",
        success: "#059669",
        // Dark mode variants
        "dark-bg": "#0f172a", // Slate 900 - main dark bg
        "dark-card": "#1e293b", // Slate 800 - card bg
        "dark-surface": "#334155", // Slate 700 - surface
        "dark-border": "#475569", // Slate 600 - borders
        "dark-text": "#f1f5f9", // Slate 100 - primary text in dark
        "dark-muted": "#94a3b8", // Slate 400 - muted text in dark
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(15, 118, 110, 0.3)",
        "glow-yellow": "0 0 20px rgba(3, 105, 161, 0.3)",
        "glow-hover": "0 0 25px rgba(15, 118, 110, 0.5)",
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(15, 118, 110, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(15, 118, 110, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
