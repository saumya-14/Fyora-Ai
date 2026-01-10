// import { NextRequest, NextResponse } from 'next/server';
// import { writeFile, mkdir } from 'fs/promises';
// import { existsSync } from 'fs';
// import path from 'path';
// import { v4 as uuidv4 } from 'uuid';
// import { processDocumentWithLangChain, getFileType } from '@/app/lib/rag/document-processor';

// // Test document processor with a sample text file
// export async function GET() {
//   try {
//     // Create a test text file
//     const testContent = `This is a test document for the RAG system.
    
// It contains multiple paragraphs to test the chunking functionality.

// The document processor should be able to:
// 1. Parse the text file
// 2. Split it into chunks
// 3. Generate embeddings
// 4. Store them in ChromaDB

// This is the final paragraph of the test document.`;

//     // Create test directory
//     const testDir = path.join(process.cwd(), 'test-uploads');
//     if (!existsSync(testDir)) {
//       await mkdir(testDir, { recursive: true });
//     }

//     // Create test file
//     const documentId = uuidv4();
//     const testFilePath = path.join(testDir, `test-${documentId}.txt`);
//     await writeFile(testFilePath, testContent, 'utf-8');

//     // Process the document
//     const result = await processDocumentWithLangChain(
//       testFilePath,
//       documentId,
//       'test-document.txt',
//       'txt'
//     );

//     return NextResponse.json({
//       success: true,
//       message: 'Document processed successfully!',
//       result: result,
//       filePath: testFilePath,
//     });
//   } catch (error: any) {
//     console.error('❌ Document processor test failed:', error);
//     return NextResponse.json({
//       success: false,
//       error: error.message || 'Unknown error',
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
//     }, { status: 500 });
//   }
// }

// // Test with uploaded file
// export async function POST(request: NextRequest) {
//   try {
//     const formData = await request.formData();
//     const file = formData.get('file') as File;

//     if (!file) {
//       return NextResponse.json({ error: 'No file provided' }, { status: 400 });
//     }

//     // Save file temporarily
//     const uploadsDir = path.join(process.cwd(), 'test-uploads');
//     if (!existsSync(uploadsDir)) {
//       await mkdir(uploadsDir, { recursive: true });
//     }

//     const documentId = uuidv4();
//     const fileExtension = path.extname(file.name);
//     const filename = `test-${documentId}${fileExtension}`;
//     const filePath = path.join(uploadsDir, filename);

//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);
//     await writeFile(filePath, buffer);

//     // Get file type
//     const fileType = getFileType(file.type, file.name);

//     // Process document
//     const result = await processDocumentWithLangChain(
//       filePath,
//       documentId,
//       file.name,
//       fileType
//     );

//     return NextResponse.json({
//       success: true,
//       message: 'File processed successfully!',
//       result: result,
//       filename: file.name,
//       fileType: fileType,
//     });
//   } catch (error: any) {
//     console.error('❌ Document processor test failed:', error);
//     return NextResponse.json({
//       success: false,
//       error: error.message || 'Unknown error',
//     }, { status: 500 });
//   }
// }