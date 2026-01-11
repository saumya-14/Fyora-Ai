import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Document from '@/app/models/Document';

export async function GET() {
  try {
    await connectDB();
    const documents = await Document.find({})
      .sort({ uploadedAt: -1 })
      .select('_id originalName fileType uploadedAt chunkCount');
    
    return NextResponse.json({ documents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

