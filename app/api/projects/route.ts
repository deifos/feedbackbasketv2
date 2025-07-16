import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { PrismaClient } from '@/app/generated/prisma';

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

    // Get pending feedback counts for all projects in a single query
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

    // Parse and validate request body
    const body = await request.json();
    const { name, url } = body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Project name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Project URL is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate and sanitize inputs
    const sanitizedName = name.trim();
    const sanitizedUrl = url.trim();

    if (sanitizedName.length === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Project name cannot be empty' },
        { status: 400 }
      );
    }

    if (sanitizedName.length > 100) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Project name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      const urlObj = new URL(sanitizedUrl);
      // Ensure it's http or https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Please provide a valid URL (must include http:// or https://)',
        },
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

    // Create the project with default customization
    const project = await prisma.project.create({
      data: {
        name: sanitizedName,
        url: sanitizedUrl,
        userId: session.user.id,
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
