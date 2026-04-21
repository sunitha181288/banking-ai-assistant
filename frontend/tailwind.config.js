/** @type {import('tailwindcss').Config} */
module.exports = {
  // THIS is the critical part — tells Tailwind which files to scan
  // If a file isn't listed here, its classes get removed in production
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/hooks/**/*.{js,jsx,ts,tsx}",
    "./src/styles/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        fadeUp: "fadeUp 0.25s ease",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: 0, transform: "translateY(6px)" },
          "100%": { opacity: 1, transform: "translateY(0)"   },
        },
      },
    },
  },
  plugins: [],
};
