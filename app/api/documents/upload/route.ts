import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/app/lib/db/mongodb';
import Document from '@/app/models/Document';
import { processDocumentWithLangChain, getFileType } from '@/app/lib/rag/document-processor';

export async function POST(request: NextRequest) {

  try {
    await connectDB();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const fileType = getFileType(file.type, file.name);
    const allowedTypes = ['pdf', 'txt', 'docx', 'md'];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Supported: PDF, TXT, DOCX, MD' 
      }, { status: 400 });
    }

     // Use /tmp for Vercel compatibility 
    const uploadsDir = '/tmp/uploads';
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const documentId = uuidv4();
    const fileExtension = path.extname(file.name);
    const filename = `${documentId}${fileExtension}`;
    const filePath = path.join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Process document (chunk and embed using Hugging Face)
    const { chunkCount } = await processDocumentWithLangChain(
      filePath,
      documentId,
      file.name,
      fileType
    );

    // Save document metadata to MongoDB
    const document = await Document.create({
      filename: filename,
      originalName: file.name,
      fileType: fileType,
      chunkCount: chunkCount,
      vectorStoreId: documentId,
    });

    return NextResponse.json({
      message: 'Document uploaded and processed successfully!',
      document: {
        id: document._id,
        filename: file.name,
        chunkCount,
        documentId: documentId,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process document',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

