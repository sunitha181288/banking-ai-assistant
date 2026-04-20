// frontend/next.config.js
// ──────────────────────────────────────────────
// Updated for Next.js 15.5.15 — patched version that fixes:
// - GHSA-9g9p-9gw9-jx7f (Image Optimizer DoS)
// - GHSA-h25m-26qc-wcjf (HTTP request deserialization DoS)
// - GHSA-ggv3-7p47-pfv8 (HTTP request smuggling)
// - GHSA-3x4c-7xq6-9pq8 (Unbounded image disk cache)
// - GHSA-q4gf-8mx6-v5v3 (Server Components DoS)
// ──────────────────────────────────────────────

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Next.js 15: experimental.appDir is now stable, no longer needed
  // Images: lock down remotePatterns to prevent CVE-2024-34351 style issues
  images: {
    remotePatterns: [], // no external image sources needed — add only if required
  },

  // Environment variables available in the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  },

  // Next.js 15: output standalone is recommended for Docker deployments
  output: "standalone",
};

module.exports = nextConfig;
