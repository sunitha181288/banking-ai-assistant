// frontend/next.config.js
// ──────────────────────────────────────────────
// WHAT THIS FILE DOES:
// Configures the Next.js framework.
// Sets up environment variables and any build settings.
// ──────────────────────────────────────────────

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,  // helps catch bugs in development

  // Environment variables available in the browser
  // Variables starting with NEXT_PUBLIC_ are exposed to frontend
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  },
};

module.exports = nextConfig;
