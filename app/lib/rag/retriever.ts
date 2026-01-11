import { querySimilarDocuments } from '../vectorstore/chroma';

/**
 * RAG Retriever - Retrieves relevant document chunks from ChromaDB
 * and formats them as context for the LLM
 */

export interface RetrievedChunk {
  text: string;
  metadata: {
    documentId?: string;
    chunkIndex?: number;
    filename?: string;
    [key: string]: any;
  };
  distance: number; // Lower distance = more relevant
  score: number; // Similarity score (0-1, higher = more relevant)
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  context: string; // Formatted context for LLM
  sources: string[]; // List of unique source filenames
  totalChunks: number;
}

/**
 * Retrieves relevant document chunks based on user query
 * @param query - User's question/query
 * @param k - Number of chunks to retrieve (default: 5)
 * @param documentId - Optional: filter by specific document
 * @returns RetrievalResult with formatted context
 */
export async function retrieveRelevantChunks(
  query: string,
  k: number = 5,
  documentId?: string
): Promise<RetrievalResult> {
  try {
    // Query ChromaDB for similar documents
    const results = await querySimilarDocuments(query, k, documentId ? { documentId } : undefined);

    if (!results || results.length === 0) {
      return {
        chunks: [],
        context: 'No relevant documents found in the knowledge base.',
        sources: [],
        totalChunks: 0,
      };
    }

    // Convert distance to similarity score (lower distance = higher similarity)
    // Distance is typically 0-2, we convert to 0-1 score
    const chunks: RetrievedChunk[] = results.map((result) => ({
      text: result.text,
      metadata: result.metadata || {},
      distance: result.distance,
      score: Math.max(0, 1 - result.distance / 2), // Convert distance to 0-1 score
    }));

    // Filter out very low relevance chunks (score < 0.3)
    const relevantChunks = chunks.filter((chunk) => chunk.score >= 0.3);

    if (relevantChunks.length === 0) {
      return {
        chunks: [],
        context: 'No highly relevant documents found. The query may not match the uploaded documents.',
        sources: [],
        totalChunks: 0,
      };
    }

    // Extract unique source filenames
    const sources = Array.from(
      new Set(
        relevantChunks
          .map((chunk) => chunk.metadata.filename)
          .filter((filename): filename is string => Boolean(filename))
      )
    );

    // Format context for LLM
    const context = formatContextForLLM(relevantChunks);

    return {
      chunks: relevantChunks,
      context,
      sources,
      totalChunks: relevantChunks.length,
    };
  } catch (error: any) {
    console.error('Error retrieving chunks:', error);
    return {
      chunks: [],
      context: 'Error retrieving relevant documents from the knowledge base.',
      sources: [],
      totalChunks: 0,
    };
  }
}

/**
 * Formats retrieved chunks into a readable context string for the LLM
 * @param chunks - Array of retrieved chunks
 * @returns Formatted context string
 */
function formatContextForLLM(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return 'No relevant context available.';
  }

  // Group chunks by document for better organization
  const chunksByDocument = new Map<string, RetrievedChunk[]>();

  chunks.forEach((chunk) => {
    const docId = chunk.metadata.documentId || 'unknown';
    if (!chunksByDocument.has(docId)) {
      chunksByDocument.set(docId, []);
    }
    chunksByDocument.get(docId)!.push(chunk);
  });

  // Build formatted context
  const contextParts: string[] = [];

  contextParts.push('=== RELEVANT DOCUMENT CONTEXT ===\n');

  chunksByDocument.forEach((docChunks, docId) => {
    const filename = docChunks[0]?.metadata.filename || 'Unknown Document';
    contextParts.push(`\n--- Source: ${filename} ---\n`);

    // Sort chunks by chunkIndex if available, otherwise by score
    const sortedChunks = docChunks.sort((a, b) => {
      const indexA = a.metadata.chunkIndex ?? Infinity;
      const indexB = b.metadata.chunkIndex ?? Infinity;
      if (indexA !== Infinity && indexB !== Infinity) {
        return indexA - indexB;
      }
      return b.score - a.score; // Higher score first
    });

    sortedChunks.forEach((chunk, idx) => {
      contextParts.push(`[Chunk ${idx + 1}] ${chunk.text.trim()}\n`);
    });
  });

  contextParts.push('\n=== END OF CONTEXT ===\n');
  contextParts.push(
    '\nInstructions: Use the above context to answer the user\'s question. ' +
      'If the context doesn\'t contain enough information, say so. ' +
      'Cite the source document when referencing specific information.\n'
  );

  return contextParts.join('\n');
}

/**
 * Retrieves chunks with a minimum relevance threshold
 * @param query - User's question/query
 * @param minScore - Minimum similarity score (0-1)
 * @param maxChunks - Maximum number of chunks to return
 * @returns RetrievalResult with filtered chunks
 */
export async function retrieveWithThreshold(
  query: string,
  minScore: number = 0.5,
  maxChunks: number = 5
): Promise<RetrievalResult> {
  // Get more chunks initially to filter by threshold
  const initialK = Math.max(maxChunks * 2, 10);
  const result = await retrieveRelevantChunks(query, initialK);

  // Filter by minimum score
  const filteredChunks = result.chunks.filter((chunk) => chunk.score >= minScore);

  // Limit to maxChunks
  const limitedChunks = filteredChunks.slice(0, maxChunks);

  if (limitedChunks.length === 0) {
    return {
      chunks: [],
      context: `No documents found with sufficient relevance (minimum score: ${minScore}).`,
      sources: [],
      totalChunks: 0,
    };
  }

  // Reformat context with filtered chunks
  const context = formatContextForLLM(limitedChunks);
  const sources = Array.from(
    new Set(
      limitedChunks
        .map((chunk) => chunk.metadata.filename)
        .filter((filename): filename is string => Boolean(filename))
    )
  );

  return {
    chunks: limitedChunks,
    context,
    sources,
    totalChunks: limitedChunks.length,
  };
}

