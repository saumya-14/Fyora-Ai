import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ message: 'Database connected successfully!' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}