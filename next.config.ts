import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-a3f6cc6b-90ec-4d6f-a939-428a1ebb3121.space.z.ai',
    '.space.z.ai',
    'localhost',
  ],
};

export default nextConfig;
