
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';

import { ChromaClient, EmbeddingFunction } from "chromadb";

// Initialize the cloud client
export const chromaClient = new ChromaClient({
    path:process.env.HUGGINGFACE_API_KEY,
    // Authentication is required for cloud
    fetchOptions: {
        headers: {
            "Authorization": `Bearer ${process.env.CHROMA_API_KEY}`,
            "X-Chroma-Tenant": process.env.CHROMA_TENANT!,
        }
    }
});

const embedder = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACE_API_KEY!,
  // Standard model for 2026
  model: 'sentence-transformers/all-MiniLM-L6-v2',
});

export const getCollection = async (name: string) => {
  return await chromaClient.getOrCreateCollection({
      name: name,
      embeddingFunction: embedder as any, // Now this matches the expected type
  });
};