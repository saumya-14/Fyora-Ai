// import { NextResponse } from 'next/server';
// import { getCollectionStats, getEmbeddings, addDocumentsToChroma, querySimilarDocuments } from '@/app/lib/vectorstore/chroma';

// // Test ChromaDB connection and basic operations
// export async function GET() {
//   try {
//     // Test 1: Check embeddings initialization
//     const embeddings = getEmbeddings();
//     console.log('✅ Embeddings initialized');

//     // Test 2: Get collection stats
//     const stats = await getCollectionStats();
//     console.log('✅ Collection stats:', stats);

//     return NextResponse.json({
//       success: true,
//       message: 'ChromaDB is working!',
//       stats: stats,
//       embeddings: 'Initialized successfully',
//     });
//   } catch (error: any) {
//     console.error('❌ ChromaDB test failed:', error);
//     return NextResponse.json({
//       success: false,
//       error: error.message || 'Unknown error',
//       hint: 'Make sure HUGGINGFACE_API_KEY is set in .env.local',
//     }, { status: 500 });
//   }
// }

// // Test adding and querying documents
// export async function POST() {
//   try {
//     // Test adding sample documents
//     const testTexts = [
//       'This is a test document about artificial intelligence.',
//       'Machine learning is a subset of AI that focuses on data.',
//       'Natural language processing helps computers understand human language.',
//     ];

//     const testMetadatas = [
//       { documentId: 'test-doc-1', chunkIndex: 0, filename: 'test.txt' },
//       { documentId: 'test-doc-1', chunkIndex: 1, filename: 'test.txt' },
//       { documentId: 'test-doc-1', chunkIndex: 2, filename: 'test.txt' },
//     ];

//     const testIds = ['test-1', 'test-2', 'test-3'];

//     await addDocumentsToChroma(testTexts, testMetadatas, testIds);
//     console.log('✅ Documents added to ChromaDB');

//     // Test querying
//     const results = await querySimilarDocuments('What is AI?', 2);
//     console.log('✅ Query results:', results);

//     return NextResponse.json({
//       success: true,
//       message: 'Test documents added and queried successfully',
//       added: testTexts.length,
//       queryResults: results,
//     });
//   } catch (error: any) {
//     console.error('❌ Test failed:', error);
//     return NextResponse.json({
//       success: false,
//       error: error.message || 'Unknown error',
//     }, { status: 500 });
//   }
// }