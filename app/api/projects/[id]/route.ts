import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { sanitizeProjectName } from '@/lib/sanitization';

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

    const projectId = params.id;
    const body = await request.json();

    // Validate that the project belongs to the user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Sanitize inputs
    const updates: Partial<{
      name?: string;
      description?: string | null;
      logoUrl?: string | null;
      ogImageUrl?: string | null;
      aiGenerated?: boolean;
      lastAnalyzedAt?: Date | null;
    }> = {};

    if (body.name) {
      const sanitizedName = sanitizeProjectName(body.name);
      if (!sanitizedName || sanitizedName.length === 0) {
        return NextResponse.json(
          { error: 'Validation Error', message: 'Project name cannot be empty' },
          { status: 400 }
        );
      }
      updates.name = sanitizedName;
    }

    if (body.description !== undefined) {
      updates.description = body.description || null;
      // If description is being manually updated, mark as not AI-generated
      if (body.description && body.description.trim()) {
        updates.aiGenerated = false;
      }
    }

    if (body.logoUrl !== undefined) {
      updates.logoUrl = body.logoUrl || null;
    }

    if (body.ogImageUrl !== undefined) {
      updates.ogImageUrl = body.ogImageUrl || null;
    }

    if (body.aiGenerated !== undefined) {
      updates.aiGenerated = body.aiGenerated;
    }

    if (body.lastAnalyzedAt !== undefined) {
      updates.lastAnalyzedAt = body.lastAnalyzedAt ? new Date(body.lastAnalyzedAt) : null;
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...updates,
        updatedAt: new Date(),
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

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Database error:', error);

    // Handle Prisma unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflict', message: 'A project with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}

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

    const projectId = params.id;

    // Fetch the project with all related data
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
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
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}

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

    const projectId = params.id;

    // Validate that the project belongs to the user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the project (this will cascade delete related data due to foreign key constraints)
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}
