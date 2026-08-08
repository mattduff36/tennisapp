import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Playwright/local tooling that hits the IP form of loopback.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
