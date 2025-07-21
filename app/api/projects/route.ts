import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { projectSchema } from '@/lib/validation';
import { sanitizeProjectName, sanitizeUrl } from '@/lib/sanitization';
import { rateLimitProjectCreation } from '@/lib/rate-limit';
import { handleApiError, logError } from '@/lib/error-handler';
import { subscriptionService } from '@/lib/services/subscription-service';
import { usageTrackingService } from '@/lib/services/usage-tracking-service';
import prisma from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user's projects with feedback counts
    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        customization: true,
        _count: {
          select: {
            feedback: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Get pending feedback counts for all projects in a single optimized query
    // This now uses the composite index (projectId, status) for better performance
    // Only count visible feedback based on subscription limits
    const pendingCounts = await prisma.feedback.groupBy({
      by: ['projectId'],
      where: {
        projectId: { in: projects.map(p => p.id) },
        status: 'PENDING',
        isVisible: true, // Only count visible feedback based on subscription limits
      },
      _count: {
        id: true,
      },
    });

    // Create a map for quick lookup of pending counts
    const pendingCountMap = new Map(pendingCounts.map(item => [item.projectId, item._count.id]));

    // Transform the data to include both total and pending feedback counts
    const projectsWithCounts = projects.map(project => ({
      ...project,
      _count: {
        feedback: project._count.feedback,
        pendingFeedback: pendingCountMap.get(project.id) || 0,
      },
    }));

    return NextResponse.json(projectsWithCounts);
  } catch (error) {
    logError(error, 'GET /api/projects');
    const apiError = handleApiError(error);
    return NextResponse.json(apiError, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Apply rate limiting for project creation
    const rateLimitResult = rateLimitProjectCreation(request);
    if (!rateLimitResult.isAllowed) {
      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          message: 'Too many project creation attempts. Please try again later.',
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    // Check subscription limits before allowing project creation
    const canCreateProject = await subscriptionService.canCreateProject(session.user.id);
    if (!canCreateProject) {
      const usage = await subscriptionService.getCurrentUsage(session.user.id);

      // Get available upgrade options
      const upgradeOptions = [];
      if (usage.currentPlan === 'FREE') {
        upgradeOptions.push(
          { plan: 'STARTER', projects: 3, price: { monthly: 19, annual: 17 } },
          { plan: 'PRO', projects: 10, price: { monthly: 39, annual: 35 } }
        );
      } else if (usage.currentPlan === 'STARTER') {
        upgradeOptions.push({ plan: 'PRO', projects: 10, price: { monthly: 39, annual: 35 } });
      }

      return NextResponse.json(
        {
          error: 'Subscription Limit Exceeded',
          code: 'PROJECT_LIMIT_REACHED',
          message: `You've reached your project limit of ${usage.projects.limit} for the ${usage.currentPlan} plan. Please upgrade to create more projects.`,
          details: {
            currentPlan: usage.currentPlan,
            projectLimit: usage.projects.limit,
            projectsUsed: usage.projects.used,
            upgradeOptions,
            upgradeRequired: true,
          },
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validationResult = projectSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid input data',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { name, url, description } = validationResult.data;

    // Sanitize inputs to prevent XSS and other attacks
    const sanitizedName = sanitizeProjectName(name);
    const sanitizedUrl = sanitizeUrl(url);

    // Double-check sanitized inputs aren't empty after sanitization
    if (!sanitizedName || sanitizedName.length === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Project name cannot be empty after sanitization' },
        { status: 400 }
      );
    }

    if (!sanitizedUrl || sanitizedUrl.length === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Check if user already has a project with this name
    const existingProject = await prisma.project.findFirst({
      where: {
        userId: session.user.id,
        name: sanitizedName,
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: 'Conflict', message: 'You already have a project with this name' },
        { status: 409 }
      );
    }

    // Create the project with user-provided data only (no auto-scraping)
    const project = await prisma.project.create({
      data: {
        name: sanitizedName,
        url: sanitizedUrl,
        userId: session.user.id,
        description: description,
        customization: {
          create: {
            buttonColor: '#3b82f6',
            buttonRadius: 8,
            buttonLabel: 'Feedback',
            successMessage: 'Thank you for your feedback!',
          },
        },
      },
      include: {
        customization: true,
        _count: {
          select: {
            feedback: true,
          },
        },
      },
    });

    // Track project creation for usage limits
    try {
      await usageTrackingService.trackProjectCreation(session.user.id, project.id);
    } catch (error) {
      console.error('Failed to track project creation:', error);
      // Don't fail the project creation if usage tracking fails
    }

    // Return the created project with counts
    const projectWithCounts = {
      ...project,
      _count: {
        feedback: 0,
        pendingFeedback: 0,
      },
    };

    return NextResponse.json(projectWithCounts, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);

    // Handle Prisma unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflict', message: 'A project with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create project' },
      { status: 500 }
    );
  }
}
