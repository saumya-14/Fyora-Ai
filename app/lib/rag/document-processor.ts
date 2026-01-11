import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { addDocumentsToChroma } from '../vectorstore/chroma';
import path from 'path';
import { readFile } from 'fs/promises';
import { Document } from '@langchain/core/documents';

// Initialize text splitter
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', '. ', ' ', ''],
});

// Process document using LangChain
export async function processDocumentWithLangChain(
  filePath: string,
  documentId: string,
  filename: string,
  fileType: string
): Promise<{ chunkCount: number; success: boolean }> {
  try {
    let loader: any;

    const normalizedType = fileType.toLowerCase();
    
    let docs: Document[];

    if (normalizedType.includes('pdf') || normalizedType === 'pdf') {
      loader = new PDFLoader(filePath);
      docs = await loader.load();
    } else if (normalizedType.includes('docx') || normalizedType === 'docx') {
      loader = new DocxLoader(filePath);
      docs = await loader.load();
    } else if (normalizedType.includes('markdown') || normalizedType === 'md' || normalizedType.includes('text') || normalizedType === 'txt') {
      // Handle text/markdown files directly
      const content = await readFile(filePath, 'utf-8');
      docs = [new Document({ pageContent: content, metadata: { source: filename } })];
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    if (!docs || docs.length === 0) {
      throw new Error('Document is empty or could not be parsed');
    }

    const splitDocs = await textSplitter.splitDocuments(docs);

    if (splitDocs.length === 0) {
      throw new Error('No chunks created from document');
    }

    const texts: string[] = [];
    const metadatas: Array<Record<string, string | number | boolean | null>> = [];
    const ids: string[] = [];

    splitDocs.forEach((doc, index) => {
      texts.push(doc.pageContent);
      
      // Extract only primitive values from doc.metadata to avoid nested objects
      const docMetadata = doc.metadata || {};
      const cleanMetadata: Record<string, string | number | boolean | null> = {
        documentId: documentId,
        chunkIndex: index,
        filename: filename,
      };
      
      // Only include primitive metadata values
      for (const [key, value] of Object.entries(docMetadata)) {
        if (value === null || value === undefined) {
          cleanMetadata[key] = null;
        } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          cleanMetadata[key] = value;
        } else if (typeof value === 'object') {
          // Convert objects/arrays to string representation
          cleanMetadata[key] = JSON.stringify(value);
        } else {
          cleanMetadata[key] = String(value);
        }
      }
      
      metadatas.push(cleanMetadata);
      ids.push(`${documentId}_chunk_${index}`);
    });

    // Add to ChromaDB (Hugging Face embeddings will be generated automatically)
    await addDocumentsToChroma(texts, metadatas, ids);

    return {
      chunkCount: splitDocs.length,
      success: true,
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

// Helper function to get file type
export function getFileType(mimeType: string, filename: string): string {
  const extension = path.extname(filename).toLowerCase().slice(1);
  
  if (extension === 'pdf' || mimeType.includes('pdf')) return 'pdf';
  if (extension === 'docx' || mimeType.includes('wordprocessingml')) return 'docx';
  if (extension === 'md' || mimeType.includes('markdown')) return 'md';
  if (extension === 'txt' || mimeType.includes('text/plain')) return 'txt';
  
  return extension || mimeType;
}
