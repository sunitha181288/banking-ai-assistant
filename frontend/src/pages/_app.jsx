// frontend/src/pages/_app.jsx
// ──────────────────────────────────────────────
// WHAT THIS FILE DOES:
// Next.js requires this file — it wraps EVERY page.
// Think of it as the "frame" around all your pages.
// Global CSS is imported here so it applies everywhere.
// ──────────────────────────────────────────────

import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  // Component = the current page being rendered (ChatPage, PromptLab, etc.)
  // pageProps = any props passed to that page
  return <Component {...pageProps} />;
}
