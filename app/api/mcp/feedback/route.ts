import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, getAccessibleProjectIds, hasProjectAccess } from '@/lib/mcp-auth';
import { handleApiError, logError } from '@/lib/error-handler';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Query parameters schema
const feedbackQuerySchema = z.object({
  projectId: z.string().optional(),
  category: z.enum(['BUG', 'FEATURE', 'REVIEW']).optional(),
  status: z.enum(['PENDING', 'REVIEWED', 'DONE']).optional(),
  sentiment: z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  includeNotes: z.coerce.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate using API key
    const apiKey = await authenticateApiKey(request);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    // Parse request body for query parameters
    const body = await request.json();
    const queryResult = feedbackQuerySchema.safeParse(body);
    
    if (!queryResult.success) {
      const errors = queryResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { projectId, category, status, sentiment, limit, offset, search, includeNotes } = queryResult.data;

    // Get accessible project IDs
    const accessibleProjectIds = getAccessibleProjectIds(apiKey);
    
    if (accessibleProjectIds.length === 0) {
      return NextResponse.json({ 
        feedback: [],
        totalCount: 0,
        message: 'No projects configured for this API key' 
      });
    }

    // If specific project requested, verify access
    if (projectId && !hasProjectAccess(apiKey, projectId)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'API key does not have access to this project' },
        { status: 403 }
      );
    }

    // Build where clause
    const whereClause: any = {
      projectId: projectId ? projectId : { in: accessibleProjectIds },
      isVisible: true, // Only return visible feedback based on subscription limits
    };

    // Add filters
    if (category) {
      whereClause.OR = [
        { category: category },
        { manualCategory: category },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (sentiment) {
      whereClause.OR = whereClause.OR ? [
        ...whereClause.OR,
        { sentiment: sentiment },
        { manualSentiment: sentiment },
      ] : [
        { sentiment: sentiment },
        { manualSentiment: sentiment },
      ];
    }

    if (search) {
      whereClause.content = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.feedback.count({
      where: whereClause,
    });

    // Fetch feedback with project info
    const feedback = await prisma.feedback.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Transform data for MCP response
    const transformedFeedback = feedback.map(item => ({
      id: item.id,
      content: item.content,
      email: item.email,
      status: item.status,
      ...(includeNotes && { notes: item.notes }),
      
      // Category (prefer manual override)
      category: item.manualCategory || item.category,
      categorySource: item.categoryOverridden ? 'manual' : 'ai',
      categoryConfidence: item.categoryConfidence,
      
      // Sentiment (prefer manual override)
      sentiment: item.manualSentiment || item.sentiment,
      sentimentSource: item.sentimentOverridden ? 'manual' : 'ai',
      sentimentConfidence: item.sentimentConfidence,
      
      // AI analysis info
      isAiAnalyzed: item.isAiAnalyzed,
      aiAnalyzedAt: item.aiAnalyzedAt,
      aiReasoning: item.aiReasoning,
      
      // Project info
      project: item.project,
      
      // Timestamps
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    const hasMore = offset + limit < totalCount;
    const nextOffset = hasMore ? offset + limit : null;

    return NextResponse.json({
      feedback: transformedFeedback,
      pagination: {
        totalCount,
        limit,
        offset,
        hasMore,
        nextOffset,
      },
      filters: {
        projectId,
        category,
        status,
        sentiment,
        search,
      },
      apiKeyInfo: {
        name: apiKey.name,
        usageCount: apiKey.usageCount,
      },
    });
  } catch (error) {
    logError(error, 'POST /api/mcp/feedback');
    const apiError = handleApiError(error);
    return NextResponse.json(apiError, { status: 500 });
  }
}