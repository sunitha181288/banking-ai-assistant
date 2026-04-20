// frontend/postcss.config.js
// ──────────────────────────────────────────────
// WHAT THIS FILE DOES:
// PostCSS processes your CSS files.
// Tailwind CSS runs as a PostCSS plugin —
// this file tells PostCSS to use Tailwind and Autoprefixer.
// Without this file, Tailwind classes won't work.
// ──────────────────────────────────────────────

module.exports = {
  plugins: {
    tailwindcss: {},   // processes @tailwind directives in globals.css
    autoprefixer: {},  // adds vendor prefixes for browser compatibility
  },
};
