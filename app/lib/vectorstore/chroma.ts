// import { ChromaClient, CloudClient } from 'chromadb';
// import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
// import path from 'path';


// const CHROMA_DB_PATH = process.env.CHROMA_DB_PATH || path.join(process.cwd(), 'chroma_db');
// const COLLECTION_NAME = 'fyora-documents';

// // Ensure directory exists

// const client = new CloudClient({
//   apiKey: 'ck-H9zwKdR4K6pgTYkZmZULb33Hh7NDd97cup8JhQTnEoFz',
//   tenant: '20f26134-c239-49e8-9eff-7681b1a83281',
//   database: 'fyora'
// });
// // Initialize embeddings
// export function getEmbeddings() {
//   const apiKey = process.env.HUGGINGFACE_API_KEY;
  
//   if (!apiKey) {
//     throw new Error('HUGGINGFACE_API_KEY is not set in environment variables. Get a free key from https://huggingface.co/settings/tokens');
//   }
//   return new HuggingFaceInferenceEmbeddings({
//     apiKey: apiKey,
//     model: 'sentence-transformers/all-MiniLM-L6-v2',
//   });
// }

// // Get Chroma client for local persistent storage (v2 supports path)
// function getChromaClient() {
//   return new ChromaClient({
//     host: 'localhost',
//     port: 8000,
//   });
// }

// // Get or create collection
// async function getOrCreateCollection() {
//   const client = getChromaClient();
//   return await client.getOrCreateCollection({ name: COLLECTION_NAME });
// }

// // Add documents to ChromaDB
// export async function addDocumentsToChroma(
//   texts: string[],
//   metadatas: Array<{ documentId: string; chunkIndex: number; filename?: string }>,
//   ids?: string[]
// ): Promise<void> {
//   const embeddings = getEmbeddings();
//   const collection = await getOrCreateCollection();
  
//   // Generate embeddings
//   const embeddingsData = await embeddings.embedDocuments(texts);
  
//   // Add to ChromaDB
//   await collection.add({
//     ids: ids || texts.map((_, i) => `doc_${Date.now()}_${i}`),
//     embeddings: embeddingsData,
//     documents: texts,
//     metadatas: metadatas,
//   });
// }

// // Query similar documents
// export async function querySimilarDocuments(
//   query: string,
//   k: number = 5,
//   filter?: { documentId?: string }
// ): Promise<Array<{ text: string; metadata: any; distance: number }>> {
//   const embeddings = getEmbeddings();
//   const collection = await getOrCreateCollection();
  
//   // Generate query embedding
//   const queryEmbedding = await embeddings.embedQuery(query);
  
//   // Build where clause if filter provided
//   const where = filter?.documentId ? { documentId: filter.documentId } : undefined;
  
//   // Query ChromaDB
//   const results = await collection.query({
//     queryEmbeddings: [queryEmbedding],
//     nResults: k,
//     where: where,
//   });
  
//   // Format results
//   if (!results.documents || !results.documents[0]) {
//     return [];
//   }
  
//   return results.documents[0].map((doc, i) => ({
//     text: doc || '',
//     metadata: results.metadatas?.[0]?.[i] || {},
//     distance: results.distances?.[0]?.[i] || 0,
//   }));
// }

// // Delete documents by documentId
// export async function deleteDocumentsByDocumentId(documentId: string): Promise<void> {
//   const collection = await getOrCreateCollection();

//   const results = await collection.get({
//     where: { documentId: documentId },
//   });

//   if (results.ids && results.ids.length > 0) {
//     await collection.delete({
//       ids: results.ids,
//     });
//   }
// }

// // Get collection stats
// export async function getCollectionStats() {
//   try {
//     const collection = await getOrCreateCollection();
//     const count = await collection.count();
//     return {
//       collectionName: COLLECTION_NAME,
//       documentCount: count,
//     };
//   } catch (error: any) {
//     return {
//       collectionName: error.message,
//       documentCount: 0,
//     };
//   }
// }
import { ChromaClient } from "chromadb";

// Initialize the cloud client
export const chromaClient = new ChromaClient({
    path: process.env.CHROMA_SERVER_URL,
    // Authentication is required for cloud
    fetchOptions: {
        headers: {
            "Authorization": `Bearer ${process.env.CHROMA_API_KEY}`,
            "X-Chroma-Tenant": process.env.CHROMA_TENANT!,
        }
    }
});

export const getCollection = async (name: string) => {
    return await chromaClient.getOrCreateCollection({
        name: name,
        // Ensure you have an embedding function defined
    });
};