/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        'primary-hover': '#2563eb',
        bg: '#f8fafc',
        surface: '#ffffff',
        border: '#e2e8f0',
        text: '#0f172a',
        'text-secondary': '#64748b',
        danger: '#ef4444',
        success: '#22c55e',
        warning: '#f59e0b',
        accent: '#8b5cf6'
      }
    },
  },
  plugins: [],
}
