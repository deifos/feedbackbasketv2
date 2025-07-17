import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { PrismaClient } from '@/app/generated/prisma';
import { ProjectWithCounts, ApiError } from '@/lib/types/api';
import { projectSchema } from '@/lib/validation';
import { sanitizeProjectName, sanitizeUrl } from '@/lib/sanitization';

const prisma = new PrismaClient();

// GET /api/projects/[id] - Get project details
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

    const { id } = params;

    // Fetch the project with authorization check
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        userId: session.user.id, // Ensure user can only access their own projects
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

    if (!project) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Get pending feedback count
    const pendingFeedback = await prisma.feedback.count({
      where: {
        projectId: project.id,
        status: 'PENDING',
      },
    });

    // Return project with counts
    const projectWithCounts: ProjectWithCounts = {
      ...project,
      _count: {
        feedback: project._count.feedback,
        pendingFeedback: pendingFeedback,
      },
    };

    return NextResponse.json(projectWithCounts);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch project' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

    const { id } = params;

    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validationResult = projectSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
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

    const { name, url } = validationResult.data;

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

    // Check if user already has another project with this name
    const existingProject = await prisma.project.findFirst({
      where: {
        userId: session.user.id,
        name: sanitizedName,
        NOT: {
          id: id, // Exclude the current project from the check
        },
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: 'Conflict', message: 'You already have another project with this name' },
        { status: 409 }
      );
    }

    // Update the project with authorization check
    const updatedProject = await prisma.project.update({
      where: {
        id: id,
        userId: session.user.id, // Ensure user can only update their own projects
      },
      data: {
        name: sanitizedName,
        url: sanitizedUrl,
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

    // Get pending feedback count
    const pendingFeedback = await prisma.feedback.count({
      where: {
        projectId: updatedProject.id,
        status: 'PENDING',
      },
    });

    // Return updated project with counts
    const projectWithCounts: ProjectWithCounts = {
      ...updatedProject,
      _count: {
        feedback: updatedProject._count.feedback,
        pendingFeedback: pendingFeedback,
      },
    };

    return NextResponse.json(projectWithCounts);
  } catch (error) {
    console.error('Error updating project:', error);

    // Handle Prisma record not found (user doesn't own the project)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Not Found', message: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update project' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

    const { id } = params;

    // Delete the project with authorization check
    // This will cascade delete all associated feedback and customizations
    await prisma.project.delete({
      where: {
        id: id,
        userId: session.user.id, // Ensure user can only delete their own projects
      },
    });

    return NextResponse.json({ message: 'Project deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting project:', error);

    // Handle Prisma record not found (user doesn't own the project)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Not Found', message: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete project' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
