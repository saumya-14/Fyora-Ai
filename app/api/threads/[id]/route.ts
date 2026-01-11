import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Thread from '@/app/models/Thread';
import Message from '@/app/models/Message';
import Document from '@/app/models/Document';

// GET - Get all messages for a specific thread
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id: threadId } = await params;

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    // Find thread
    const thread = await Thread.findById(threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Get messages for this thread with pagination, sorted by timestamp (oldest first)
    const messages = await Message.find({ threadId: threadId })
      .sort({ timestamp: 1 }) // Oldest first
      .skip(skip)
      .limit(limit)
      .select('_id role content sources webSearchUsed timestamp createdAt')
      .lean();

    // Get total message count for pagination
    const totalMessages = await Message.countDocuments({ threadId: threadId });

    // Populate source document names
    const messagesWithSources = await Promise.all(
      messages.map(async (msg) => {
        if (msg.sources && msg.sources.length > 0) {
          const sourceDocs = await Document.find({
            _id: { $in: msg.sources },
          }).select('originalName');
          return {
            ...msg,
            sourceDocuments: sourceDocs.map((doc) => doc.originalName),
          };
        }
        return {
          ...msg,
          sourceDocuments: [],
        };
      })
    );

    return NextResponse.json({
      thread: {
        id: thread._id.toString(),
        title: thread.title,
        messageCount: thread.messageCount,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      },
      messages: messagesWithSources,
      pagination: {
        total: totalMessages,
        limit,
        skip,
        hasMore: skip + limit < totalMessages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching thread messages:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch thread messages',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a thread and all its messages
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id: threadId } = await params;

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    // Find thread
    const thread = await Thread.findById(threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Delete all messages in this thread
    const deleteMessagesResult = await Message.deleteMany({ threadId: threadId });

    // Delete the thread
    await Thread.findByIdAndDelete(threadId);

    return NextResponse.json({
      message: 'Thread and all messages deleted successfully',
      deletedMessages: deleteMessagesResult.deletedCount,
    });
  } catch (error: any) {
    console.error('Error deleting thread:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete thread',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// PATCH - Update thread title
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id: threadId } = await params;
    const body = await request.json();
    const { title } = body;

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required and must be a string' },
        { status: 400 }
      );
    }

    // Truncate title if too long
    const truncatedTitle = title.length > 200 ? title.substring(0, 200) : title;

    const thread = await Thread.findByIdAndUpdate(
      threadId,
      { title: truncatedTitle },
      { new: true }
    );

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json({
      thread: {
        id: thread._id.toString(),
        title: thread.title,
        messageCount: thread.messageCount,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating thread:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update thread',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

