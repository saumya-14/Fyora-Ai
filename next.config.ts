import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  serverExternalPackages: ['chromadb', '@chroma-core/default-embed'],
  // Add empty turbopack config to silence the warning
  turbopack: {},
};

export default nextConfig;
