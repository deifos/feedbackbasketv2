import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { PrismaClient } from '@/app/generated/prisma';
import { CustomizationUpdateRequest } from '@/lib/types/api';

const prisma = new PrismaClient();

// GET /api/projects/[id]/customization - Get project customization
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // First verify the project exists and user owns it
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        customization: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // If no customization exists, create one with defaults
    if (!project.customization) {
      const customization = await prisma.projectCustomization.create({
        data: {
          projectId: project.id,
          buttonColor: '#3b82f6',
          buttonRadius: 8,
          buttonLabel: 'Feedback',
          successMessage: 'Thank you for your feedback!',
        },
      });

      return NextResponse.json(customization);
    }

    return NextResponse.json(project.customization);
  } catch (error) {
    console.error('Error fetching project customization:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch project customization' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/projects/[id]/customization - Update project customization
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Parse and validate request body
    const body = await request.json();
    const { buttonColor, buttonRadius, buttonLabel, introMessage, successMessage } = body;

    // Validate button color (should be a valid hex color)
    if (buttonColor && typeof buttonColor === 'string') {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(buttonColor)) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Button color must be a valid hex color (e.g., #3b82f6)',
          },
          { status: 400 }
        );
      }
    }

    // Validate button radius (should be a number between 0 and 50)
    if (buttonRadius !== undefined) {
      if (typeof buttonRadius !== 'number' || buttonRadius < 0 || buttonRadius > 50) {
        return NextResponse.json(
          { error: 'Validation Error', message: 'Button radius must be a number between 0 and 50' },
          { status: 400 }
        );
      }
    }

    // Validate button label (should be a non-empty string, max 50 characters)
    if (buttonLabel !== undefined) {
      if (typeof buttonLabel !== 'string' || buttonLabel.trim().length === 0) {
        return NextResponse.json(
          { error: 'Validation Error', message: 'Button label must be a non-empty string' },
          { status: 400 }
        );
      }
      if (buttonLabel.trim().length > 50) {
        return NextResponse.json(
          { error: 'Validation Error', message: 'Button label must be 50 characters or less' },
          { status: 400 }
        );
      }
    }

    // Validate intro message (should be a non-empty string, max 300 characters)
    if (introMessage !== undefined) {
      if (typeof introMessage !== 'string' || introMessage.trim().length === 0) {
        return NextResponse.json(
          { error: 'Validation Error', message: 'Intro message must be a non-empty string' },
          { status: 400 }
        );
      }
      if (introMessage.trim().length > 300) {
        return NextResponse.json(
          { error: 'Validation Error', message: 'Intro message must be 300 characters or less' },
          { status: 400 }
        );
      }
    }

    // Validate success message (should be a non-empty string, max 200 characters)
    if (successMessage !== undefined) {
      if (typeof successMessage !== 'string' || successMessage.trim().length === 0) {
        return NextResponse.json(
          { error: 'Validation Error', message: 'Success message must be a non-empty string' },
          { status: 400 }
        );
      }
      if (successMessage.trim().length > 200) {
        return NextResponse.json(
          { error: 'Validation Error', message: 'Success message must be 200 characters or less' },
          { status: 400 }
        );
      }
    }

    // First verify the project exists and user owns it
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        customization: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Prepare update data (only include fields that were provided)
    const updateData: any = {};
    if (buttonColor !== undefined) updateData.buttonColor = buttonColor;
    if (buttonRadius !== undefined) updateData.buttonRadius = buttonRadius;
    if (buttonLabel !== undefined) updateData.buttonLabel = buttonLabel.trim();
    if (introMessage !== undefined) updateData.introMessage = introMessage.trim();
    if (successMessage !== undefined) updateData.successMessage = successMessage.trim();

    let customization;

    if (project.customization) {
      // Update existing customization
      customization = await prisma.projectCustomization.update({
        where: {
          projectId: project.id,
        },
        data: updateData,
      });
    } else {
      // Create new customization with provided values and defaults for missing ones
      customization = await prisma.projectCustomization.create({
        data: {
          projectId: project.id,
          buttonColor: buttonColor || '#3b82f6',
          buttonRadius: buttonRadius !== undefined ? buttonRadius : 8,
          buttonLabel: buttonLabel ? buttonLabel.trim() : 'Feedback',
          introMessage: introMessage
            ? introMessage.trim()
            : "We'd love to hear your thoughts! Your feedback helps us improve.",
          successMessage: successMessage ? successMessage.trim() : 'Thank you for your feedback!',
        },
      });
    }

    return NextResponse.json(customization);
  } catch (error) {
    console.error('Error updating project customization:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update project customization' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
