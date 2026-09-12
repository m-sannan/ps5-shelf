import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "0.0.0.0",
    "::1",
    "*.cursor.sh",
    "*.cursor.com",
  ],
};

export default nextConfig;
