import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  serverExternalPackages: [
    'chromadb', 
    '@chroma-core/default-embed',
    '@chroma-core/huggingface-server'
  ],
  
  // Use webpack configuration to handle ChromaDB packages
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark these packages as external to avoid bundling issues
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('@chroma-core/default-embed');
        config.externals.push('@chroma-core/huggingface-server');
      } else {
        config.externals = [
          config.externals,
          '@chroma-core/default-embed',
          '@chroma-core/huggingface-server',
        ];
      }
    }
    return config;
  },
  
  // Add empty turbopack config to allow webpack usage
  turbopack: {},
};

export default nextConfig;
