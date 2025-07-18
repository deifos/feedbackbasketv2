import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

interface ScrapeRequestBody {
  url: string;
}

// Remove custom FirecrawlResponse interface - use built-in types

interface EnhancedScrapeResponse {
  success: boolean;
  data?: {
    title: string;
    description: string;
    aiDescription: string;
    logoUrl?: string;
    ogImageUrl?: string;
    metadata: Record<string, unknown>;
  };
  error?: string;
}

interface ApiError extends Error {
  status?: number;
}

async function generateAIDescription(markdown: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: `Analyze the following website content and generate a professional, concise description (50-150 words) for a business project.

Focus on:
- What the product/service does
- Who it's for  
- Key value proposition
- Professional tone suitable for business contexts

Website Content:
${markdown}

Generate only the description, no additional text or formatting.`,
    });

    return text.trim();
  } catch (error) {
    console.error('AI description generation failed:', error);
    throw new Error('Failed to generate AI description');
  }
}

function extractProjectMetadata(metadata: Record<string, unknown>) {
  // Helper function to safely extract string values
  const getString = (value: unknown): string => {
    return typeof value === 'string' ? value : '';
  };

  // Extract title - prefer ogTitle, fallback to title
  const title =
    getString(metadata.ogTitle) ||
    getString(metadata['og:title']) ||
    getString(metadata.title) ||
    '';

  // Extract description - prefer ogDescription, fallback to description
  const description =
    getString(metadata.ogDescription) ||
    getString(metadata['og:description']) ||
    getString(metadata.description) ||
    '';

  // Extract OpenGraph image - check multiple possible fields
  const ogImageUrl =
    getString(metadata.ogImage) ||
    getString(metadata['og:image']) ||
    getString(metadata['twitter:image']) ||
    '';

  // Extract favicon/logo URL
  const logoUrl = getString(metadata.favicon) || '';

  return {
    title,
    description,
    ogImageUrl,
    logoUrl,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<EnhancedScrapeResponse>> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: 'API configuration error. Please try again later or contact support.',
      },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as ScrapeRequestBody;
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL provided. Please provide a valid website URL.',
        },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL format. Please provide a valid website URL.',
        },
        { status: 400 }
      );
    }

    console.log('Scraping URL:', url);

    // Initialize Firecrawl with enhanced configuration
    const app = new FirecrawlApp({ apiKey });

    // Scrape the website with enhanced configuration
    const scrapeResult = await app.scrapeUrl(url, {
      formats: ['markdown', 'rawHtml'],
      onlyMainContent: true,
      parsePDF: false,
      maxAge: 14400000, // 4 hours cache
    });

    console.log('Firecrawl response received');

    if (!scrapeResult.success) {
      throw new Error('Failed to scrape website');
    }

    // Extract metadata from the scraped result
    const extractedMetadata = extractProjectMetadata(scrapeResult.metadata || {});

    console.log('Extracted metadata:', extractedMetadata);

    // Generate AI description from markdown content
    let aiDescription = '';
    try {
      if (scrapeResult.markdown && scrapeResult.markdown.trim()) {
        aiDescription = await generateAIDescription(scrapeResult.markdown);
        console.log('AI description generated successfully');
      } else {
        throw new Error('No markdown content available for AI analysis');
      }
    } catch (aiError) {
      console.error('AI description generation failed:', aiError);
      // Fallback to extracted description
      aiDescription = extractedMetadata.description || 'No description available';
    }

    // Prepare the enhanced response
    const enhancedResponse: EnhancedScrapeResponse = {
      success: true,
      data: {
        title: extractedMetadata.title,
        description: extractedMetadata.description,
        aiDescription,
        logoUrl: extractedMetadata.logoUrl || undefined,
        ogImageUrl: extractedMetadata.ogImageUrl || undefined,
        metadata: scrapeResult.metadata || {},
      },
    };

    console.log('Enhanced scrape response prepared');
    return NextResponse.json(enhancedResponse);
  } catch (error: unknown) {
    console.error('Error in enhanced /api/scrape endpoint:', error);

    const err = error as ApiError;
    const errorMessage =
      err.message || 'An error occurred while processing your request. Please try again later.';
    const errorStatus = typeof err.status === 'number' ? err.status : 500;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: errorStatus }
    );
  }
}
