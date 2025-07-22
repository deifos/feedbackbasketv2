import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, getAccessibleProjectIds, hasProjectAccess } from '@/lib/mcp-auth';
import { handleApiError, logError } from '@/lib/error-handler';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Query parameters schema for bug reports
const bugQuerySchema = z.object({
  projectId: z.string().optional(),
  status: z.enum(['PENDING', 'REVIEWED', 'DONE']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  includeNotes: z.coerce.boolean().default(false),
  severity: z.enum(['high', 'medium', 'low']).optional(), // Based on sentiment/content analysis
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
    const queryResult = bugQuerySchema.safeParse(body);
    
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

    const { projectId, status, limit, offset, search, includeNotes, severity } = queryResult.data;

    // Get accessible project IDs
    const accessibleProjectIds = getAccessibleProjectIds(apiKey);
    
    if (accessibleProjectIds.length === 0) {
      return NextResponse.json({ 
        bugReports: [],
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

    // Build where clause for bug reports only
    const whereClause: any = {
      projectId: projectId ? projectId : { in: accessibleProjectIds },
      isVisible: true, // Only return visible feedback based on subscription limits
      OR: [
        { category: 'BUG' },
        { manualCategory: 'BUG' },
      ],
    };

    // Add additional filters
    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.content = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Add severity filter based on sentiment (negative sentiment = higher severity)
    if (severity) {
      if (severity === 'high') {
        whereClause.OR = [
          ...whereClause.OR,
          { sentiment: 'NEGATIVE' },
          { manualSentiment: 'NEGATIVE' },
        ];
      } else if (severity === 'medium') {
        whereClause.OR = [
          ...whereClause.OR,
          { sentiment: 'NEUTRAL' },
          { manualSentiment: 'NEUTRAL' },
        ];
      } else if (severity === 'low') {
        whereClause.OR = [
          ...whereClause.OR,
          { sentiment: 'POSITIVE' },
          { manualSentiment: 'POSITIVE' },
        ];
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.feedback.count({
      where: whereClause,
    });

    // Fetch bug reports with project info
    const bugReports = await prisma.feedback.findMany({
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
      orderBy: [
        { createdAt: 'desc' }, // Most recent first
        { sentimentConfidence: 'desc' }, // Higher confidence first
      ],
      take: limit,
      skip: offset,
    });

    // Transform data for MCP response with bug-specific fields
    const transformedBugReports = bugReports.map(item => {
      // Determine severity based on sentiment
      let severity = 'medium';
      const sentiment = item.manualSentiment || item.sentiment;
      if (sentiment === 'NEGATIVE') severity = 'high';
      else if (sentiment === 'POSITIVE') severity = 'low';

      return {
        id: item.id,
        content: item.content,
        email: item.email,
        status: item.status,
        ...(includeNotes && { notes: item.notes }),
        
        // Bug-specific classification
        severity,
        category: item.manualCategory || item.category,
        categorySource: item.categoryOverridden ? 'manual' : 'ai',
        categoryConfidence: item.categoryConfidence,
        
        // Sentiment (helps determine severity)
        sentiment: item.manualSentiment || item.sentiment,
        sentimentSource: item.sentimentOverridden ? 'manual' : 'ai',
        sentimentConfidence: item.sentimentConfidence,
        
        // AI analysis
        isAiAnalyzed: item.isAiAnalyzed,
        aiAnalyzedAt: item.aiAnalyzedAt,
        aiReasoning: item.aiReasoning,
        
        // Project context
        project: item.project,
        
        // Timestamps
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    // Calculate bug statistics
    const bugStats = {
      totalBugs: totalCount,
      bySeverity: {
        high: transformedBugReports.filter(bug => bug.severity === 'high').length,
        medium: transformedBugReports.filter(bug => bug.severity === 'medium').length,
        low: transformedBugReports.filter(bug => bug.severity === 'low').length,
      },
      byStatus: {
        pending: transformedBugReports.filter(bug => bug.status === 'PENDING').length,
        reviewed: transformedBugReports.filter(bug => bug.status === 'REVIEWED').length,
        done: transformedBugReports.filter(bug => bug.status === 'DONE').length,
      },
    };

    const hasMore = offset + limit < totalCount;
    const nextOffset = hasMore ? offset + limit : null;

    return NextResponse.json({
      bugReports: transformedBugReports,
      stats: bugStats,
      pagination: {
        totalCount,
        limit,
        offset,
        hasMore,
        nextOffset,
      },
      filters: {
        projectId,
        status,
        severity,
        search,
      },
      apiKeyInfo: {
        name: apiKey.name,
        usageCount: apiKey.usageCount,
      },
    });
  } catch (error) {
    logError(error, 'POST /api/mcp/feedback/bugs');
    const apiError = handleApiError(error);
    return NextResponse.json(apiError, { status: 500 });
  }
}