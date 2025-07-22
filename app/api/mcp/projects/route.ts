import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, getAccessibleProjectIds } from '@/lib/mcp-auth';
import { handleApiError, logError } from '@/lib/error-handler';
import prisma from '@/lib/prisma';

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

    // Get accessible project IDs
    const accessibleProjectIds = getAccessibleProjectIds(apiKey);
    
    if (accessibleProjectIds.length === 0) {
      return NextResponse.json({ 
        projects: [],
        message: 'No projects configured for this API key' 
      });
    }

    // Fetch projects the API key has access to
    const projects = await prisma.project.findMany({
      where: {
        id: { in: accessibleProjectIds },
        userId: apiKey.userId, // Double-check ownership
      },
      select: {
        id: true,
        name: true,
        url: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            feedback: {
              where: {
                isVisible: true, // Only count visible feedback
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Get feedback counts by category for each project
    const projectIds = projects.map(p => p.id);
    
    const categoryStats = await prisma.feedback.groupBy({
      by: ['projectId', 'category'],
      where: {
        projectId: { in: projectIds },
        isVisible: true,
        OR: [
          { category: { not: null } },
          { manualCategory: { not: null } },
        ],
      },
      _count: {
        id: true,
      },
    });

    const statusStats = await prisma.feedback.groupBy({
      by: ['projectId', 'status'],
      where: {
        projectId: { in: projectIds },
        isVisible: true,
      },
      _count: {
        id: true,
      },
    });

    // Transform data to include stats
    const projectsWithStats = projects.map(project => {
      const categoryMap = new Map();
      const statusMap = new Map();
      
      // Process category stats
      categoryStats
        .filter(stat => stat.projectId === project.id)
        .forEach(stat => {
          const category = stat.category || 'UNKNOWN';
          categoryMap.set(category, stat._count.id);
        });
      
      // Process status stats
      statusStats
        .filter(stat => stat.projectId === project.id)
        .forEach(stat => {
          statusMap.set(stat.status, stat._count.id);
        });

      return {
        ...project,
        stats: {
          totalFeedback: project._count.feedback,
          byCategory: {
            BUG: categoryMap.get('BUG') || 0,
            FEATURE: categoryMap.get('FEATURE') || 0,
            REVIEW: categoryMap.get('REVIEW') || 0,
            UNKNOWN: categoryMap.get('UNKNOWN') || 0,
          },
          byStatus: {
            PENDING: statusMap.get('PENDING') || 0,
            REVIEWED: statusMap.get('REVIEWED') || 0,
            DONE: statusMap.get('DONE') || 0,
          },
        },
      };
    });

    return NextResponse.json({ 
      projects: projectsWithStats,
      totalProjects: projectsWithStats.length,
      apiKeyInfo: {
        name: apiKey.name,
        usageCount: apiKey.usageCount,
      },
    });
  } catch (error) {
    logError(error, 'POST /api/mcp/projects');
    const apiError = handleApiError(error);
    return NextResponse.json(apiError, { status: 500 });
  }
}