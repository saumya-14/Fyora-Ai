// import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
// import { TextLoader } from "@langchain/classic/document_loaders/fs/text"

// import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// import { addDocumentsToChroma } from '../vectorstore/chroma';
// import path from 'path';

// // Initialize text splitter
// const textSplitter = new RecursiveCharacterTextSplitter({
//   chunkSize: 800,
//   chunkOverlap: 200,
//   separators: ['\n\n', '\n', '. ', ' ', ''],
// });

// // Process document using LangChain
// export async function processDocumentWithLangChain(
//   filePath: string,
//   documentId: string,
//   filename: string,
//   fileType: string
// ): Promise<{ chunkCount: number; success: boolean }> {
//   try {
//     let loader: any;

//     const normalizedType = fileType.toLowerCase();
    
//     if (normalizedType.includes('pdf') || normalizedType === 'pdf') {
//       loader = new PDFLoader(filePath);
//     } else if (normalizedType.includes('docx') || normalizedType === 'docx') {
//       loader = new DocxLoader(filePath);
//     } else if (normalizedType.includes('markdown') || normalizedType === 'md') {
//       loader = new TextLoader(filePath);
//     } else if (normalizedType.includes('text') || normalizedType === 'txt') {
//       loader = new TextLoader(filePath);
//     } else {
//       throw new Error(`Unsupported file type: ${fileType}`);
//     }

//     const docs = await loader.load();

//     if (!docs || docs.length === 0) {
//       throw new Error('Document is empty or could not be parsed');
//     }

//     const splitDocs = await textSplitter.splitDocuments(docs);

//     if (splitDocs.length === 0) {
//       throw new Error('No chunks created from document');
//     }

//     const texts: string[] = [];
//     const metadatas: Array<{ documentId: string; chunkIndex: number; filename: string }> = [];
//     const ids: string[] = [];

//     splitDocs.forEach((doc, index) => {
//       texts.push(doc.pageContent);
//       metadatas.push({
//         documentId: documentId,
//         chunkIndex: index,
//         filename: filename,
//         ...(doc.metadata || {}),
//       });
//       ids.push(`${documentId}_chunk_${index}`);
//     });

//     await addDocumentsToChroma(texts, metadatas, ids);

//     return {
//       chunkCount: splitDocs.length,
//       success: true,
//     };
//   } catch (error) {
//     console.error('Error processing document:', error);
//     throw error;
//   }
// }

// // Helper function to get file type
// export function getFileType(mimeType: string, filename: string): string {
//   const extension = path.extname(filename).toLowerCase().slice(1);
  
//   if (extension === 'pdf' || mimeType.includes('pdf')) return 'pdf';
//   if (extension === 'docx' || mimeType.includes('wordprocessingml')) return 'docx';
//   if (extension === 'md' || mimeType.includes('markdown')) return 'md';
//   if (extension === 'txt' || mimeType.includes('text/plain')) return 'txt';
  
//   return extension || mimeType;
// }