import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Externalize heavy packages to reduce serverless function size
  serverExternalPackages: [
    'chromadb', 
    '@chroma-core/default-embed',
    '@chroma-core/huggingface-server',
    // LangChain packages
    '@langchain/community',
    '@langchain/core',
    '@langchain/groq',
    '@langchain/openai',
    '@langchain/anthropic',
    '@langchain/textsplitters',
    'langchain',
    // Database packages
    'mongodb',
    'mongoose',
    // Document processing
    'pdf-parse',
    'mammoth',
    // Other heavy packages
    '@huggingface/inference',
    'tavily',
  ],
  
  // Exclude unnecessary files from output tracing
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/linux-x64',
      'node_modules/webpack',
    ],
  },
  
  // Use webpack configuration to handle packages
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark these packages as external to avoid bundling
      config.externals = config.externals || [];
      
      const externalsList = [
        'chromadb',
        '@chroma-core/default-embed',
        '@chroma-core/huggingface-server',
        '@langchain/community',
        '@langchain/core',
        '@langchain/groq',
        '@langchain/openai',
        '@langchain/anthropic',
        '@langchain/textsplitters',
        'langchain',
        'mongodb',
        'mongoose',
        'pdf-parse',
        'mammoth',
        '@huggingface/inference',
        'tavily',
      ];
      
      if (Array.isArray(config.externals)) {
        config.externals.push(...externalsList);
      } else {
        config.externals = [
          config.externals,
          ...externalsList,
        ];
      }
    }
    return config;
  },
  
  // Add empty turbopack config to allow webpack usage
  turbopack: {},
};

export default nextConfig;