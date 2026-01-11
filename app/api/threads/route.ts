import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Thread from '@/app/models/Thread';
import Message from '@/app/models/Message';

// GET - List all threads (conversations)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Get all threads sorted by most recently updated
    const threads = await Thread.find({})
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('_id title createdAt updatedAt messageCount')
      .lean();

    // Get total count for pagination
    const totalCount = await Thread.countDocuments({});

    return NextResponse.json({
      threads,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch threads',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// POST - Create a new thread
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required and must be a string' },
        { status: 400 }
      );
    }

    // Truncate title if too long
    const truncatedTitle = title.length > 200 ? title.substring(0, 200) : title;

    const thread = await Thread.create({
      title: truncatedTitle,
      messageCount: 0,
    });

    return NextResponse.json(
      {
        thread: {
          id: thread._id.toString(),
          title: thread.title,
          messageCount: thread.messageCount,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating thread:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create thread',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

