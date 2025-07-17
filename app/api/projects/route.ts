import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { PrismaClient } from '@/app/generated/prisma';
import { projectSchema } from '@/lib/validation';
import { sanitizeProjectName, sanitizeUrl } from '@/lib/sanitization';
import { rateLimitProjectCreation } from '@/lib/rate-limit';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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
    const pendingCounts = await prisma.feedback.groupBy({
      by: ['projectId'],
      where: {
        projectId: { in: projects.map(p => p.id) },
        status: 'PENDING',
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
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch projects' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
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

    // Try to scrape and analyze the website for enhanced project data
    let enhancedData = {
      description: undefined as string | undefined,
      logoUrl: undefined as string | undefined,
      ogImageUrl: undefined as string | undefined,
      scrapedMetadata: undefined as any,
      aiGenerated: false,
      lastAnalyzedAt: undefined as Date | undefined,
    };

    try {
      console.log('Attempting to scrape website for enhanced project data:', sanitizedUrl);

      // Call our enhanced scrape endpoint
      const scrapeResponse = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/scrape`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: sanitizedUrl }),
        }
      );

      if (scrapeResponse.ok) {
        const scrapeResult = await scrapeResponse.json();

        if (scrapeResult.success && scrapeResult.data) {
          enhancedData = {
            description: scrapeResult.data.aiDescription || scrapeResult.data.description,
            logoUrl: scrapeResult.data.logoUrl,
            ogImageUrl: scrapeResult.data.ogImageUrl,
            scrapedMetadata: scrapeResult.data.metadata,
            aiGenerated: !!scrapeResult.data.aiDescription,
            lastAnalyzedAt: new Date(),
          };
          console.log('Website analysis successful, enhanced data extracted');
        } else {
          console.log('Website analysis failed:', scrapeResult.error);
        }
      } else {
        console.log('Scrape endpoint returned error status:', scrapeResponse.status);
      }
    } catch (scrapeError) {
      console.error('Error during website analysis:', scrapeError);
      // Continue with project creation even if scraping fails
    }

    // Create the project with enhanced data and default customization
    const project = await prisma.project.create({
      data: {
        name: sanitizedName,
        url: sanitizedUrl,
        userId: session.user.id,
        description: description || enhancedData.description, // User description takes priority
        logoUrl: enhancedData.logoUrl,
        ogImageUrl: enhancedData.ogImageUrl,
        scrapedMetadata: enhancedData.scrapedMetadata,
        aiGenerated: !description && enhancedData.aiGenerated, // Only AI-generated if user didn't provide description
        lastAnalyzedAt: enhancedData.lastAnalyzedAt,
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
  } finally {
    await prisma.$disconnect();
  }
}
