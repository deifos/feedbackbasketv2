import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { telegramNotifications } = await request.json();

    if (typeof telegramNotifications !== 'boolean') {
      return NextResponse.json({ 
        error: 'telegramNotifications must be a boolean' 
      }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Update telegram notifications setting
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { telegramNotifications },
      select: {
        id: true,
        name: true,
        telegramNotifications: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Telegram notifications ${telegramNotifications ? 'enabled' : 'disabled'} for ${updatedProject.name}`,
      project: updatedProject
    });
  } catch (error) {
    console.error('Error updating project telegram settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Verify project ownership and get telegram settings
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        telegramNotifications: true,
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      project
    });
  } catch (error) {
    console.error('Error fetching project telegram settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}