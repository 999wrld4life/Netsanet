/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional Medical Theme Replacing Neon Ethiopian Theme
        'eth-green': '#0f766e', // Teal 700 - Professional/calm
        'eth-yellow': '#0369a1', // Sky 700 - Trustworthy blue
        'eth-red': '#be123c',    // Rose 700 - Urgent but not glaring
        'bg-dark': '#f8fafc',    // Slate 50 - Very light background
        'bg-card': '#ffffff',    // Plain white for cards
        'bg-surface': '#f1f5f9', // Slate 100 for surface elements
        primary: '#0f172a',      // Slate 900 for primary text
        secondary: '#475569',    // Slate 600 for secondary text
        muted: '#94a3b8',        // Slate 400 for muted text
        error: '#e11d48',
        success: '#059669',
      }
    },
  },
  plugins: [],
}
