import { ChromaClient, EmbeddingFunction } from "chromadb";
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';


const COLLECTION_NAME = 'fyora-documents';

// Create embedding function adapter for ChromaDB
class HuggingFaceEmbeddingFunction implements EmbeddingFunction {
  private embeddings: HuggingFaceInferenceEmbeddings;

  constructor() {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('HUGGINGFACE_API_KEY is not set in environment variables. Get a free key from https://huggingface.co/settings/tokens');
    }
    this.embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: apiKey,
      model: 'sentence-transformers/all-MiniLM-L6-v2',
    });
  }

  async generate(texts: string[]): Promise<number[][]> {
    // Convert LangChain embeddings to ChromaDB format
    return await this.embeddings.embedDocuments(texts);
  }
}

// Initialize embedding function
const embeddingFunction = new HuggingFaceEmbeddingFunction();

// Initialize ChromaDB client (connects to Docker instance)
function getChromaClient() {
  const chromaurl=process.env.CHROMA_SERVER_URL!;
  const url=new URL(chromaurl);
  try {
    return new ChromaClient({
      path: chromaurl,
    });
  } catch {
    // Fallback to parsing
    const url = new URL(chromaurl);
    return new ChromaClient({
      host: url.hostname,
      port: parseInt(url.port || (url.protocol === 'https:' ? '443' : '8000'), 10),
    });
  }
}

// Get or create collection with Hugging Face embeddings
export async function getOrCreateCollection() {
  const client = getChromaClient();
  return await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction: embeddingFunction,
  });
}

// Test connection and basic operations
export async function testChromaDB() {
  try {
    const collection = await getOrCreateCollection();

    // Test: Add a sample document (ChromaDB will use Hugging Face to embed it)
    await collection.add({
      ids: ["test-id-1"],
      documents: ["This is a test document about ChromaDB and Hugging Face embeddings"],
    });

    // Test: Query (ChromaDB will use Hugging Face to embed the query)
    const results = await collection.query({
      queryTexts: ["test query about ChromaDB"],
      nResults: 1,
    });

    // Test: Get count
    const count = await collection.count();

    return {
      success: true,
      message: 'ChromaDB with Hugging Face embeddings is working!',
      collectionName: COLLECTION_NAME,
      documentCount: count,
      queryResults: results.documents?.[0] || [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      hint: 'Make sure ChromaDB Docker container is running and HUGGINGFACE_API_KEY is set',
    };
  }
}

// Helper function to flatten metadata for ChromaDB (only primitives allowed)
function flattenMetadata(metadata: any): Record<string, string | number | boolean | null> {
  const flattened: Record<string, string | number | boolean | null> = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) {
      flattened[key] = null;
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      flattened[key] = value;
    } else if (Array.isArray(value)) {
      // Convert arrays to comma-separated string
      flattened[key] = value.join(', ');
    } else if (typeof value === 'object') {
      // Convert objects to JSON string
      flattened[key] = JSON.stringify(value);
    } else {
      // Convert anything else to string
      flattened[key] = String(value);
    }
  }
  
  return flattened;
}

// Add documents to ChromaDB (embeddings generated automatically via Hugging Face)
export async function addDocumentsToChroma(
  texts: string[],
  metadatas: Array<Record<string, string | number | boolean | null>>,
  ids?: string[]
): Promise<void> {
  const collection = await getOrCreateCollection();
  
  // Flatten all metadata to ensure ChromaDB compatibility
  const flattenedMetadatas = metadatas.map(meta => flattenMetadata(meta));
  
  await collection.add({
    ids: ids || texts.map((_, i) => `doc_${Date.now()}_${i}`),
    documents: texts,
    metadatas: flattenedMetadatas,
  });
}

// Query similar documents (query embedded via Hugging Face automatically)
export async function querySimilarDocuments(
  query: string,
  k: number = 5,
  filter?: { documentId?: string }
): Promise<Array<{ text: string; metadata: any; distance: number }>> {
  const collection = await getOrCreateCollection();
  
  const results = await collection.query({
    queryTexts: [query],
    nResults: k,
    where: filter?.documentId ? { documentId: filter.documentId } : undefined,
  });
  
  if (!results.documents || !results.documents[0]) {
    return [];
  }
  
  return results.documents[0].map((doc, i) => ({
    text: doc || '',
    metadata: results.metadatas?.[0]?.[i] || {},
    distance: results.distances?.[0]?.[i] || 0,
  }));
}

// Delete documents by documentId
export async function deleteDocumentsByDocumentId(documentId: string): Promise<void> {
  const collection = await getOrCreateCollection();

  const results = await collection.get({
    where: { documentId: documentId },
  });

  if (results.ids && results.ids.length > 0) {
    await collection.delete({
      ids: results.ids,
    });
  }
}

// Get collection stats
export async function getCollectionStats() {
  try {
    const collection = await getOrCreateCollection();
    const count = await collection.count();
    return {
      collectionName: COLLECTION_NAME,
      documentCount: count,
    };
  } catch (error: any) {
    return {
      collectionName: COLLECTION_NAME,
      documentCount: 0,
      error: error.message,
    };
  }
}
