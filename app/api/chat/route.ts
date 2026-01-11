import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/db/mongodb';
import Thread from '@/app/models/Thread';
import Message from '@/app/models/Message';
import Document from '@/app/models/Document';
import { retrieveRelevantChunks } from '@/app/lib/rag/retriever';
import { ChatGroq } from '@langchain/groq';
import { searchWeb } from '@/app/lib/web-search';

// Initialize Groq LLM
function getGroqLLM() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in environment variables. Get a free key from https://console.groq.com/');
  }
  
  return new ChatGroq({
    apiKey: apiKey,
    model: 'llama-3.3-70b-versatile', // Fast and free model
    temperature: 0.7,
  });
}

// System prompt for RAG
const SYSTEM_PROMPT = `You are a helpful AI assistant with access to a knowledge base of uploaded documents and web search capabilities.

Your role:
- Answer questions based on the provided context from the documents or web search results
- If the context doesn't contain enough information, say so clearly
- Cite the source document or URL when referencing specific information
- Be concise but thorough
- When using web search results, cite the source URLs
- Prioritize information from uploaded documents over web search when both are available

Always format your response clearly and cite sources when possible.`;

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { message, threadId, documentId, enableWebSearch = true } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Get or create thread
    let thread;
    if (threadId) {
      thread = await Thread.findById(threadId);
      if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
      }
    } else {
      // Create new thread with first message as title (truncated)
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
      thread = await Thread.create({
        title: title,
        messageCount: 0,
      });
    }

    // Save user message
    const userMessage = await Message.create({
      threadId: thread._id,
      role: 'user',
      content: message,
      sources: [],
      webSearchUsed: false,
    });

    // Retrieve relevant chunks using RAG
    const retrievalResult = await retrieveRelevantChunks(
      message,
      5, // Get top 5 chunks
      documentId
    );

    // Get document IDs from sources
    const sourceDocumentIds: mongoose.Types.ObjectId[] = [];
    if (retrievalResult.sources.length > 0) {
      const sourceDocs = await Document.find({
        originalName: { $in: retrievalResult.sources },
      });
      sourceDocumentIds.push(...sourceDocs.map((doc) => doc._id));
    }

    // Web search if enabled (regardless of whether documents are found)
    let webSearchResult = null;
    let webSearchUsed = false;
    
    if (enableWebSearch) {
      // Perform web search if enabled (even if documents are found)
      webSearchResult = await searchWeb(message, 3);
      webSearchUsed = webSearchResult.success;
    }

    // Build prompt with context
    let prompt = SYSTEM_PROMPT + '\n\n';
    
    // Combine RAG context and web search results if both are available
    if (retrievalResult.totalChunks > 0 && webSearchResult && webSearchResult.success) {
      // Both RAG and web search available - combine them
      prompt += '=== DOCUMENT CONTEXT (from uploaded documents) ===\n\n';
      prompt += retrievalResult.context + '\n\n';
      prompt += '=== WEB SEARCH RESULTS ===\n\n';
      prompt += webSearchResult.content + '\n\n';
      prompt += `User Question: ${message}\n\n`;
      prompt += `Please answer the user's question using BOTH the document context and web search results provided above. `;
      prompt += `Prioritize information from uploaded documents when available, but also incorporate relevant information from web search. `;
      prompt += `Cite the source documents or URLs when referencing specific information.`;
    } else if (retrievalResult.totalChunks > 0) {
      // Only RAG context available
      prompt += retrievalResult.context + '\n\n';
      prompt += `User Question: ${message}\n\n`;
      prompt += `Please answer the user's question based on the context provided above from the uploaded documents.`;
    } else if (webSearchResult && webSearchResult.success) {
      // Only web search results available
      prompt += webSearchResult.content + '\n\n';
      prompt += `User Question: ${message}\n\n`;
      prompt += `Please answer the user's question based on the web search results provided above. Cite the source URLs when referencing information.`;
    } else {
      // No context available
      prompt += `User Question: ${message}\n\n`;
      if (enableWebSearch) {
        prompt += `Note: No relevant documents were found in the knowledge base and web search did not return results. `;
      } else {
        prompt += `Note: No relevant documents were found in the knowledge base and web search is disabled by the user. `;
      }
      prompt += `Please inform the user that you don't have relevant information to answer this question.`;
    }

    // Get conversation history (last 5 messages for context)
    const conversationHistory = await Message.find({
      threadId: thread._id,
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .select('role content');

    // Build messages array for LLM
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: prompt },
    ];

    // Add conversation history (reverse to get chronological order)
    conversationHistory.reverse().forEach((msg) => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    });

    // Generate response using Groq
    const llm = getGroqLLM();
    const response = await llm.invoke(messages);

    const assistantResponse = response.content as string;

    // Save assistant message
    const assistantMessage = await Message.create({
      threadId: thread._id,
      role: 'assistant',
      content: assistantResponse,
      sources: sourceDocumentIds,
      webSearchUsed: webSearchUsed,
    });

    // Update thread message count
    thread.messageCount = await Message.countDocuments({ threadId: thread._id });
    await thread.save();

    // Combine sources from both RAG and web search
    const allSources = [
      ...retrievalResult.sources,
      ...(webSearchUsed && webSearchResult?.sources ? webSearchResult.sources : [])
    ];

    return NextResponse.json({
      message: assistantResponse,
      threadId: thread._id.toString(),
      sources: allSources,
      chunkCount: retrievalResult.totalChunks,
      webSearchUsed: webSearchUsed,
      messageId: assistantMessage._id.toString(),
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate response',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

