import { TavilyClient } from 'tavily';

/**
 * Web Search using Tavily
 * Fallback when no documents are found in the knowledge base
 */

interface WebSearchResult {
  content: string;
  sources: string[];
  success: boolean;
}

/**
 * Search the web using Tavily
 * @param query - Search query
 * @param maxResults - Maximum number of results (default: 3)
 * @returns WebSearchResult with formatted content and sources
 */
export async function searchWeb(
  query: string,
  maxResults: number = 3
): Promise<WebSearchResult> {
  try {
    const apiKey = process.env.TAVILY_API_KEY;
    
    if (!apiKey) {
      console.warn('TAVILY_API_KEY not set. Web search disabled.');
      return {
        content: '',
        sources: [],
        success: false,
      };
    }

    // Initialize Tavily client
    const client = new TavilyClient({ apiKey: apiKey });

    // Search the web - pass options as a single object
    const response = await client.search({
      query: query,
      max_results: maxResults,
      include_answer: true,
      include_raw_content: false,
    });

    if (!response || !response.results || response.results.length === 0) {
      return {
        content: 'No relevant web search results found.',
        sources: [],
        success: false,
      };
    }

    // Extract sources (URLs)
    const sources = Array.from(
      new Set(
        response.results
          .map((result: any) => result.url)
          .filter((url: any): url is string => Boolean(url))
      )
    );

    // Format content for LLM
    const content = formatWebSearchResults(response.results, response.answer);

    return {
      content,
      sources,
      success: true,
    };
  } catch (error: any) {
    console.error('Web search error:', error);
    return {
      content: 'Error performing web search.',
      sources: [],
      success: false,
    };
  }
}

/**
 * Format web search results for LLM context
 * @param results - Array of search results from Tavily
 * @param answer - Optional answer from Tavily
 * @returns Formatted string
 */
function formatWebSearchResults(results: any[], answer?: string): string {
  if (results.length === 0) {
    return 'No web search results available.';
  }

  const parts: string[] = [];
  parts.push('=== WEB SEARCH RESULTS ===\n');

  // Include answer if available
  if (answer) {
    parts.push(`\nSummary Answer: ${answer}\n`);
  }

  // Add individual results
  results.forEach((result, index) => {
    const url = result.url || 'Unknown source';
    const title = result.title || `Result ${index + 1}`;
    const content = result.content || result.rawContent || '';
    
    parts.push(`\n--- Source ${index + 1}: ${title} ---`);
    parts.push(`URL: ${url}\n`);
    if (content) {
      parts.push(`${content.trim()}\n`);
    }
  });

  parts.push('\n=== END OF WEB SEARCH RESULTS ===\n');
  parts.push(
    '\nInstructions: Use the above web search results to answer the user\'s question. ' +
      'Cite the source URLs when referencing information from web search.\n'
  );

  return parts.join('\n');
}

